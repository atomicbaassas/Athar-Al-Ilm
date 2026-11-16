import pytest
from rest_framework.test import APIClient

from .google import GoogleTokenError, verify_google_id_token
from .models import User
from .utils import generate_action_token


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture(autouse=True)
def no_real_email(monkeypatch):
    """Every test in this module hits register/forgot-password, which enqueue a
    Celery email task via send_system_email — stub `.delay` so tests never need
    a live broker."""
    monkeypatch.setattr('apps.emails.system_templates.send_transactional_email.delay', lambda *a, **k: None)


@pytest.fixture(autouse=True)
def clean_test_users():
    """MongoEngine writes aren't wrapped in Django's per-test transaction, so
    @example.com users created by this module would otherwise leak across
    test runs and collide on the unique email/username indexes."""
    yield
    User.objects(email__endswith='@example.com').delete()


@pytest.mark.django_db
class TestAuthEndpoints:

    def test_register_success(self, client):
        response = client.post('/api/v1/auth/register/', {
            'email': 'test@example.com',
            'username': 'testuser',
            'password': 'strongpass123',
            'full_name': 'Test User',
        }, format='json')
        assert response.status_code == 201
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert response.data['user']['email'] == 'test@example.com'

    def test_register_duplicate_email(self, client):
        data = {'email': 'dup@example.com', 'username': 'user1', 'password': 'strongpass123'}
        client.post('/api/v1/auth/register/', data, format='json')
        response = client.post('/api/v1/auth/register/', {**data, 'username': 'user2'}, format='json')
        assert response.status_code == 400

    def test_login_success(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'login@example.com',
            'username': 'loginuser',
            'password': 'strongpass123',
        }, format='json')
        response = client.post('/api/v1/auth/login/', {
            'email': 'login@example.com',
            'password': 'strongpass123',
        }, format='json')
        assert response.status_code == 200
        assert 'access' in response.data

    def test_login_wrong_password(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'wrong@example.com',
            'username': 'wronguser',
            'password': 'correctpass123',
        }, format='json')
        response = client.post('/api/v1/auth/login/', {
            'email': 'wrong@example.com',
            'password': 'wrongpassword',
        }, format='json')
        assert response.status_code == 401

    def test_profile_requires_auth(self, client):
        response = client.get('/api/v1/auth/profile/')
        assert response.status_code == 401

    def test_profile_with_token(self, client):
        reg = client.post('/api/v1/auth/register/', {
            'email': 'profile@example.com',
            'username': 'profileuser',
            'password': 'strongpass123',
        }, format='json')
        token = reg.data['access']
        client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        response = client.get('/api/v1/auth/profile/')
        assert response.status_code == 200
        assert response.data['email'] == 'profile@example.com'


