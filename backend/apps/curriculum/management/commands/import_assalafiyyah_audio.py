"""Import Sheikh Abu Hashim (Assalafiyyah) Swahili audio series as a Track.

Expects Opus (or MP3) files named like ``01-….opus`` under ``--audio-dir``.
Public URLs are built as ``{--public-base}/{filename}``.

Example::

    python manage.py import_assalafiyyah_audio \\
      --audio-dir /var/www/athar-lessons/assalafiyyah-ibada \\
      --public-base https://atharulilm.or.tz/media/lessons/assalafiyyah-ibada \\
      --publish
"""

from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.curriculum.models import Category, Subject, Track
from apps.lessons.models import ContentBlock, Lesson


SPEAKER = 'Sheikh Abu Hashim'
SOURCE = 'www.assalafiyyah.com'
TRACK_SLUG = 'fiqh-ya-ibada-abu-hashim'

# Inclusive number ranges → subject slug/title/order
SUBJECTS = [
    (1, 48, 'swala', 'Swala', 1,
     'Adabu za kwenda katika swala, nguzo, sunnah, jamaa, Ijumaa na Eid.'),
    (49, 52, 'adabu-za-hali', 'Adabu za Hali', 2,
     'Kuomba mvua, upepo, dawa na kumzuru mgonjwa.'),
    (53, 58, 'janaza', 'Janaza', 3,
     'Hukmu za maiti, kuswalia, kuzika na kuzuru makaburi.'),
    (59, 68, 'zaka', 'Zaka', 4,
     'Hukmu za zaka, wanaostahiki na sadaka.'),
    (69, 72, 'saum', 'Saum', 5,
     'Hukmu za swaum, yanayoharibu, sunnah na makuruhu.'),
]


def _slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')[:80] or 'lesson'


def _parse_num(path: Path) -> int | None:
    m = re.match(r'^(\d+)', path.name)
    return int(m.group(1)) if m else None


def _title_from_name(path: Path) -> str:
    # 01-1.-adabu-za-… → prefer ID3 title; fallback strip numeric prefixes
    stem = path.stem
    stem = re.sub(r'^\d+-', '', stem)
    stem = re.sub(r'^\d+\.-?', '', stem)
    title = stem.replace('-', ' ').strip()
    title = re.sub(r'\s+', ' ', title)
    return title[:1].upper() + title[1:] if title else path.stem


def _probe(path: Path) -> dict:
    try:
        out = subprocess.check_output(
            ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', str(path)],
            text=True,
        )
        fmt = json.loads(out).get('format', {})
        tags = {k.lower(): v for k, v in (fmt.get('tags') or {}).items()}
        return {
            'duration_sec': float(fmt.get('duration') or 0),
            'title': tags.get('title') or '',
            'artist': tags.get('artist') or '',
        }
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError, ValueError):
        return {'duration_sec': 0, 'title': '', 'artist': ''}


def _subject_for(n: int):
    for start, end, slug, title, order, desc in SUBJECTS:
        if start <= n <= end:
            return slug, title, order, desc
    return None


