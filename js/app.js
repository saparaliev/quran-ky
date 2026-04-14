// POS mapping kept for potential future UI use
const POS = {
  N: 'Noun',
  V: 'Verb',
  ADJ: 'Adjective',
  PRON: 'Pronoun',
  PREP: 'Preposition',
  REL: 'Relative Pronoun',
  PN: 'Proper Noun',
  DEM: 'Demonstrative',
  COND: 'Conditional',
  NEG: 'Negative',
  ACC: 'Accusative Particle',
  T: 'Time Adverb',
  LOC: 'Location',
  EMPH: 'Emphatic',
  INTG: 'Interrogative',
  RES: 'Restriction',
  CIRC: 'Circumstantial',
  COM: 'Comitative',
  EXP: 'Exceptive',
  INC: 'Inceptive',
  SUP: 'Supplementary',
  VOC: 'Vocative'
};

let state = {
  view: 'home',
  menuOpen: false,
  chapters: [],
  cur: null,
  verses: [],
  transText: [],
  translitEn: null,
  lang: 'en',
  // Unified transliteration toggle:
  // - en: Latin transliteration from data/english-transliteration-rtf-updated.json
  // - ru/ky: Cyrillic transliteration from kazakh_translit.json (dataset label: KZ)
  showTranslit: localStorage.getItem('qca_show_translit') !== '0',
  q: '',
  searchResults: null,
  searchAllLoading: false,
  searchAllLoaded: false,
  searchCount: 0,
  pendingJump: null, // { surah: number, ayah: number }
  wbw: true,
  selWord: null,
  bmarks: JSON.parse(localStorage.getItem('qca_bm') || '[]'),
  playing: null,
  hlWord: -1,
  continuous: false,
  tafOpen: null,
  tafData: {},
  tafSrc: null,
  wbwKyData: null,
  speakingTafsirKey: null,
  speaking: false,
  /** `surah:ayah` when kyAuxAudioTafsir is playing prerecorded Kyrgyz mokhtasar */
  playingKyTafsirKey: null,
  speechRate: 1.0,
  showLang: false,
  loading: true,
  vLoading: false
};

function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  Object.assign(state, next);
  render();
}

// --- Full search caches (session only) ---
const searchCacheKy = new Map(); // surah -> [ky verse text...]
const searchCacheAr = new Map(); // surah -> [ar verse text...]
const searchFetchInFlightKy = new Map(); // surah -> Promise
const searchFetchInFlightAr = new Map(); // surah -> Promise
let searchAllInFlight = null;
let searchDebounceTimer = null;

function normFold(s) {
  return String(s || '').toLocaleLowerCase();
}

