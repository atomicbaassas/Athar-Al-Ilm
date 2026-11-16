import pytest
from rest_framework.test import APIClient

from apps.curriculum.models import Track, Subject
from apps.lessons.models import Lesson, ContentBlock
from apps.lessons.serializers import ContentBlockSerializer
from apps.users.models import User
from apps.users.utils import generate_tokens
from .models import LessonProgress, UserProgress, QuizAttempt


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def learner():
    User.objects(email='prog@example.com').delete()
    u = User(email='prog@example.com', username='proguser', is_verified=True)
    u.set_password('strongpass123')
    u.save()
    yield u
    LessonProgress.objects(user=u).delete()
    UserProgress.objects(user=u).delete()
    QuizAttempt.objects(user=u).delete()
    u.delete()


@pytest.fixture
def published_lesson():
    Track.objects(slug='prog-track').delete()
    Subject.objects(slug='prog-subject').delete()
    Lesson.objects(slug='prog-lesson').delete()

    track = Track(title='Prog Track', slug='prog-track', is_published=True).save()
    subject = Subject(title='Prog Subject', slug='prog-subject', track=track, order=0).save()
    lesson = Lesson(
        subject=subject,
        title='Prog Lesson',
        slug='prog-lesson',
        status='published',
        order=0,
        content_blocks=[
            ContentBlock(type='quiz', order=0, body={
                'question': 'How many?',
                'options': ['1', '2', '3'],
                'correct': 2,
            }),
        ],
    ).save()
    yield lesson
    Lesson.objects(slug='prog-lesson').delete()
    Subject.objects(slug='prog-subject').delete()
    Track.objects(slug='prog-track').delete()


@pytest.mark.django_db
class TestMarkComplete:

    def test_complete_twice_streak_once(self, client, learner, published_lesson, monkeypatch):
        monkeypatch.setattr('apps.badges.awards.evaluate_awards', lambda *a, **k: None)
        monkeypatch.setattr('apps.automations.engine.handle_trigger', lambda *a, **k: None)
        tokens = generate_tokens(learner)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        r1 = client.post(f'/api/v1/progress/complete/{published_lesson.slug}/')
        assert r1.status_code == 200
        up = UserProgress.objects(user=learner).first()
        assert up is not None
        streak1 = up.current_streak_days

        r2 = client.post(f'/api/v1/progress/complete/{published_lesson.slug}/')
        assert r2.status_code == 200
        up.reload()
        assert up.current_streak_days == streak1
        assert LessonProgress.objects(user=learner, lesson=published_lesson, completed=True).count() == 1


@pytest.mark.django_db
class TestQuizGrading:

    def test_quiz_grades_from_server_correct(self, client, learner, published_lesson):
        tokens = generate_tokens(learner)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")

        wrong = client.post(
            f'/api/v1/progress/quiz/{published_lesson.slug}/',
            {'block_order': 0, 'selected_index': 0},
            format='json',
        )
        assert wrong.status_code == 200
        assert wrong.data['is_correct'] is False

        right = client.post(
            f'/api/v1/progress/quiz/{published_lesson.slug}/',
            {'block_order': 0, 'selected_index': 2},
            format='json',
        )
        assert right.status_code == 200
        assert right.data['is_correct'] is True


@pytest.mark.django_db
class TestQuizAnswerNotLeaked:

    def test_content_block_serializer_strips_correct(self, published_lesson):
        block = published_lesson.content_blocks[0]
        data = ContentBlockSerializer(block).data
        assert data['type'] == 'quiz'
        assert 'correct' not in data['body']
        assert data['body']['options'] == ['1', '2', '3']
