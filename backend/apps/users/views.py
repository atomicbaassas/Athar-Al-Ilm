import re
import secrets

import jwt
from datetime import datetime, timezone
from django.conf import settings
from django.contrib.auth.hashers import make_password
from mongoengine.errors import NotUniqueError
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework import status

from apps.emails.system_templates import send_system_email
from apps.emails.transactional import verification_email_body, password_reset_email_body
from .google import GoogleTokenError, verify_google_id_token
from .models import User
from .serializers import (
    RegisterSerializer, LoginSerializer,
    UserProfileSerializer, TokenRefreshSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, VerifyEmailSerializer,
)
from .utils import (
    generate_tokens, decode_refresh_token,
    generate_action_token, decode_action_token, assert_token_version,
)

_USERNAME_SAFE = re.compile(r'[^a-z0-9_-]')
_GOOGLE_ERRORS = {
    'not_configured': (status.HTTP_503_SERVICE_UNAVAILABLE, 'Google sign-in is not configured.'),
    'unavailable': (status.HTTP_503_SERVICE_UNAVAILABLE, 'Google sign-in is temporarily unavailable.'),
    'unverified_email': (status.HTTP_401_UNAUTHORIZED, 'Google did not verify this email.'),
    'invalid': (status.HTTP_401_UNAUTHORIZED, 'Google sign-in failed.'),
}


def _send_verification_email(user):
    token = generate_action_token(user, 'verify_email', minutes=60 * 24)
    url = f"{settings.SITE_URL.rstrip('/')}/verify-email?token={token}"
    context = {'full_name': user.full_name or user.username, 'email': user.email, 'verify_url': url}
    send_system_email('verification', user.email, context,
                       fallback_subject='Verify your Athar Al Ilm email',
                       fallback_html=verification_email_body(url))


# Rate limits (scopes/rates in settings REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'])
# protect the credential and email-sending endpoints from brute force and abuse.
# Throttle counters live in the default cache (Redis in prod), shared across
# all gunicorn workers.