function normKey(s) {
  const t = normFold(s);
  try {
    // Remove punctuation/whitespace for fuzzy name matches (e.g. "fatiha" vs "al-fatihah")
    return t.replace(/[^\p{L}\p{N}]+/gu, '');
  } catch (e) {
    return t.replace(/[^a-z0-9\u0400-\u04FF\u0600-\u06FF]+/gi, '');
  }
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function highlightHtml(text, query) {
  const t = String(text || '');
  const q = String(query || '');
  if (!t || !q) return escapeHtml(t);
  const tf = normFold(t);
  const qf = normFold(q);
  const idx = tf.indexOf(qf);
  if (idx < 0) return escapeHtml(t);
  const before = t.slice(0, idx);
  const mid = t.slice(idx, idx + q.length);
  const after = t.slice(idx + q.length);
  return `${escapeHtml(before)}<mark class="qhl">${escapeHtml(mid)}</mark>${escapeHtml(after)}`;
}

async function fetchKySurahMin(surahNum) {
  if (searchCacheKy.has(surahNum)) return searchCacheKy.get(surahNum);
  if (searchFetchInFlightKy.has(surahNum)) return await searchFetchInFlightKy.get(surahNum);
  const p = (async () => {
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/kir-shamsaldinhakim/${surahNum}.min.json`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`ky min json not ok: ${r.status}`);
    const d = await r.json();
    const arr = Array.isArray(d.chapter) ? d.chapter : (d.data?.ayahs || d.ayahs || []);
    const texts = (arr || []).map(x => (typeof x === 'string' ? x : (x.text || '')));
    searchCacheKy.set(surahNum, texts);
    return texts;
  })();
  searchFetchInFlightKy.set(surahNum, p);
  try {
    return await p;
  } finally {
    searchFetchInFlightKy.delete(surahNum);
  }
}

async function fetchArabicSurah(surahNum) {
  if (searchCacheAr.has(surahNum)) return searchCacheAr.get(surahNum);
  if (searchFetchInFlightAr.has(surahNum)) return await searchFetchInFlightAr.get(surahNum);
  const p = (async () => {
    const r = await fetch(`https://api.alquran.cloud/v1/surah/${surahNum}/quran-uthmani`);
    if (!r.ok) throw new Error(`arabic surah not ok: ${r.status}`);
    const d = await r.json();
    const ay = d.data?.ayahs || [];
    const texts = ay.map(a => a.text || '');
    searchCacheAr.set(surahNum, texts);
    return texts;
  })();
  searchFetchInFlightAr.set(surahNum, p);
  try {
    return await p;
  } finally {
    searchFetchInFlightAr.delete(surahNum);
  }
}

function getSurahLabel(surahNum) {
  const ch = state.chapters.find(c => c.number === surahNum);
  if (!ch) return `Surah ${surahNum}`;
  return SURAH_NAMES[state.lang]?.[surahNum - 1] || ch.englishName || `Surah ${surahNum}`;
}

function buildChapterGroups(query) {
  const raw = String(query || '').trim();
  if (!raw) return [];
  const qf = normFold(raw);
  const qk = normKey(raw);
  const groups = [];

  const onlyNum = /^\d{1,3}$/.test(raw) ? parseInt(raw, 10) : null;
  if (onlyNum && onlyNum >= 1 && onlyNum <= 114) {
    groups.push({ surah: onlyNum, label: getSurahLabel(onlyNum), hits: [] });
  }

  for (const ch of state.chapters || []) {
    const sn = ch.number;
    const nameLocalized = SURAH_NAMES[state.lang]?.[sn - 1] || '';
    const meaningLocalized = SURAH_TR[state.lang]?.[sn - 1] || '';
    const nameEnList = SURAH_NAMES.en?.[sn - 1] || '';
    const meaningEnList = SURAH_TR.en?.[sn - 1] || '';
    const enName = ch.englishName || '';
    const enMeaning = ch.englishNameTranslation || '';
    const arName = ch.name || '';

    const nameFields = [nameLocalized, meaningLocalized, nameEnList, meaningEnList, enName, enMeaning];
    const matchesName =
      nameFields.some(f => normFold(f).includes(qf)) ||
      nameFields.some(f => normKey(f).includes(qk));

    const matches =
      matchesName ||
      String(sn).includes(raw) ||
      (arName && String(arName).includes(raw));

    if (matches && !groups.some(g => g.surah === sn)) {
      groups.push({ surah: sn, label: getSurahLabel(sn), hits: [] });
    }
  }

  groups.sort((a, b) => a.surah - b.surah);
  return groups;
}

function buildSearchResults(query) {
  const q = String(query || '').trim();
  const qf = normFold(q);
  if (!q || q.length < 3) return { groups: [], count: 0 };

  const groups = [];
  let total = 0;
  for (const [surahNum, kyVerses] of searchCacheKy.entries()) {
    if (!Array.isArray(kyVerses) || !kyVerses.length) continue;
    const hits = [];
    for (let i = 0; i < kyVerses.length; i++) {
      const ky = kyVerses[i] || '';
      if (normFold(ky).includes(qf)) hits.push({ surah: surahNum, ayah: i + 1, ky });
    }
    if (hits.length) {
      total += hits.length;
      groups.push({ surah: surahNum, label: getSurahLabel(surahNum), hits });
    }
  }
  groups.sort((a, b) => a.surah - b.surah);
  return { groups, count: total };
}

function scheduleFullSearch(nextQ) {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  const q = String(nextQ || '');
  searchDebounceTimer = setTimeout(() => {
    const trimmed = q.trim();
    const onlyNum = /^\d{1,3}$/.test(trimmed) ? parseInt(trimmed, 10) : null;
    if ((!trimmed || trimmed.length < 3) && !(onlyNum && onlyNum >= 1 && onlyNum <= 114)) {
      setState({ searchResults: null, searchCount: 0 });
      return;
    }

    const chapterGroups = buildChapterGroups(trimmed);
    const { groups: verseGroups, count } = buildSearchResults(trimmed);
    const merged = [
      ...chapterGroups,
      ...verseGroups.filter(vg => !chapterGroups.some(cg => cg.surah === vg.surah))
    ];
    setState({ searchResults: merged, searchCount: count });

    (merged || []).forEach(g => {
      if (!(g.hits || []).length) return;
      if (!searchCacheAr.has(g.surah)) {
        fetchArabicSurah(g.surah).then(() => render()).catch(() => {});
      }
    });
  }, 180);
}

async function searchAllSurahsNow() {
  if (state.searchAllLoaded) return;
  if (searchAllInFlight) return await searchAllInFlight;
  const q = String(state.q || '').trim();
  if (!q || q.length < 3) return;

  setState({ searchAllLoading: true });
  searchAllInFlight = (async () => {
    for (let n = 1; n <= 114; n++) {
      if (!searchCacheKy.has(n)) {
        try {
          await fetchKySurahMin(n);
        } catch (e) {}
      }
    }
  })();

  try {
    await searchAllInFlight;
  } finally {
    searchAllInFlight = null;
  }

  const { groups, count } = buildSearchResults(q);
  const chapterGroups = buildChapterGroups(q);
  const merged = [
    ...chapterGroups,
    ...groups.filter(vg => !chapterGroups.some(cg => cg.surah === vg.surah))
  ];
  setState({ searchAllLoading: false, searchAllLoaded: true, searchResults: merged, searchCount: count });

  (merged || []).forEach(g => {
    if (!(g.hits || []).length) return;
    if (!searchCacheAr.has(g.surah)) {
      fetchArabicSurah(g.surah).then(() => render()).catch(() => {});
    }
  });
}

async function openSurahAt(surahNum, ayahNum) {
  const ch = state.chapters.find(c => c.number === surahNum);
  if (!ch) return;
  setState({ pendingJump: { surah: surahNum, ayah: ayahNum } });
  await loadSurah(ch);
}

/** Cache: URL -> true (exists) | false (missing) */
const kyStaticAudioUrlCache = new Map();

/** Kyrgyz MP3 players (not the hidden <audio> tags — those were unreliable after load/pause). */
let kyTransPlayer = null;
let kyTafsirPlayer = null;

function pauseAllKyPrerecorded() {
  if (kyTransPlayer) {
    try {
      kyTransPlayer.pause();
    } catch (e) {
      /* ignore */
    }
    kyTransPlayer = null;
  }
  if (kyTafsirPlayer) {
    try {
      kyTafsirPlayer.pause();
    } catch (e) {
      /* ignore */
    }
    kyTafsirPlayer = null;
  }
  state.playingKyTafsirKey = null;
}

window.pauseAllKyPrerecorded = pauseAllKyPrerecorded;

/**
 * Play Kyrgyz translation or tafsir MP3. Uses a fresh Audio() per tap.
 */
function playKyStaticAudio(kind, url, verseKey) {
  if (typeof pauseArabicRecitationOnly === 'function') pauseArabicRecitationOnly();
  pauseAllKyPrerecorded();
  stopTafsirSpeech();

  const abs = new URL(url, window.location.href).href;
  const a = new Audio();
  a.preload = 'auto';
  a.src = abs;
  try {
    a.load();
  } catch (e) {
    /* ignore */
  }

  if (kind === 'tafsir') {
    kyTafsirPlayer = a;
    a.addEventListener('ended', () => {
      if (kyTafsirPlayer !== a) return;
      kyTafsirPlayer = null;
      state.playingKyTafsirKey = null;
      render();
    });
    a.addEventListener('error', () => {
      if (kyTafsirPlayer === a) kyTafsirPlayer = null;
      state.playingKyTafsirKey = null;
      render();
    });
  } else {
    kyTransPlayer = a;
    a.addEventListener('ended', () => {
      if (kyTransPlayer === a) kyTransPlayer = null;
    });
    a.addEventListener('error', () => {
      if (kyTransPlayer === a) kyTransPlayer = null;
    });
  }

  const patch = { playing: null, hlWord: -1 };
  if (kind === 'tafsir' && verseKey) patch.playingKyTafsirKey = verseKey;
  else if (kind === 'trans') patch.playingKyTafsirKey = null;

  const playPromise = a.play();
  if (playPromise && typeof playPromise.catch === 'function') {
    playPromise.catch(() => {
      if (kind === 'tafsir' && kyTafsirPlayer === a) kyTafsirPlayer = null;
      if (kind === 'trans' && kyTransPlayer === a) kyTransPlayer = null;
      state.playingKyTafsirKey = null;
      render();
    });
  }
  setState(patch);
}

function toggleKyTafsirPrerecorded(url, verseKey) {
  if (state.playingKyTafsirKey === verseKey) {
    if (kyTafsirPlayer && !kyTafsirPlayer.paused) {
      kyTafsirPlayer.pause();
      kyTafsirPlayer = null;
    }
    state.playingKyTafsirKey = null;
    render();
    return;
  }
  playKyStaticAudio('tafsir', url, verseKey);
}

/** Probe local MP3; show button only if it exists (hide silently on 404). */
function probeKyStaticAudioButton(btn, url) {
  if (!btn || !url) return;
  const cached = kyStaticAudioUrlCache.get(url);
  if (cached === true) {
    btn.style.display = '';
    return;
  }
  if (cached === false) {
    btn.style.display = 'none';
    return;
  }

  // default hidden; only show if file exists
  btn.style.display = 'none';
  const mark = ok => {
    kyStaticAudioUrlCache.set(url, ok);
    btn.style.display = ok ? '' : 'none';
  };

  fetch(url, { method: 'HEAD' })
    .then(r => (r.ok ? true : fetch(url, { method: 'GET', headers: { Range: 'bytes=0-0' } }).then(r2 => r2.ok)))
    .then(ok => mark(!!ok))
    .catch(() => mark(false));
}

function initKyStaticAudioButtons() {
  document.querySelectorAll('[data-ky-static-audio]').forEach(btn => {
    probeKyStaticAudioButton(btn, btn.getAttribute('data-ky-static-audio'));
  });
}

window.clearPlayingKyTafsirKey = function () {
  state.playingKyTafsirKey = null;
};

function stopTafsirSpeech() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  state.speakingTafsirKey = null;
  state.speaking = false;
}

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html || '';
  return div.textContent || div.innerText || '';
}

