#!/usr/bin/env python3
"""Patch Contabo quran-muaalem serve.py for CPU warmup + longer engine timeout."""
from pathlib import Path

p = Path("/opt/quran-muaalem/src/quran_muaalem/app/serve.py")
t = p.read_text()

old_timeout = "async with httpx.AsyncClient(timeout=30.0) as client:"
new_timeout = "async with httpx.AsyncClient(timeout=180.0) as client:"
if old_timeout in t:
    t = t.replace(old_timeout, new_timeout)
    print("patched engine httpx timeout -> 180s")
elif "timeout=180.0" in t:
    print("engine timeout already 180s")
else:
    print("WARN: engine timeout site not found")

if "_warmup_phonetic_search" not in t:
    if "import asyncio" not in t:
        t = "import asyncio\n" + t
    needle = "async def call_engine_predict(audio_file: UploadFile) -> str:"
    if needle not in t:
        raise SystemExit("call_engine_predict not found")
    hook = (
        "@app.on_event(\"startup\")\n"
        "async def _warmup_phonetic_search():\n"
        "    # Contabo CPU: first PhoneticSearch() build is minutes; do it at boot.\n"
        "    loop = asyncio.get_event_loop()\n"
        "    await loop.run_in_executor(None, get_phonetic_search)\n"
        "\n"
        "async def call_engine_predict(audio_file: UploadFile) -> str:"
    )
    t = t.replace(needle, hook, 1)
    print("patched startup PhoneticSearch warmup")
else:
    print("warmup already present")

p.write_text(t)
print("ok", p)
