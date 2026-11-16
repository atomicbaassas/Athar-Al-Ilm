"""Import one audio folder as a single Subject on a Track.

Does not delete existing curriculum. Skips lesson slugs that already exist.
Speaker and duration come from ID3 / ffprobe when the files are readable,
otherwise from ``--manifest`` (JSON list). Lesson copy never includes the
old host name.

Example::

    python manage.py import_audio_subject \\
      --audio-dir /var/www/athar-lessons/ahkam-takhtassu \\
      --public-base https://atharulilm.or.tz/media/lessons/ahkam-takhtassu \\
      --track-slug fiqh-ya-ibada-abu-hashim \\
      --subject-slug ahkam-takhtassu \\
      --subject-title "Ahkam takhtassu" \\
      --subject-order 6 \\
      --manifest /tmp/ahkam-takhtassu.json \\
      --publish
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from apps.curriculum.models import Category, Subject, Track
from apps.lessons.models import ContentBlock, Lesson


_BANNED = 'assalafiyyah'


def _slugify(text: str) -> str:
    s = re.sub(r'[^a-z0-9]+', '-', (text or '').lower()).strip('-')
    return s[:80] or 'lesson'


def _parse_num(name: str) -> int | None:
    m = re.match(r'^(\d+)', name)
    return int(m.group(1)) if m else None


def _clean(value: str) -> str:
    value = (value or '').strip()
    if _BANNED in value.lower():
        return ''
    return value


def _display_title(raw: str, fallback: str) -> str:
    raw = _clean(raw)
    stripped = re.sub(r'^\d+\s*[\.\-]\s*', '', raw).strip()
    return stripped or raw or fallback


def _probe(path: Path) -> dict:
    try:
        out = subprocess.check_output(
            ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', str(path)],
            text=True,
        )
        data = json.loads(out)
        fmt = data.get('format', {})
        tags = {k.lower(): v for k, v in (fmt.get('tags') or {}).items()}
        # libopus writes title/artist on the audio stream, not the format.
        for stream in data.get('streams') or []:
            for key, value in (stream.get('tags') or {}).items():
                tags.setdefault(key.lower(), value)
        return {
            'duration_sec': float(fmt.get('duration') or 0),
            'title': tags.get('title') or '',
            'artist': tags.get('artist') or '',
        }
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError, ValueError):
        return {'duration_sec': 0, 'title': '', 'artist': ''}


def _load_manifest(path: str | None) -> dict:
    if not path:
        return {}
    data = json.loads(Path(path).read_text())
    if not isinstance(data, list):
        raise CommandError('--manifest must be a JSON list')
    by_name = {}
    for row in data:
        name = row.get('filename')
        if not name:
            raise CommandError('manifest row missing filename')
        by_name[name] = row
    return by_name


class Command(BaseCommand):
    help = 'Add one audio folder as a Subject (and Track, if missing). Does not delete existing lessons.'

    def add_arguments(self, parser):
        parser.add_argument('--audio-dir', required=True)
        parser.add_argument('--public-base', required=True)
        parser.add_argument('--track-slug', required=True)
        parser.add_argument('--subject-slug', required=True)
        parser.add_argument('--subject-title', required=True)
        parser.add_argument('--subject-order', type=int, default=1)
        parser.add_argument('--subject-description', default='')
        parser.add_argument('--track-title', default='')
        parser.add_argument('--track-description', default='')
        parser.add_argument('--track-order', type=int, default=0)
        parser.add_argument('--category-slug', default='fiqh')
        parser.add_argument('--speaker', default='', help='Used when a file has no artist tag')
        parser.add_argument('--manifest', default='', help='JSON list of filename/title/artist/duration_sec')
        parser.add_argument('--publish', action='store_true')

    def handle(self, *args, **options):
        audio_dir = Path(options['audio_dir'])
        public_base = options['public_base'].rstrip('/')
        manifest = _load_manifest(options['manifest'] or None)
        publish = options['publish']

        if audio_dir.is_dir():
            names = sorted(
                p.name for p in audio_dir.iterdir()
                if p.suffix.lower() in {'.opus', '.mp3', '.ogg', '.m4a'}
            )
        else:
            names = sorted(manifest)
        if not names:
            raise CommandError(f'No audio files for {audio_dir}')

        rows = []
        for name in names:
            path = audio_dir / name
            probed = _probe(path) if path.is_file() else {}
            meta = manifest.get(name, {})
            n = _parse_num(name)
            if n is None:
                n = meta.get('n')
            if n is None:
                self.stdout.write(self.style.WARNING(f'Skip (no number): {name}'))
                continue
            raw_title = probed.get('title') or meta.get('title') or ''
            fallback = _display_title('', Path(name).stem.replace('-', ' '))
            title = _display_title(raw_title, fallback)
            artist = _clean(probed.get('artist') or meta.get('artist') or '') or _clean(options['speaker'])
            duration = float(probed.get('duration_sec') or meta.get('duration_sec') or 0)
            rows.append({
                'name': name,
                'n': int(n),
                'title': title,
                'artist': artist or 'Mhutubu',
                'duration_sec': duration,
            })

        counts = {}
        for row in rows:
            counts[row['title']] = counts.get(row['title'], 0) + 1
        for row in rows:
            if counts[row['title']] > 1:
                row['title'] = f"{row['title']} {row['n']}"

        cat = self._ensure_category(options['category_slug'])
        track = self._ensure_track(cat, options, publish)
        subject = self._ensure_subject(track, options, publish)

        created = 0
        skipped = 0
        for row in rows:
            slug = f"{options['subject_slug']}-{row['n']:02d}-{_slugify(row['title'])}"[:300]
            if Lesson.objects(slug=slug).first():
                skipped += 1
                self.stdout.write(f"  skip {slug}")
                continue
            minutes = max(1, int(round(row['duration_sec'] / 60)))
            text = f"Sikiliza somo la {row['title']}. Mhutubu: {row['artist']}."
            summary = f"Muhadhara wa Kiswahili — {row['artist']}."
            blob = f"{row['title']}\n{text}\n{summary}\n{row['artist']}"
            if _BANNED in blob.lower():
                raise CommandError(f'refusing copy that names the old host: {row["name"]}')
            lesson = Lesson(
                subject=subject,
                title=row['title'][:300],
                slug=slug,
                summary=summary[:500],
                order=row['n'],
                status='published' if publish else 'draft',
                estimated_minutes=minutes,
                content_blocks=[
                    ContentBlock(type='text', order=1, body={'text': text}),
                    ContentBlock(type='audio', order=2, body={
                        'url': f"{public_base}/{row['name']}",
                        'caption': row['title'],
                        'speaker': row['artist'],
                    }),
                ],
            )
            lesson.save()
            created += 1
            self.stdout.write(f"  [{row['n']:02d}] {row['title']} ({minutes} min) {row['artist']}")

        self.stdout.write(self.style.SUCCESS(
            f'Done. track={track.slug} subject={subject.slug} created={created} skipped={skipped}'
        ))

    def _ensure_category(self, slug):
        cat = Category.objects(slug=slug).first()
        if cat:
            return cat
        cat = Category(
            title=slug.replace('-', ' ').title(),
            slug=slug,
            order=20,
            levels=[
                {'name': 'Beginner', 'slug': 'beginner', 'order': 1},
            ],
        )
        cat.save()
        self.stdout.write(self.style.SUCCESS(f'Created category {slug}'))
        return cat

    def _ensure_track(self, cat, options, publish):
        slug = options['track_slug']
        track = Track.objects(slug=slug).first()
        if track:
            if publish and not track.is_published:
                track.is_published = True
                track.save()
            self.stdout.write(f'Using existing track {slug}')
            return track
        title = (options['track_title'] or '').strip()
        if not title:
            raise CommandError(f'Track {slug} does not exist; pass --track-title')
        description = options['track_description'] or title
        if _BANNED in f'{title}\n{description}'.lower():
            raise CommandError('refusing track copy that names the old host')
        track = Track(
            title=title[:200],
            slug=slug,
            description=description[:1000],
            order=options['track_order'],
            is_published=publish,
            category=cat,
            level_slug='beginner',
            meta_title=title[:70],
            meta_description=description[:200],
        )
        track.save()
        self.stdout.write(self.style.SUCCESS(f'Created track {slug}'))
        return track

    def _ensure_subject(self, track, options, publish):
        slug = options['subject_slug']
        title = options['subject_title'].strip()
        description = options['subject_description'] or title
        if _BANNED in f'{title}\n{description}'.lower():
            raise CommandError('refusing subject copy that names the old host')
        existing = Subject.objects(slug=slug).first()
        if existing:
            if str(existing.track.id) != str(track.id):
                raise CommandError(f'Subject {slug} belongs to another track; not moving it')
            existing.title = title[:200]
            existing.description = description[:1000]
            existing.order = options['subject_order']
            existing.is_published = publish or existing.is_published
            existing.save()
            self.stdout.write(f'Using existing subject {slug}')
            return existing
        subject = Subject(
            track=track,
            title=title[:200],
            slug=slug,
            description=description[:1000],
            order=options['subject_order'],
            is_published=publish,
        )
        subject.save()
        self.stdout.write(self.style.SUCCESS(f'Created subject {slug}'))
        return subject