function getVoiceForLang(lang) {
  if (!('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();

  if (!voices || !voices.length) return null;

  const findByName = name => {
    const n = name.toLowerCase();
    return voices.find(v => (v.name || '').toLowerCase().includes(n));
  };

  const findByLangPrefix = tag =>
    voices.find(v => (v.lang || '').toLowerCase().startsWith(tag.toLowerCase()));

  const findProviderLang = (provider, tag) =>
    voices.find(
      v =>
        (v.name || '').toLowerCase().includes(provider.toLowerCase()) &&
        (v.lang || '').toLowerCase().startsWith(tag.toLowerCase())
    );

  // Russian and Cyrillic-family fallbacks (ru/ky)
  if (lang === 'ru' || lang === 'ky') {
    const ruPreferredNames = ['Google русский', 'Microsoft Pavel', 'Microsoft Irina'];
    for (const n of ruPreferredNames) {
      const v = findByName(n);
      if (v) return v;
    }

    const googleRu = findProviderLang('Google', 'ru');
    if (googleRu) return googleRu;
    const msRu = findProviderLang('Microsoft', 'ru');
    if (msRu) return msRu;

    const byTag =
      findByLangPrefix('ru-RU') || findByLangPrefix('ru') || findByLangPrefix('uk') || null;
    if (byTag) return byTag;
  }

  // English
  if (lang === 'en') {
    const enPreferredNames = ['Google US English', 'Microsoft Mark'];
    for (const n of enPreferredNames) {
      const v = findByName(n);
      if (v) return v;
    }

    const googleEn = findProviderLang('Google', 'en-us') || findProviderLang('Google', 'en');
    if (googleEn) return googleEn;
    const msEn = findProviderLang('Microsoft', 'en-us') || findProviderLang('Microsoft', 'en');
    if (msEn) return msEn;

    const byTag =
      findByLangPrefix('en-US') ||
      findByLangPrefix('en-GB') ||
      findByLangPrefix('en') ||
      null;
    if (byTag) return byTag;
  }

  // Generic language-based fallback
  const genericPreferred = {
    en: ['en-US', 'en-GB', 'en'],
    ru: ['ru-RU', 'ru'],
    ky: ['ky', 'ru-RU', 'ru']
  }[lang] || ['en-US', 'en'];

  for (const tag of genericPreferred) {
    const v = findByLangPrefix(tag);
    if (v) return v;
  }

  // Last resort: any voice
  return voices[0] || null;
}

function playTafsirSpeech(surahNumber, ayahNumber, sourceId, htmlText) {
  stopTafsirSpeech();
  if (typeof pauseKyAuxAudio === 'function') pauseKyAuxAudio();
  state.playingKyTafsirKey = null;
  if (!('speechSynthesis' in window)) return;

  const plain = stripHtml(htmlText);
  if (!plain.trim()) return;

  const utter = new SpeechSynthesisUtterance(plain);
  const v = getVoiceForLang(state.lang);
  if (v) utter.voice = v;
  utter.rate = state.speechRate || 1.0;

  const key = `${sourceId}:${surahNumber}:${ayahNumber}`;
  state.speakingTafsirKey = key;
  state.speaking = true;
  render();

  utter.onend = () => {
    state.speakingTafsirKey = null;
    state.speaking = false;
    render();
  };
  utter.onerror = () => {
    state.speakingTafsirKey = null;
    state.speaking = false;
    render();
  };

  window.speechSynthesis.speak(utter);
}

async function loadSurah(ch) {
  stopTafsirSpeech();
  if (typeof pauseKyAuxAudio === 'function') pauseKyAuxAudio();
  setState({
    cur: ch,
    view: 'surah',
    vLoading: true,
    verses: [],
    transText: [],
    selWord: null,
    translitEn: null,
    tafOpen: null,
    playing: null,
    hlWord: -1,
    playingKyTafsirKey: null
  });
  stopAudio();
  const [wbwDone, transDone, translitEn] = await Promise.all([
    fetchWBW(ch.number, state.lang),
    loadTrans(ch.number, state.lang),
    loadTransliterationEn()
  ]);
  if (translitEn) {
    setState({ translitEn });
  }
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  const ae = document.activeElement;
  const wasFocused = ae && ae.tagName === 'INPUT' && ae.classList.contains('search');
  const cursorPos = wasFocused ? ae.selectionStart : 0;

  app.classList.add('view-enter');
  app.innerHTML = '';
  const viewEl =
    state.view === 'home'
      ? renderHome()
      : state.view === 'surah'
        ? renderSurah()
        : state.view === 'feedback'
          ? renderFeedback()
          : state.view === 'contribute'
            ? renderContribute()
            : state.view === 'about'
              ? renderAbout()
              : renderHome();
  app.appendChild(viewEl);
  requestAnimationFrame(() => {
    app.classList.add('view-enter-active');
    app.classList.remove('view-enter');
    initKyStaticAudioButtons();
    // If we navigated from search, scroll to the requested ayah once rendered.
    if (state.pendingJump && state.view === 'surah' && state.cur && state.cur.number === state.pendingJump.surah) {
      const an = state.pendingJump.ayah;
      state.pendingJump = null;
      requestAnimationFrame(() => {
        const el = document.getElementById(`v-${an}`);
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  });

  if (wasFocused) {
    const inp = app.querySelector('.search');
    if (inp) {
      inp.focus();
      inp.selectionStart = inp.selectionEnd = cursorPos;
    }
  }
}

(async function init() {
  await loadSurahNames();

  const initialSources = getTafsirSourcesForLang(state.lang);
  if (initialSources.length && !state.tafSrc) {
    state.tafSrc = initialSources[0].id;
  }

  // Kazakh Cyrillic transliteration dataset (optional). Loaded once at startup.
  // Kept as a global to avoid pushing a large object into state.
  window.translitData = null;
  fetch('kazakh_translit.json')
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      if (d && typeof d === 'object') {
        window.translitData = d;
        render();
      }
    })
    .catch(() => {});

  loadChapters();
  render();
})();

