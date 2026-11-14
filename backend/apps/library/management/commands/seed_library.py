"""Seed a minimal published library from IslamHouse catalog entries.

PDFs/covers stay on IslamHouse CDN (absolute URLs in cover_key/pdf_key).
Idempotent by slug — safe to re-run.
"""
from django.core.management.base import BaseCommand

from apps.library.models import Book

SEED_BOOKS = [
    {
        'slug': 'hisn-al-muslim',
        'title': 'Hisn Al-Muslim (Fortress of the Muslim)',
        'author': 'Saeed Bin Ali Bin Wahf Al-Qahtani',
        'description': 'Supplications from the Qur’an and Sunnah — a classic pocket dua collection.',
        'category': 'Aqeedah',
        'language': 'en',
        'order': 1,
        'tags': ['dua', 'adhkar', 'islamhouse'],
        'cover_key': 'https://d1.islamhouse.com/data/en/ih_books/single/covers/risala_CPta0rL5nMpJHytyXuNK.png',
        'pdf_key': 'https://d1.islamhouse.com/data/en/ih_books/single/risala_en_hisnulmuslim.pdf',
        'file_size_mb': 2.21,
    },
    {
        'slug': '100-tweets-about-prophet-muhammad',
        'title': '100 Tweets about Prophet Muhammad ﷺ',
        'author': 'Naji Ibrahim Al Arfaj',
        'description': 'Short authentic reminders about the Prophet ﷺ.',
        'category': 'Seerah',
        'language': 'en',
        'order': 2,
        'tags': ['seerah', 'islamhouse'],
        'cover_key': '',
        'pdf_key': 'https://d1.islamhouse.com/data/en/ih_books/single/en-100-tweets-about-prophet.pdf',
        'file_size_mb': 12.36,
    },
    {
        'slug': '50-tweets-about-oneness-of-god',
        'title': '50 Tweets about Oneness of God',
        'author': 'Naji Ibrahim Al Arfaj',
        'description': 'Short reminders on Tawheed.',
        'category': 'Aqeedah',
        'language': 'en',
        'order': 3,
        'tags': ['tawheed', 'islamhouse'],
        'cover_key': '',
        'pdf_key': 'https://d1.islamhouse.com/data/en/ih_books/single/en-50-tweets-about-oneness-of-god.pdf',
        'file_size_mb': 0,
    },
]


class Command(BaseCommand):
    help = 'Seed minimal published library books (IslamHouse CDN URLs).'

    def handle(self, *args, **options):
        created = 0
        updated = 0
        for row in SEED_BOOKS:
            slug = row['slug']
            defaults = {
                'title': row['title'],
                'author': row['author'],
                'description': row['description'],
                'category': row['category'],
                'language': row['language'],
                'order': row['order'],
                'tags': row['tags'],
                'cover_key': row.get('cover_key') or '',
                'pdf_key': row.get('pdf_key') or '',
                'file_size_mb': float(row.get('file_size_mb') or 0),
                'is_published': True,
            }
            book = Book.objects(slug=slug).first()
            if book:
                for k, v in defaults.items():
                    setattr(book, k, v)
                book.save()
                updated += 1
                self.stdout.write(f'updated {slug}')
            else:
                Book(slug=slug, **defaults).save()
                created += 1
                self.stdout.write(self.style.SUCCESS(f'created {slug}'))

        self.stdout.write(self.style.SUCCESS(
            f'seed_library done: created={created} updated={updated} '
            f'total_published={Book.objects(is_published=True).count()}'
        ))
