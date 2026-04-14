const AUDIO_BASE = 'https://everyayah.com/data/Alafasy_128kbps';

const pad3 = n => String(n).padStart(3, '0');

let audio = null;
let hlTimer = null;
let hlPollTimer = null;
let timeupdateScheduled = false;
let wakeLockSentinel = null;

async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  } catch (e) {}
}

async function releaseWakeLock() {
  try {
    if (wakeLockSentinel) {
      await wakeLockSentinel.release();
      wakeLockSentinel = null;
    }
  } catch (e) {}
}

/**
 * Build word timings from API segments. Segments are [index, position, start_ms, end_ms].
 * Returns array of { startMs, endMs } for each word (char_type_name === 'word'), in order.
 */
function getWordTimings(verse) {
  if (!verse || !verse.audio || !Array.isArray(verse.audio.segments) || !verse.audio.segments.length) return null;
  const words = verse.words.filter(w => w.char_type_name === 'word');
  if (!words.length) return null;
  const segs = verse.audio.segments.slice(0, words.length).sort((a, b) => (a[1] || a[0]) - (b[1] || b[0]));
  return segs.map(seg => ({ startMs: seg[2], endMs: seg[3] }));
}

/**
 * Fallback: weight duration by word length (Arabic character count) when no segments.
 */
function getWordTimingsFallback(verse, durationMs) {
  const words = verse.words.filter(w => w.char_type_name === 'word');
  if (!words.length) return null;
  const totalLen = words.reduce((s, w) => s + (w.text_uthmani || w.text || '').length, 0) || 1;
  let t = 0;
  return words.map(w => {
    const len = (w.text_uthmani || w.text || '').length || 1;
    const span = (durationMs * len) / totalLen;
    const startMs = t;
    t += span;
    return { startMs, endMs: t };
  });
}

function pauseKyAuxAudio() {
  if (typeof window.pauseAllKyPrerecorded === 'function') {
    window.pauseAllKyPrerecorded();
  }
  ['kyAuxAudioTrans', 'kyAuxAudioTafsir'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.pause();
      el.currentTime = 0;
      try {
        el.removeAttribute('src');
      } catch (e) {
        /* ignore */
      }
    }
  });
}

function playAyah(sn, an) {
  pauseKyAuxAudio();
  stopAudio();
  timeupdateScheduled = false;
  const url = `${AUDIO_BASE}/${pad3(sn)}${pad3(an)}.mp3`;
  audio = new Audio(url);
  setState({ playing: `${sn}:${an}`, hlWord: 0 });
  requestWakeLock();

  const v = state.verses.find(x => x.verse_number === an);
  const wordTimings = getWordTimings(v);

  function updateHighlight() {
    if (!audio || !v) return;
    const currentMs = audio.currentTime * 1000;
    const timings = wordTimings && wordTimings.length
      ? wordTimings
      : (audio.duration > 0 ? getWordTimingsFallback(v, audio.duration * 1000) : null);
    if (!timings || !timings.length) {
      timeupdateScheduled = false;
      return;
    }
    let idx = 0;
    for (let i = 0; i < timings.length; i++) {
      if (currentMs < timings[i].startMs) break;
      if (currentMs < timings[i].endMs) {
        idx = i;
        break;
      }
      idx = i;
    }
    setState({ hlWord: idx });
    timeupdateScheduled = false;
  }

  function tick() {
    if (timeupdateScheduled) return;
    timeupdateScheduled = true;
    requestAnimationFrame(() => {
      updateHighlight();
    });
  }

  audio.play().catch(() => {});
  audio.onloadedmetadata = () => {};
  audio.ontimeupdate = tick;
  hlPollTimer = setInterval(tick, 80);
  audio.onended = () => {
    if (wordTimings && wordTimings.length) setState({ hlWord: wordTimings.length - 1 });
    stopAudio();
    if (state.continuous) {
      const ch = state.cur;
      if (ch && an < ch.numberOfAyahs) playAyah(sn, an + 1);
    }
  };
  audio.onerror = () => stopAudio();
}

/** Pause Everyayah recitation without setState — use before Kyrgyz aux play() so the click stays a valid user gesture. */
function pauseArabicRecitationOnly() {
  if (audio) {
    audio.pause();
    audio = null;
  }
  clearInterval(hlTimer);
  clearInterval(hlPollTimer);
  hlTimer = null;
  hlPollTimer = null;
  timeupdateScheduled = false;
}

function stopAudio() {
  pauseArabicRecitationOnly();
  releaseWakeLock();
  setState({ playing: null, hlWord: -1 });
}

function playWordAudio(au) {
  if (!au) return;
  new Audio(`https://audio.qurancdn.com/${au}`).play().catch(() => {});
}