@pytest.mark.django_db
class TestEmailVerification:

    def test_register_leaves_user_unverified(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'unverified@example.com', 'username': 'unverifieduser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='unverified@example.com')
        assert user.is_verified is False

    def test_verify_email_success(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'verify@example.com', 'username': 'verifyuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='verify@example.com')
        token = generate_action_token(user, 'verify_email', minutes=60)

        response = client.post('/api/v1/auth/verify-email/', {'token': token}, format='json')
        assert response.status_code == 200
        user.reload()
        assert user.is_verified is True

    def test_verify_email_invalid_token(self, client):
        response = client.post('/api/v1/auth/verify-email/', {'token': 'not-a-real-token'}, format='json')
        assert response.status_code == 400

    def test_verify_email_wrong_action_token_rejected(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'wrongaction@example.com', 'username': 'wrongactionuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='wrongaction@example.com')
        reset_token = generate_action_token(user, 'reset_password', minutes=30)

        response = client.post('/api/v1/auth/verify-email/', {'token': reset_token}, format='json')
        assert response.status_code == 400
        user.reload()
        assert user.is_verified is False

    def test_resend_verification_requires_auth(self, client):
        response = client.post('/api/v1/auth/resend-verification/')
        assert response.status_code == 401

    def test_resend_verification_when_already_verified(self, client):
        reg = client.post('/api/v1/auth/register/', {
            'email': 'already@example.com', 'username': 'alreadyuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='already@example.com')
        user.is_verified = True
        user.save()
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")

        response = client.post('/api/v1/auth/resend-verification/')
        assert response.status_code == 200
        assert 'already verified' in response.data['detail']


@pytest.mark.django_db
class TestLoginThrottle:

    def test_login_throttled_after_rate_limit(self, client):
        """auth-login is limited to 10/min per IP; the 11th rapid attempt gets
        429. Relies on conftest.py clearing the cache between tests, so the
        counter always starts at zero here (and never leaks into other tests)."""
        payload = {'email': 'brute@example.com', 'password': 'wrongpassword'}
        for _ in range(10):
            response = client.post('/api/v1/auth/login/', payload, format='json')
            assert response.status_code == 401
        response = client.post('/api/v1/auth/login/', payload, format='json')
        assert response.status_code == 429
        assert response.has_header('Retry-After')


@pytest.mark.django_db
class TestForgotResetPassword:

    def test_forgot_password_always_returns_200(self, client):
        response = client.post('/api/v1/auth/forgot-password/', {'email': 'nobody@example.com'}, format='json')
        assert response.status_code == 200

    def test_reset_password_success(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'reset@example.com', 'username': 'resetuser', 'password': 'oldpassword1',
        }, format='json')
        user = User.objects.get(email='reset@example.com')
        token = generate_action_token(user, 'reset_password', minutes=30)

        response = client.post('/api/v1/auth/reset-password/', {'token': token, 'password': 'newpassword1'}, format='json')
        assert response.status_code == 200

        login = client.post('/api/v1/auth/login/', {'email': 'reset@example.com', 'password': 'newpassword1'}, format='json')
        assert login.status_code == 200

    def test_reset_password_invalid_token(self, client):
        response = client.post('/api/v1/auth/reset-password/', {'token': 'garbage', 'password': 'newpassword1'}, format='json')
        assert response.status_code == 400

    def test_reset_password_wrong_action_token_rejected(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'verifynotreset@example.com', 'username': 'verifynotresetuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='verifynotreset@example.com')
        verify_token = generate_action_token(user, 'verify_email', minutes=60)

        response = client.post('/api/v1/auth/reset-password/', {'token': verify_token, 'password': 'newpassword1'}, format='json')
        assert response.status_code == 400

    def test_reset_password_too_short(self, client):
        client.post('/api/v1/auth/register/', {
            'email': 'shortpass@example.com', 'username': 'shortpassuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='shortpass@example.com')
        token = generate_action_token(user, 'reset_password', minutes=30)

        response = client.post('/api/v1/auth/reset-password/', {'token': token, 'password': 'short'}, format='json')
        assert response.status_code == 400


def _claims(email='google@example.com', name='Google User'):
    return {'email': email, 'sub': 'sub-1', 'name': name}


class _TokenInfo:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


@pytest.mark.django_db
class TestGoogleSignIn:

    def test_config_hides_client_when_unset(self, client, settings):
        settings.GOOGLE_CLIENT_ID = ''
        response = client.get('/api/v1/auth/google/config/')
        assert response.status_code == 200
        assert response.data['client_id'] is None

    def test_config_returns_client_id(self, client, settings):
        settings.GOOGLE_CLIENT_ID = 'web-client'
        response = client.get('/api/v1/auth/google/config/')
        assert response.data['client_id'] == 'web-client'

    def test_login_refused_when_unconfigured(self, client, settings):
        settings.GOOGLE_CLIENT_ID = ''
        response = client.post('/api/v1/auth/google/', {'id_token': 'tok'}, format='json')
        assert response.status_code == 503

    def test_creates_learner_without_admin_sections(self, client, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'web-client'
        monkeypatch.setattr('apps.users.views.verify_google_id_token', lambda token: _claims())
        response = client.post('/api/v1/auth/google/', {'id_token': 'good'}, format='json')
        assert response.status_code == 200
        assert response.data['access']
        assert response.data['refresh']
        assert response.data['user']['email'] == 'google@example.com'
        assert response.data['user']['role'] == 'learner'
        assert response.data['user']['sections'] == []
        user = User.objects.get(email='google@example.com')
        assert user.is_verified is True
        assert user.check_password('not-a-password') is False

    def test_existing_user_keeps_role_and_password(self, client, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'web-client'
        client.post('/api/v1/auth/register/', {
            'email': 'both@example.com', 'username': 'bothuser', 'password': 'strongpass123',
        }, format='json')
        user = User.objects.get(email='both@example.com')
        user.role = 'admin'
        user.save()
        monkeypatch.setattr(
            'apps.users.views.verify_google_id_token',
            lambda token: _claims('both@example.com', ''),
        )
        response = client.post('/api/v1/auth/google/', {'id_token': 'good'}, format='json')
        assert response.status_code == 200
        assert response.data['user']['role'] == 'admin'
        assert response.data['user']['sections']
        password = client.post('/api/v1/auth/login/', {
            'email': 'both@example.com', 'password': 'strongpass123',
        }, format='json')
        assert password.status_code == 200

    def test_deactivated_account_rejected(self, client, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'web-client'
        monkeypatch.setattr('apps.users.views.verify_google_id_token', lambda token: _claims('off@example.com'))
        client.post('/api/v1/auth/google/', {'id_token': 'good'}, format='json')
        user = User.objects.get(email='off@example.com')
        user.is_active = False
        user.save()
        response = client.post('/api/v1/auth/google/', {'id_token': 'good'}, format='json')
        assert response.status_code == 403

    def test_invalid_token(self, client, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'web-client'

        def boom(token):
            raise GoogleTokenError('invalid')

        monkeypatch.setattr('apps.users.views.verify_google_id_token', boom)
        response = client.post('/api/v1/auth/google/', {'id_token': 'bad'}, format='json')
        assert response.status_code == 401

    def test_verifier_rejects_wrong_audience(self, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'ours'
        monkeypatch.setattr(
            'apps.users.google.requests.get',
            lambda *a, **k: _TokenInfo(200, {
                'aud': 'theirs',
                'iss': 'https://accounts.google.com',
                'email': 'a@example.com',
                'email_verified': 'true',
                'sub': '1',
            }),
        )
        with pytest.raises(GoogleTokenError) as caught:
            verify_google_id_token('tok')
        assert caught.value.code == 'invalid'

    def test_verifier_accepts_matching_audience(self, settings, monkeypatch):
        settings.GOOGLE_CLIENT_ID = 'ours'
        monkeypatch.setattr(
            'apps.users.google.requests.get',
            lambda *a, **k: _TokenInfo(200, {
                'aud': 'ours',
                'iss': 'https://accounts.google.com',
                'email': 'Learner@example.com',
                'email_verified': True,
                'name': 'A Learner',
                'sub': '99',
            }),
        )
        claims = verify_google_id_token('tok')
        assert claims['email'] == 'learner@example.com'
        assert claims['name'] == 'A Learner'
