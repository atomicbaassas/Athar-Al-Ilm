# Audio lesson pipeline (Assalafiyyah / lecture series)

## Compress

| Tool | Use | Notes |
|---|---|---|
| **ffmpeg + libopus** | Primary | `ffmpeg -i in.mp3 -c:a libopus -b:a 24k -ac 1 out.opus` — speech-friendly; ~half size vs 48 kbps MP3 |
| **lame** | MP3 re-encode | Already installed locally; prefer Opus for lectures |
| **sox** | Optional DSP | Not required for this series |

This series: 812 MB MP3 → ~452 MB Opus (24 kbps mono).

## Transcribe (not wired yet)

| Tool | Fit |
|---|---|
| **whisper.cpp** / **openai-whisper** | Local Swahili (`sw`) offline ASR |
| **faster-whisper** | Faster local GPU/CPU |
| **OpenAI Whisper API** | Cloud; route via `127.0.0.1:3456` if used from agents |

Do **not** treat ASR output as religious source of truth (**C-SRC**). Store as draft captions until scholar-reviewed.

## Translate

| Tool | Fit |
|---|---|
| **In-app Gemini** (`apps/translations`) | Translates lesson text/captions; skips media URLs |
| Manual EN/AR | Prefer for fiqh after transcript review |

Audio `speaker` / `source` fields are translatable captions only; the recording stays the source.

## Host + import

1. Serve files at `/media/lessons/assalafiyyah-ibada/` (nginx alias).
2. `python manage.py import_assalafiyyah_audio --audio-dir … --public-base … --publish`

Lecturer metadata: ID3 `artist` = **Sheikh Abu Hashim**, album = **www.assalafiyyah.com**.
