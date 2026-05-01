const AUDIO_BASE = 'https://everyayah.com/data/Alafasy_128kbps';

const pad3 = n => String(n).padStart(3, '0');

let audio = null;
let hlTimer = null;
let hlPollTimer = null;
let timeupdateScheduled = false;
let wakeLockSentinel = null;

function ensureAudio() {
  if (audio) return audio;
  audio = new Audio();
  audio.preload = 'auto';
  audio.onloadedmetadata = () => syncAudioMeta();
  audio.ontimeupdate = () => {
    syncAudioMeta();
  };
  audio.addEventListener('play', () => {
    try {
      const btn = document.getElementById('pBtn');
      if (btn) btn.textContent = '⏸';
    } catch (e) {}
    setState({ audioPaused: false, audioLoading: false });
  });
  audio.addEventListener('pause', () => {
    try {
      const btn = document.getElementById('pBtn');
      if (btn) btn.textContent = '▶';
    } catch (e) {}
    // Don't clear `playing` here — pause should keep the bar visible.
    setState({ audioPaused: true, audioLoading: false });
  });
  audio.addEventListener('canplay', () => {
    // Fallback: if we're waiting on audio, try to start.
    if (state.audioLoading) {
      try {
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(e => {
            console.log('Play error:', e);
            if (typeof window.qbToastKey === 'function') window.qbToastKey('tapToContinue');
          });
        }
      } catch (e) {}
    }
  });
  audio.addEventListener('playing', () => {
    if (state.audioLoading) setState({ audioLoading: false });
  });
  audio.addEventListener('error', () => {
    if (typeof window.qbToast === 'function') window.qbToast('Аудио жүктөлбөдү — кийинки аятка өтүүдө');
    const cur = state.playing ? String(state.playing) : '';
    const parts = cur.split(':');
    const sn = parseInt(parts[0], 10);
    const an = parseInt(parts[1], 10);
    if (state.continuous && state.cur && sn === state.cur.number && an && an < state.cur.numberOfAyahs) {
      setTimeout(() => playAyah(sn, an + 1), 1500);
    } else {
      stopAudio();
    }
  });
  return audio;
}

window.togglePlay = function togglePlay() {
  const au = audio;
  if (!au || !au.src || au.src === location.href) return;
  if (au.paused) {
    au.play().catch(e => console.log(e));
  } else {
    au.pause();
  }
};

function clamp(n, lo, hi) {
  if (!isFinite(n)) return lo;
  return Math.max(lo, Math.min(hi, n));
}

function syncAudioMeta() {
  if (!audio) return;
  const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
  const t = isFinite(audio.currentTime) && audio.currentTime >= 0 ? audio.currentTime : 0;
  setState({ audioDur: dur, audioTime: clamp(t, 0, dur || t) });
}

window.qcaSetPlaybackRate = function qcaSetPlaybackRate(r) {
  const rate = clamp(parseFloat(r), 0.25, 3);
  setState({ playbackRate: rate });
  if (audio) {
    try {
      audio.playbackRate = rate;
    } catch (e) {}
  }
};

window.qcaSeekAudio = function qcaSeekAudio(t) {
  if (!audio) return;
  try {
    const dur = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
    audio.currentTime = clamp(parseFloat(t), 0, dur || parseFloat(t));
    syncAudioMeta();
  } catch (e) {}
};

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
  // Stop current recitation without hiding the bar.
  pauseArabicRecitationOnly();
  timeupdateScheduled = false;
  const url = `${AUDIO_BASE}/${pad3(sn)}${pad3(an)}.mp3`;
  const au = ensureAudio();
  const newSrc = url;
  try {
    au.src = newSrc;
    au.load();
  } catch (e) {}
  try {
    au.playbackRate = state.playbackRate || 1.0;
  } catch (e) {}
  setState({ playing: `${sn}:${an}`, hlWord: 0, audioLoading: true });
  requestWakeLock();

  const v = state.verses.find(x => x.verse_number === an);
  const wordTimings = getWordTimings(v);

  function updateHighlight() {
    if (!au || !v) return;
    const currentMs = au.currentTime * 1000;
    const timings = wordTimings && wordTimings.length
      ? wordTimings
      : (au.duration > 0 ? getWordTimingsFallback(v, au.duration * 1000) : null);
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

  try {
    const p = au.play();
    if (p && typeof p.catch === 'function') {
      p.catch(e => {
        console.log('Play error:', e);
        if (typeof window.qbToastKey === 'function') window.qbToastKey('tapToContinue');
      });
    }
  } catch (e) {}
  au.ontimeupdate = () => {
    tick();
    syncAudioMeta();
  };
  hlPollTimer = setInterval(tick, 80);
  au.onended = () => {
    if (wordTimings && wordTimings.length) setState({ hlWord: wordTimings.length - 1 });
    if (state.continuous) {
      const ch = state.cur;
      if (ch && an < ch.numberOfAyahs) playAyah(sn, an + 1);
      else setState({ audioPaused: true, audioLoading: false });
    } else {
      // Keep bar visible; just mark paused when the verse ends.
      setState({ audioPaused: true, audioLoading: false });
    }
  };
}

/** Pause Everyayah recitation without setState — use before Kyrgyz aux play() so the click stays a valid user gesture. */
function pauseArabicRecitationOnly() {
  if (audio) {
    audio.pause();
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
  // Close/hide the audio bar.
  setState({ playing: null, hlWord: -1, audioTime: 0, audioDur: 0, audioLoading: false, audioPaused: true });
}

function playWordAudio(au) {
  if (!au) return;
  new Audio(`https://audio.qurancdn.com/${au}`).play().catch(() => {});
}

