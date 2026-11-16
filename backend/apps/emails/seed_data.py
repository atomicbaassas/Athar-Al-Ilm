"""Default content_blocks for the 3 system EmailTemplate rows, matching the
copy in apps.emails.transactional's branded fallback generators. Used only by
the seed_email_templates management command."""

SYSTEM_TEMPLATE_SEEDS = [
    {
        'slug': 'verification',
        'name': 'Verify email (system)',
        'subject': 'Verify your Athar Al Ilm email',
        'content_blocks': [
            {'type': 'header', 'order': 0, 'body': {'level': 'h1', 'text': 'Confirm your email'}},
            {'type': 'text', 'order': 1, 'body': {'text': 'Assalamu alaikum,'}},
            {'type': 'text', 'order': 2, 'body': {
                'text': 'Please confirm this address to finish setting up your Athar Al Ilm account.'}},
            {'type': 'button', 'order': 3, 'body': {'url': '{{verify_url}}', 'label': 'Verify email'}},
            {'type': 'text', 'order': 4, 'body': {
                'text': 'This link expires in 24 hours. If you did not create an account, you can ignore this message.'}},
        ],
    },
    {
        'slug': 'password_reset',
        'name': 'Reset password (system)',
        'subject': 'Reset your Athar Al Ilm password',
        'content_blocks': [
            {'type': 'header', 'order': 0, 'body': {'level': 'h1', 'text': 'Reset your password'}},
            {'type': 'text', 'order': 1, 'body': {'text': 'Assalamu alaikum,'}},
            {'type': 'text', 'order': 2, 'body': {'text': 'We received a request to reset your Athar Al Ilm password.'}},
            {'type': 'button', 'order': 3, 'body': {'url': '{{reset_url}}', 'label': 'Reset password'}},
            {'type': 'text', 'order': 4, 'body': {
                'text': 'This link expires in 30 minutes. If you did not request a reset, you can ignore this message.'}},
        ],
    },
    {
        'slug': 'badge_earned',
        'name': 'Badge earned (system)',
        'subject': 'You earned a badge: {{badge_name}}',
        'content_blocks': [
            {'type': 'header', 'order': 0, 'body': {'level': 'h1', 'text': 'You earned a badge'}},
            {'type': 'text', 'order': 1, 'body': {'text': 'Assalamu alaikum,'}},
            {'type': 'text', 'order': 2, 'body': {'text': 'You just earned the {{badge_name}} badge on Athar Al Ilm!'}},
            {'type': 'text', 'order': 3, 'body': {'text': '{{badge_reward}}'}},
            {'type': 'button', 'order': 4, 'body': {
                'url': 'https://atharulilm.or.tz/dashboard', 'label': 'Open dashboard'}},
            {'type': 'text', 'order': 5, 'body': {'text': 'Keep going. Every lesson brings you closer to mastery.'}},
        ],
    },
]
