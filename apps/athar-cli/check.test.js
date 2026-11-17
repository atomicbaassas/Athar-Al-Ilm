import test from "node:test";
import assert from "node:assert/strict";
import { parseArgs, flagBool, flagNum, flagStr } from "./lib/args.js";
import {
  correctionMatchesTarget,
  gateFromCorrection,
  wordIndicesFromMuaalemErrors,
} from "./lib/practiceGate.js";

test("parseArgs supports equals, value, and booleans", () => {
  const a = parseArgs([
    "correct",
    "--file",
    "./a.wav",
    "--surah=1",
    "--json",
    "--no-dry-run",
  ]);
  assert.deepEqual(a._, ["correct"]);
  assert.equal(flagStr(a.flags, "file"), "./a.wav");
  assert.equal(flagNum(a.flags, "surah"), 1);
  assert.equal(flagBool(a.flags, "json"), true);
  assert.equal(flagBool(a.flags, "dry-run"), false);
});

test("gate allows clear match and blocks wrong ayah", () => {
  const clear = {
    start: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 0 },
    end: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 4 },
    uthmani_text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    errors: [],
  };
  const g1 = gateFromCorrection(clear, 1, 1);
  assert.equal(g1.ok, true);
  assert.equal(g1.advance, "allow");

  const wrong = {
    ...clear,
    start: { ...clear.start, aya_idx: 2 },
  };
  assert.equal(correctionMatchesTarget(wrong, 1, 1), false);
  const g2 = gateFromCorrection(wrong, 1, 1);
  assert.equal(g2.ok, false);
  assert.equal(g2.advance, "block");
});

test("wordIndicesFromMuaalemErrors maps char span", () => {
  const result = {
    start: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 0 },
    end: { sura_idx: 1, aya_idx: 1, uthmani_word_idx: 4 },
    uthmani_text: "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ",
    errors: [{ uthmani_pos: [0, 5] }],
  };
  assert.deepEqual(wordIndicesFromMuaalemErrors(result), [1]);
});