class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-register'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user = User(
            email=data['email'],
            username=data['username'],
            full_name=data.get('full_name', ''),
        )
        user.set_password(data['password'])
        user.save()
        _send_verification_email(user)

        # No session until the mailbox is proven (stops email squatting).
        return Response(
            {
                'user': UserProfileSerializer(user).data,
                'detail': 'Check your email to verify your account before signing in.',
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-login'

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        try:
            user = User.objects.get(email=data['email'].lower())
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(data['password']):
            return Response(
                {'error': 'Invalid email or password.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.is_active:
            return Response(
                {'error': 'This account has been deactivated.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_verified:
            return Response(
                {
                    'error': 'Please verify your email before signing in.',
                    'code': 'email_unverified',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        user.last_login = datetime.now(timezone.utc)
        user.save()

        tokens = generate_tokens(user)
        return Response({'user': UserProfileSerializer(user).data, **tokens})


def _username_from_email(email):
    local = email.split('@', 1)[0]
    base = _USERNAME_SAFE.sub('', local.lower())[:40] or 'learner'
    for n in range(21):
        suffix = '' if n == 0 else str(n)
        candidate = f'{base[:50 - len(suffix)]}{suffix}'
        if not User.objects(username=candidate).first():
            return candidate
    return f'{base[:42]}{secrets.token_hex(4)}'


class GoogleConfigView(APIView):
    """Public client id so the login page can render the GIS button."""
    permission_classes = [AllowAny]

    def get(self, request):
        client_id = (settings.GOOGLE_CLIENT_ID or '').strip()
        return Response({'client_id': client_id or None})


class GoogleLoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-login'

    def post(self, request):
        try:
            claims = verify_google_id_token(request.data.get('id_token'))
        except GoogleTokenError as exc:
            http_status, message = _GOOGLE_ERRORS.get(exc.code, _GOOGLE_ERRORS['invalid'])
            return Response({'error': message}, status=http_status)

        user = User.objects(email=claims['email']).first()
        if user is None:
            user = User(
                email=claims['email'],
                username=_username_from_email(claims['email']),
                full_name=claims['name'],
                role='learner',
                is_verified=True,
                password_hash=make_password(None),
            )
            try:
                user.save()
            except NotUniqueError:
                user.username = f'{user.username[:42]}{secrets.token_hex(4)}'
                user.save()
        else:
            if not user.is_active:
                return Response(
                    {'error': 'This account has been deactivated.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Google proved the mailbox. Never copy role or sections from the token.
            if not user.is_verified:
                user.is_verified = True
            if claims['name'] and not user.full_name:
                user.full_name = claims['name']

        user.last_login = datetime.now(timezone.utc)
        user.save()
        tokens = generate_tokens(user)
        return Response({'user': UserProfileSerializer(user).data, **tokens})


class TokenRefreshView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-refresh'

    def post(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = decode_refresh_token(serializer.validated_data['refresh'])
            user = User.objects.get(id=payload['user_id'])
            if not user.is_active:
                return Response(
                    {'error': 'This account has been deactivated.'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if not user.is_verified:
                return Response(
                    {'error': 'Please verify your email before signing in.', 'code': 'email_unverified'},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            assert_token_version(payload, user)
            tokens = generate_tokens(user)
            return Response({'access': tokens['access']})
        except jwt.ExpiredSignatureError:
            return Response(
                {'error': 'Refresh token has expired. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid refresh token.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        if 'full_name' in request.data:
            user.full_name = request.data['full_name']
        if 'profile' in request.data:
            from .models import UserProfile
            profile_data = request.data['profile']
            if not user.profile:
                user.profile = UserProfile()
            for field in ('bio', 'country', 'preferred_language'):
                if field in profile_data:
                    setattr(user.profile, field, profile_data[field])
        user.save()
        return Response(UserProfileSerializer(user).data)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-verify'

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = decode_action_token(serializer.validated_data['token'], 'verify_email')
            user = User.objects.get(id=payload['user_id'])
            assert_token_version(payload, user)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'This verification link has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return Response({'error': 'Invalid verification link.'}, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_verified:
            user.is_verified = True
            user.save()

        tokens = generate_tokens(user)
        return Response({'verified': True, 'user': UserProfileSerializer(user).data, **tokens})


class ResendVerificationView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-resend'

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        user = None
        if getattr(request.user, 'is_authenticated', False):
            user = request.user
        elif email:
            user = User.objects(email=email).first()
        else:
            return Response({'email': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Same shape whether or not the account exists / is already verified.
        if user and not user.is_verified:
            _send_verification_email(user)
        return Response({'detail': 'If that account needs verification, a new email has been sent.'})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-forgot'

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects(email=serializer.validated_data['email'].lower()).first()
        if user:
            token = generate_action_token(user, 'reset_password', minutes=30)
            url = f"{settings.SITE_URL.rstrip('/')}/reset-password?token={token}"
            context = {'full_name': user.full_name or user.username, 'email': user.email, 'reset_url': url}
            send_system_email('password_reset', user.email, context,
                               fallback_subject='Reset your Athar Al Ilm password',
                               fallback_html=password_reset_email_body(url))

        # Always the same response — don't reveal whether the account exists.
        return Response({'detail': 'If an account exists for that email, a reset link has been sent.'})


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth-reset'

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = decode_action_token(serializer.validated_data['token'], 'reset_password')
            user = User.objects.get(id=payload['user_id'])
            assert_token_version(payload, user)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'This reset link has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except (jwt.InvalidTokenError, User.DoesNotExist):
            return Response({'error': 'Invalid reset link.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(serializer.validated_data['password'])
        # Reset link landed in the mailbox — treat as verified.
        user.is_verified = True
        user.save()
        return Response({'reset': True})
