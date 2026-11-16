from datetime import datetime, timezone

from django.conf import settings as django_settings
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import admin_role_required
from apps.emails.models import EmailSettings

from .models import IntegrationSettings

KEY_FIELDS = (
    'islamhouse_api_key',
    'dorar_api_key',
    'resend_api_key',
    'youtube_api_key',
)

ENV_FOR = {
    'islamhouse_api_key': 'ISLAMHOUSE_API_KEY',
    'dorar_api_key': 'DORAR_API_KEY',
    'resend_api_key': 'RESEND_API_KEY',
    'youtube_api_key': 'YOUTUBE_API_KEY',
}


def _mask(key):
    key = (key or '').strip()
    if not key:
        return ''
    return '••••' + key[-4:] if len(key) >= 4 else '••••'


def _env(name):
    return (getattr(django_settings, name, '') or '').strip()


def _db_or_env(db_value, env_name):
    db = (db_value or '').strip()
    if db:
        return db, 'admin'
    env = _env(env_name)
    if env:
        return env, 'env'
    return '', 'none'


def _effective_resend(s):
    value, source = _db_or_env(s.resend_api_key, 'RESEND_API_KEY')
    if value:
        return value, source
    email = EmailSettings.get_solo()
    if (email.password or '').strip():
        return email.password.strip(), 'email_settings'
    smtp = _env('EMAIL_HOST_PASSWORD')
    if smtp:
        return smtp, 'env'
    return '', 'none'


def _settings_payload(s):
    out = {}
    for field, env_name in ENV_FOR.items():
        if field == 'resend_api_key':
            value, source = _effective_resend(s)
            stored = (s.resend_api_key or '').strip()
            out[field] = {
                'has_key': bool(value),
                'key_hint': _mask(stored),
                'key_source': source,
            }
            continue
        value, source = _db_or_env(getattr(s, field, ''), env_name)
        out[field] = {
            'has_key': bool(value),
            'key_hint': _mask(getattr(s, field, '')),
            'key_source': source,
        }

    channel_db = (s.youtube_channel_id or '').strip()
    channel_env = _env('YOUTUBE_CHANNEL_ID')
    return {
        **out,
        'youtube_channel_id': channel_db,
        'youtube_channel_id_effective': channel_db or channel_env,
        'youtube_channel_id_source': (
            'admin' if channel_db else ('env' if channel_env else 'none')
        ),
        'updated_at': s.updated_at.isoformat() if s.updated_at else None,
    }


def _apply_key_patch(s, data, field):
    if data.get(f'clear_{field}') is True:
        setattr(s, field, '')
        return
    raw = data.get(field)
    if isinstance(raw, str) and raw.strip():
        setattr(s, field, raw.strip())


def _sync_resend_to_email(data):
    email = EmailSettings.get_solo()
    if data.get('clear_resend_api_key') is True:
        if (email.host or '').strip() in ('', 'smtp.resend.com'):
            email.password = ''
            email.updated_at = datetime.now(timezone.utc)
            email.save()
        return
    if not (isinstance(data.get('resend_api_key'), str) and data['resend_api_key'].strip()):
        return
    email.host = (email.host or '').strip() or 'smtp.resend.com'
    email.port = email.port or 465
    email.username = (email.username or '').strip() or 'resend'
    email.use_ssl = True
    email.use_tls = False
    email.password = data['resend_api_key'].strip()
    if not (email.from_email or '').strip():
        email.from_email = django_settings.DEFAULT_FROM_EMAIL
    email.updated_at = datetime.now(timezone.utc)
    email.save()


class AdminIntegrationSettingsView(APIView):
    """Superadmin-only: enter/replace integration API keys (masked on read)."""

    permission_classes = [admin_role_required()]

    def get(self, request):
        return Response(_settings_payload(IntegrationSettings.get_solo()))

    def patch(self, request):
        s = IntegrationSettings.get_solo()
        data = request.data
        for field in KEY_FIELDS:
            _apply_key_patch(s, data, field)
        if 'youtube_channel_id' in data and isinstance(data.get('youtube_channel_id'), str):
            s.youtube_channel_id = data['youtube_channel_id'].strip()
        _sync_resend_to_email(data)
        s.updated_at = datetime.now(timezone.utc)
        s.save()
        return Response(_settings_payload(s))


class InternalIntegrationKeysView(APIView):
    """Host gateway pulls raw keys with ATHAR_INTERNAL_TOKEN — never expose publicly."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        expected = (getattr(django_settings, 'ATHAR_INTERNAL_TOKEN', '') or '').strip()
        provided = (request.headers.get('X-Athar-Internal-Token') or '').strip()
        if not expected or provided != expected:
            return Response({'detail': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)

        s = IntegrationSettings.get_solo()
        islamhouse, _ = _db_or_env(s.islamhouse_api_key, 'ISLAMHOUSE_API_KEY')
        dorar, _ = _db_or_env(s.dorar_api_key, 'DORAR_API_KEY')
        resend, _ = _effective_resend(s)
        youtube, _ = _db_or_env(s.youtube_api_key, 'YOUTUBE_API_KEY')
        channel = (s.youtube_channel_id or '').strip() or _env('YOUTUBE_CHANNEL_ID')
        return Response({
            'islamhouse_api_key': islamhouse,
            'dorar_api_key': dorar,
            'resend_api_key': resend,
            'youtube_api_key': youtube,
            'youtube_channel_id': channel,
        })
