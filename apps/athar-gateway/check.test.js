import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 19091;

test("health + quran translations list", async (t) => {
  const child = spawn(process.execPath, ["server.js"], {
    cwd: __dirname,
    env: { ...process.env, ATHAR_GATEWAY_PORT: String(PORT), ATHAR_GATEWAY_HOST: "127.0.0.1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => {
    child.kill("SIGTERM");
  });
  await sleep(400);

  const health = await fetch(`http://127.0.0.1:${PORT}/health`);
  assert.equal(health.status, 200);
  const healthBody = await health.json();
  assert.equal(healthBody.ok, true);

  const quran = await fetch(
    `http://127.0.0.1:${PORT}/v1/quran/translations/list`,
  );
  assert.equal(quran.status, 200);
  const qBody = await quran.json();
  assert.equal(qBody.source, "quran");
  assert.ok(qBody.data);

  const hadeeth = await fetch(`http://127.0.0.1:${PORT}/v1/hadeeth/languages`);
  assert.equal(hadeeth.status, 200);
  const hBody = await hadeeth.json();
  assert.equal(hBody.source, "hadeeth");
  assert.ok(hBody.data);

  const books = await fetch(
    `http://127.0.0.1:${PORT}/v1/islamhouse/main/sitecontent/ar/ar/json`,
  );
  assert.equal(books.status, 200);
  const bBody = await books.json();
  assert.equal(bBody.source, "islamhouse");
  assert.ok(bBody.data);

  const quranapi = await fetch(
    `http://127.0.0.1:${PORT}/v1/quranapi/editions/ara-quranuthmanihaf/1`,
  );
  assert.equal(quranapi.status, 200);
  const qaBody = await quranapi.json();
  assert.equal(qaBody.source, "quranapi");
  assert.ok(qaBody.data?.chapter?.length);

  const timed = await fetch(
    `http://127.0.0.1:${PORT}/v1/qurancom/chapter_recitations/7/1?segments=true`,
  );
  assert.equal(timed.status, 200);
  const timedBody = await timed.json();
  assert.equal(timedBody.source, "qurancom");
  assert.ok(timedBody.data?.audio_file?.timestamps?.length);

  const blocked = await fetch(
    `http://127.0.0.1:${PORT}/v1/qurancom/verses/uthmani`,
  );
  assert.equal(blocked.status, 403);
});
