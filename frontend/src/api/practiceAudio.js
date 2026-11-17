/**
 * Convert browser MediaRecorder blobs (often webm/opus) to 16 kHz mono WAV.
 * muaalem/librosa cannot decode webm → 500 Format not recognised.
 */

/** @param {Float32Array} samples @param {number} sampleRate */
export function encodeWavMono(samples, sampleRate) {
  const n = samples.length
  const bytes = new ArrayBuffer(44 + n * 2)
  const view = new DataView(bytes)
  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + n * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, n * 2, true)
  let o = 44
  for (let i = 0; i < n; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    o += 2
  }
  return new Blob([bytes], { type: 'audio/wav' })
}

function mixToMono(audioBuffer) {
  const { numberOfChannels, length } = audioBuffer
  if (numberOfChannels === 1) return audioBuffer.getChannelData(0).slice(0)
  const out = new Float32Array(length)
  for (let c = 0; c < numberOfChannels; c += 1) {
    const ch = audioBuffer.getChannelData(c)
    for (let i = 0; i < length; i += 1) out[i] += ch[i] / numberOfChannels
  }
  return out
}

/**
 * @param {Blob} blob
 * @param {number} [targetRate=16000]
 * @returns {Promise<Blob>} audio/wav
 */
export async function audioBlobToWav16k(blob, targetRate = 16000) {
  if (!blob || !blob.size) throw new Error('empty_audio')
  // Already WAV — still re-encode to guarantee 16 kHz mono for the engine.
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx) throw new Error('no_audio_context')
  const ctx = new Ctx()
  try {
    const ab = await blob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(ab.slice(0))
    const mono = mixToMono(decoded)
    const frameCount = Math.max(1, Math.ceil(decoded.duration * targetRate))
    const offline = new OfflineAudioContext(1, frameCount, targetRate)
    const buf = offline.createBuffer(1, mono.length, decoded.sampleRate)
    buf.copyToChannel(mono, 0)
    const src = offline.createBufferSource()
    src.buffer = buf
    src.connect(offline.destination)
    src.start(0)
    const rendered = await offline.startRendering()
    return encodeWavMono(rendered.getChannelData(0), targetRate)
  } finally {
    try {
      await ctx.close()
    } catch { /* ignore */ }
  }
}
