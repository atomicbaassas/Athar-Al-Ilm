import os

import pytest
from rest_framework.test import APIClient

from apps.common.permissions import admin_role_required
from apps.integrations.views import _mask

HAS_MONGO = bool(os.environ.get('MONGO_HOST', '').strip())
needs_mongo = pytest.mark.skipif(not HAS_MONGO, reason='MONGO_HOST not set')


def test_mask_hides_secret():
    assert _mask('') == ''
    assert _mask('ab') == '••••'
    assert _mask('paV29H2gm56kvLP').endswith('kvLP')
    assert 'paV29' not in _mask('paV29H2gm56kvLP')


def test_admin_role_permission_only_admin():
    perm = admin_role_required()()

    class Req:
        def __init__(self, role):
            self.user = type('U', (), {'is_authenticated': True, 'role': role})()

    assert perm.has_permission(Req('admin'), None) is True
    assert perm.has_permission(Req('scholar'), None) is False
    assert perm.has_permission(Req('learner'), None) is False


@pytest.fixture
def admin_user():
    from apps.users.models import User
    u = User(
        email='admin-int@example.com',
        username='admin_int',
        role='admin',
        is_verified=True,
        is_active=True,
    )
    u.set_password('Password123!')
    u.save()
    return u


@pytest.fixture
def scholar_user():
    from apps.users.models import User
    u = User(
        email='scholar-int@example.com',
        username='scholar_int',
        role='scholar',
        is_verified=True,
        is_active=True,
    )
    u.set_password('Password123!')
    u.save()
    return u


@pytest.fixture(autouse=True)
def clean_integration_docs():
    if not HAS_MONGO:
        yield
        return
    from apps.emails.models import EmailSettings
    from apps.integrations.models import IntegrationSettings
    from apps.users.models import User
    yield
    IntegrationSettings.objects.delete()
    EmailSettings.objects.delete()
    User.objects(email__endswith='-int@example.com').delete()


def _auth(client, user):
    from apps.users.utils import generate_tokens
    tokens = generate_tokens(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")


@needs_mongo
def test_admin_can_set_and_mask_islamhouse_key(admin_user, settings):
    settings.ATHAR_INTERNAL_TOKEN = 'test-internal'
    client = APIClient()
    _auth(client, admin_user)

    res = client.patch(
        '/api/v1/integrations/admin/settings/',
        {'islamhouse_api_key': 'paV29H2gm56kvLP'},
        format='json',
    )
    assert res.status_code == 200
    assert res.data['islamhouse_api_key']['has_key'] is True
    assert res.data['islamhouse_api_key']['key_source'] == 'admin'
    assert res.data['islamhouse_api_key']['key_hint'].endswith('kvLP')
    assert 'paV29H2gm56kvLP' not in str(res.data)

    raw = client.get(
        '/api/v1/integrations/internal/keys/',
        HTTP_X_ATHAR_INTERNAL_TOKEN='test-internal',
    )
    assert raw.status_code == 200
    assert raw.data['islamhouse_api_key'] == 'paV29H2gm56kvLP'


@needs_mongo
def test_scholar_cannot_access_integrations(scholar_user):
    client = APIClient()
    _auth(client, scholar_user)
    res = client.get('/api/v1/integrations/admin/settings/')
    assert res.status_code == 403


@needs_mongo
def test_internal_keys_reject_missing_token(settings):
    settings.ATHAR_INTERNAL_TOKEN = 'test-internal'
    client = APIClient()
    res = client.get('/api/v1/integrations/internal/keys/')
    assert res.status_code == 401


@needs_mongo
def test_resend_key_syncs_email_settings(admin_user):
    from apps.emails.models import EmailSettings
    client = APIClient()
    _auth(client, admin_user)
    res = client.patch(
        '/api/v1/integrations/admin/settings/',
        {'resend_api_key': 're_test_key_abc'},
        format='json',
    )
    assert res.status_code == 200
    email = EmailSettings.get_solo()
    assert email.host == 'smtp.resend.com'
    assert email.password == 're_test_key_abc'
    assert email.use_ssl is True
