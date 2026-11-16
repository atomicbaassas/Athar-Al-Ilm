"""System-owned transactional email (verification, password reset, badge-earned).
Fires through the same admin-configured SMTP connection as campaigns
(`deliver_message`), but async via Celery so request handlers never block on
SMTP. Unlike campaigns these are not logged/tracked — just best-effort sends."""
from celery import shared_task
from django.utils.html import escape

from .brand_layout import wrap_email, cta_button, heading, paragraph


@shared_task(ignore_result=True)
def send_transactional_email(subject, html_body, to_email):
    from .tasks import deliver_message
    deliver_message(subject, html_body, to_email)


def verification_email_body(url):
    inner = (
        heading('Confirm your email')
        + paragraph('Assalamu alaikum,')
        + paragraph('Please confirm this address to finish setting up your Athar Al Ilm account.')
        + cta_button(url, 'Verify email')
        + paragraph(
            'This link expires in 24 hours. If you did not create an account, you can ignore this message.',
            muted=True,
        )
    )
    return wrap_email(inner, preheader='Confirm your Athar Al Ilm email to start learning.')


def password_reset_email_body(url):
    inner = (
        heading('Reset your password')
        + paragraph('Assalamu alaikum,')
        + paragraph('We received a request to reset your Athar Al Ilm password.')
        + cta_button(url, 'Reset password')
        + paragraph(
            'This link expires in 30 minutes. If you did not request a reset, you can ignore this message.',
            muted=True,
        )
    )
    return wrap_email(inner, preheader='Use this link to set a new Athar Al Ilm password.')


def badge_earned_email_body(badge):
    reward = paragraph(badge.reward) if badge.reward else ''
    name = escape(badge.name)
    inner = (
        heading('You earned a badge')
        + paragraph('Assalamu alaikum,')
        + paragraph(
            f'You just earned the <strong>{name}</strong> badge on Athar Al Ilm.',
            safe=True,
        )
        + reward
        + cta_button('https://atharulilm.or.tz/dashboard', 'Open dashboard')
        + paragraph('Keep going. Every lesson brings you closer to mastery.', muted=True)
    )
    return wrap_email(inner, preheader='A new badge is waiting on your Athar Al Ilm dashboard.')
