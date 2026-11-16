"""Athar-branded, email-client-safe HTML shell for transactional mail.

Colors match live atharulilm.or.tz primary emerald (#0B3D2E) and a tinted
neutral page (Better Design extract-from-url + existing button styles).
Table layout + inline styles only — no flex/grid/CSS variables.
"""
from django.utils.html import escape

PRIMARY = '#0B3D2E'
PAGE_BG = '#F4F7F5'
INK = '#1A2E28'
MUTED = '#5C6F68'
BORDER = '#D5E0DB'
LOGO = 'https://atharulilm.or.tz/logo-rounded.png?v=quiet-mihrab'
SITE = 'https://atharulilm.or.tz'


def wrap_email(inner_html, *, preheader=''):
    """Wrap block or fallback body HTML in the Athar card shell."""
    pre = escape(preheader) if preheader else ''
    return (
        '<!DOCTYPE html><html lang="en"><head>'
        '<meta charset="UTF-8">'
        '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
        '<meta http-equiv="X-UA-Compatible" content="IE=edge">'
        f'</head><body style="margin:0;padding:0;background-color:{PAGE_BG};">'
        f'<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">{pre}</div>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        f'bgcolor="{PAGE_BG}" style="background-color:{PAGE_BG};">'
        '<tr><td align="center" style="padding-top:32px;padding-bottom:32px;'
        'padding-left:16px;padding-right:16px;">'
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" '
        'style="max-width:560px;width:100%;">'
        '<tr><td align="center" style="padding-bottom:20px;">'
        f'<img src="{LOGO}" alt="Athar Al Ilm" width="72" height="72" border="0" '
        'style="display:block;border:0;width:72px;height:72px;" />'
        '</td></tr>'
        f'<tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;border:1px solid {BORDER};'
        'border-radius:12px;padding-top:32px;padding-bottom:8px;'
        'padding-left:28px;padding-right:28px;">'
        f'{inner_html}'
        '</td></tr>'
        '<tr><td align="center" style="padding-top:24px;padding-bottom:8px;">'
        f'<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;'
        f'line-height:1.5;color:{MUTED};">Athar Al Ilm · أثر العلم</p>'
        f'<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;'
        f'line-height:1.5;color:{MUTED};">'
        f'<a href="{SITE}" style="color:{PRIMARY};text-decoration:none;">atharulilm.or.tz</a></p>'
        '</td></tr></table></td></tr></table></body></html>'
    )


def cta_button(url, label):
    url_e, label_e = escape(url), escape(label)
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" '
        'style="margin-top:8px;margin-bottom:24px;">'
        f'<tr><td bgcolor="{PRIMARY}" style="background-color:{PRIMARY};border-radius:10px;">'
        f'<a href="{url_e}" style="display:inline-block;padding-top:14px;padding-bottom:14px;'
        'padding-left:28px;padding-right:28px;font-family:Arial,Helvetica,sans-serif;'
        'font-size:15px;font-weight:700;line-height:1;color:#FFFFFF;text-decoration:none;">'
        f'{label_e}</a></td></tr></table>'
    )


def heading(text):
    return (
        f'<h1 style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:22px;'
        f'line-height:1.3;font-weight:700;color:{INK};">{escape(text)}</h1>'
    )


def paragraph(text, *, muted=False, safe=False):
    color = MUTED if muted else INK
    body = text if safe else escape(text)
    return (
        f'<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;'
        f'line-height:1.65;color:{color};">{body}</p>'
    )
