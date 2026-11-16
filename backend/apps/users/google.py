"""Verify a Google Identity Services ID token without an OAuth library.

shortcut: calls Google's tokeninfo endpoint (extra network hop, rate-limited).
Upgrade to cached JWKS verification if sign-in volume or a Google outage makes
that hop a problem.
"""
import requests
from django.conf import settings

TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo'
ISSUERS = frozenset({'accounts.google.com', 'https://accounts.google.com'})


class GoogleTokenError(Exception):
    def __init__(self, code):
        self.code = code
        super().__init__(code)


def verify_google_id_token(id_token):
    """Return email/name claims or raise GoogleTokenError.

    Audience must match GOOGLE_CLIENT_ID. An empty client id refuses every
    token so a missing env var cannot accept tokens minted for another app.
    """
    client_id = (settings.GOOGLE_CLIENT_ID or '').strip()
    if not client_id:
        raise GoogleTokenError('not_configured')
    if not isinstance(id_token, str) or not id_token.strip() or len(id_token) > 8192:
        raise GoogleTokenError('invalid')

    try:
        response = requests.get(
            TOKENINFO_URL,
            params={'id_token': id_token.strip()},
            timeout=5,
            allow_redirects=False,
        )
    except requests.RequestException as exc:
        raise GoogleTokenError('unavailable') from exc

    if response.status_code != 200:
        raise GoogleTokenError('invalid')

    try:
        claims = response.json()
    except ValueError as exc:
        raise GoogleTokenError('invalid') from exc
    if not isinstance(claims, dict):
        raise GoogleTokenError('invalid')
    if claims.get('aud') != client_id or claims.get('iss') not in ISSUERS:
        raise GoogleTokenError('invalid')

    verified = claims.get('email_verified')
    if verified is not True and str(verified).lower() != 'true':
        raise GoogleTokenError('unverified_email')

    email = str(claims.get('email') or '').strip().lower()
    if '@' not in email:
        raise GoogleTokenError('invalid')

    return {
        'email': email,
        'sub': str(claims.get('sub') or ''),
        'name': str(claims.get('name') or '').strip()[:100],
    }