class Command(BaseCommand):
    help = 'Import Assalafiyyah audio lectures as a published curriculum track.'

    def add_arguments(self, parser):
        parser.add_argument('--audio-dir', required=True, help='Directory of numbered .opus/.mp3 files')
        parser.add_argument(
            '--public-base',
            required=True,
            help='Public URL prefix (no trailing slash) mapping to --audio-dir',
        )
        parser.add_argument('--publish', action='store_true', help='Mark track/subjects/lessons published')
        parser.add_argument('--replace', action='store_true', help='Delete existing track lessons and recreate')

    def handle(self, *args, **options):
        audio_dir = Path(options['audio_dir']).expanduser().resolve()
        if not audio_dir.is_dir():
            raise CommandError(f'Audio dir not found: {audio_dir}')

        public_base = options['public_base'].rstrip('/')
        publish = options['publish']
        replace = options['replace']

        files = sorted(
            [p for p in audio_dir.iterdir() if p.suffix.lower() in {'.opus', '.mp3', '.ogg', '.m4a'}],
            key=lambda p: (_parse_num(p) or 9999, p.name),
        )
        if not files:
            raise CommandError(f'No audio files in {audio_dir}')

        cat, _ = self._ensure_category()
        if replace:
            existing = Track.objects(slug=TRACK_SLUG).first()
            if existing:
                for subj in Subject.objects(track=existing):
                    Lesson.objects(subject=subj).delete()
                    subj.delete()
                existing.delete()
                self.stdout.write(self.style.WARNING(f'Removed existing track {TRACK_SLUG}'))

        track = Track.objects(slug=TRACK_SLUG).first()
        if not track:
            track = Track(
                title="Fiqh ya Ibada — Sheikh Abu Hashim",
                slug=TRACK_SLUG,
                description=(
                    "Mfululizo wa mihadhara ya Kiswahili kutoka Assalafiyyah: "
                    "adabu za swala, janaza, zaka na saum. Mhutubu: Sheikh Abu Hashim."
                ),
                order=10,
                is_published=publish,
                category=cat,
                level_slug='beginner',
                meta_title='Fiqh ya Ibada — Sheikh Abu Hashim',
                meta_description='Mihadhara ya Kiswahili kuhusu swala, janaza, zaka na saum.',
            )
            track.save()
            self.stdout.write(self.style.SUCCESS(f'Created track {track.slug}'))
        else:
            track.is_published = publish or track.is_published
            track.category = cat
            track.save()
            self.stdout.write(f'Using existing track {track.slug}')

        subjects = {}
        created_lessons = 0
        skipped = 0

        for path in files:
            n = _parse_num(path)
            if n is None:
                self.stdout.write(self.style.WARNING(f'Skip (no number): {path.name}'))
                skipped += 1
                continue
            meta = _subject_for(n)
            if not meta:
                self.stdout.write(self.style.WARNING(f'Skip (out of subject map): {path.name}'))
                skipped += 1
                continue
            sub_slug, sub_title, sub_order, sub_desc = meta
            if sub_slug not in subjects:
                subjects[sub_slug] = self._ensure_subject(
                    track, sub_slug, sub_title, sub_order, sub_desc, publish
                )

            probe = _probe(path)
            title = (probe.get('title') or _title_from_name(path)).strip()
            # Normalize "48. Takbira…" style titles
            title = re.sub(r'^\d+\.\s*', '', title).strip() or _title_from_name(path)
            lesson_slug = f'abu-hashim-{n:02d}-{_slugify(title)}'
            minutes = max(1, int(round((probe.get('duration_sec') or 0) / 60))) or 30
            url = f'{public_base}/{path.name}'
            speaker = probe.get('artist') or SPEAKER

            existing = Lesson.objects(slug=lesson_slug).first()
            if existing and not replace:
                skipped += 1
                continue

            if existing and replace:
                existing.delete()

            blocks = [
                ContentBlock(
                    type='text',
                    order=1,
                    body={
                        'text': (
                            f'Sikiliza somo la {title}. '
                            f'Mhutubu: {speaker}. Chanzo: {SOURCE}.'
                        ),
                        'source': SOURCE,
                    },
                ),
                ContentBlock(
                    type='audio',
                    order=2,
                    body={
                        'url': url,
                        'caption': title,
                        'speaker': speaker,
                        'source': SOURCE,
                    },
                ),
            ]
            lesson = Lesson(
                subject=subjects[sub_slug],
                title=title,
                slug=lesson_slug,
                summary=f'Muhadhara wa Kiswahili — {speaker} ({SOURCE}).',
                order=n,
                status='published' if publish else 'draft',
                estimated_minutes=minutes,
                content_blocks=blocks,
            )
            lesson.save()
            created_lessons += 1
            self.stdout.write(f'  [{n:02d}] {title} ({minutes} min)')

        self.stdout.write(self.style.SUCCESS(
            f'Done. lessons_created={created_lessons} skipped={skipped} subjects={len(subjects)}'
        ))

    def _ensure_category(self):
        slug = 'fiqh'
        cat = Category.objects(slug=slug).first()
        if cat:
            return cat, False
        cat = Category(
            title='Fiqh',
            slug=slug,
            order=20,
            levels=[
                {'name': 'Beginner', 'slug': 'beginner', 'order': 1},
                {'name': 'Intermediate', 'slug': 'intermediate', 'order': 2},
            ],
        )
        cat.save()
        return cat, True

    def _ensure_subject(self, track, slug, title, order, description, publish):
        existing = Subject.objects(slug=slug).first()
        if existing:
            if existing.track != track:
                existing.track = track
            existing.is_published = publish or existing.is_published
            existing.title = title
            existing.description = description
            existing.order = order
            existing.save()
            return existing
        subj = Subject(
            track=track,
            title=title,
            slug=slug,
            description=description,
            order=order,
            is_published=publish,
        )
        subj.save()
        return subj
