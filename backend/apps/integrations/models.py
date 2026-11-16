from datetime import datetime, timezone

from mongoengine import Document, StringField, DateTimeField


class IntegrationSettings(Document):
    """Singleton secrets for Salafi gateway + third-party APIs.

    Managed only by users with role `admin` (superadmin). Keys are never returned
    in full by the admin API — only masked hints. Env vars remain a fallback when
    a field is empty so Contabo host secrets still work.
    """

    key = StringField(default='integrations', unique=True)
    islamhouse_api_key = StringField(default='')
    dorar_api_key = StringField(default='')
    resend_api_key = StringField(default='')
    youtube_api_key = StringField(default='')
    youtube_channel_id = StringField(default='')
    updated_at = DateTimeField()

    meta = {'collection': 'integration_settings'}

    @classmethod
    def get_solo(cls):
        obj = cls.objects(key='integrations').first()
        if not obj:
            obj = cls(key='integrations')
            obj.save()
        return obj
