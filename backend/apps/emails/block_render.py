"""Drag-and-drop email block validation + rendering to email-client-safe HTML.
Mirrors apps.lessons.views._normalize_blocks, but with email's own type
vocabulary (layout blocks, not lesson content blocks) and its own renderer,
since email HTML must avoid flexbox/grid and inline every style."""
from django.utils.html import escape

from .brand_layout import INK, BORDER, wrap_email, cta_button

EMAIL_BLOCK_TYPES = ('text', 'header', 'image', 'button', 'divider', 'spacer')


def normalize_email_blocks(raw_list):
    """Validate incoming email blocks; returns (list_of_dicts, error_message)."""
    blocks = []
    for i, raw in enumerate(raw_list or []):
        block_type = (raw.get('type') or '')
        if block_type not in EMAIL_BLOCK_TYPES:
            return None, f'Invalid block type "{block_type}" at index {i}.'
        blocks.append({'type': block_type, 'order': i, 'body': raw.get('body', {}) or {}})
    return blocks, None


def render_blocks_to_html(blocks):
    """Pure function: ordered list of {type, order, body} dicts -> one email-safe
    HTML string. Each block emits its own inline style="" — no <style> tag, no
    flexbox/grid (stripped by Outlook/Gmail), Athar branded shell for clients."""
    rows = []
    for block in sorted(blocks or [], key=lambda b: b.get('order', 0)):
        renderer = _RENDERERS.get(block.get('type'))
        if not renderer:
            continue
        html = renderer(block.get('body') or {})
        if html:
            rows.append(html)
    if not rows:
        return ''
    return wrap_email(''.join(rows))


def _render_text(body):
    text = escape(body.get('text', ''))
    return (
        f'<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;'
        f'font-size:15px;line-height:1.65;color:{INK};">{text}</p>'
    )


def _render_header(body):
    level = body.get('level') if body.get('level') in ('h1', 'h2') else 'h2'
    text = escape(body.get('text', ''))
    size = '22px' if level == 'h1' else '18px'
    return (
        f'<{level} style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;'
        f'font-size:{size};line-height:1.3;font-weight:700;color:{INK};">{text}</{level}>'
    )


def _render_image(body):
    url = escape(body.get('url', ''))
    alt = escape(body.get('alt', ''))
    if not url:
        return ''
    img = (
        f'<img src="{url}" alt="{alt}" width="504" border="0" '
        f'style="max-width:100%;width:100%;height:auto;display:block;border:0;'
        f'margin:0 0 16px;border-radius:8px;" />'
    )
    link = escape(body.get('link', ''))
    if link:
        return f'<a href="{link}" style="text-decoration:none">{img}</a>'
    return img


def _render_button(body):
    url = body.get('url', '')
    label = body.get('label', '')
    if not url or not label:
        return ''
    return cta_button(url, label)


def _render_divider(body):
    return f'<hr style="border:none;border-top:1px solid {BORDER};margin:24px 0" />'


def _render_spacer(body):
    try:
        height = max(0, min(200, int(body.get('height', 24))))
    except (TypeError, ValueError):
        height = 24
    return f'<div style="height:{height}px;line-height:{height}px;font-size:1px;">&nbsp;</div>'


_RENDERERS = {
    'text': _render_text,
    'header': _render_header,
    'image': _render_image,
    'button': _render_button,
    'divider': _render_divider,
    'spacer': _render_spacer,
}

