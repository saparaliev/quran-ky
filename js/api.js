// API endpoints & editions
const QAPI = 'https://api.quran.com/api/v4';
const AAPI = 'https://api.alquran.cloud/v1';
const FAWAZ_CDN = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';
const TCDN = 'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir';

const EDITIONS = { en: 'en.sahih', ru: 'ru.kuliev' };
const FAWAZ_EDITIONS = { ky: 'kir-shamsaldinhakim' };

// Map our lang codes to WBW languages supported by Quran.com
// Quran.com supports WBW in: en, ur, bn, id, tr, hi, ta, fr, de, ru, zh, ml
// For unsupported langs, fallback to en
const WBW_LANG_MAP = { en: 'en', ru: 'ru', ky: 'en' };

// Names & meanings (populated from data/surah-names.json)
let SURAH_NAMES = {};
let SURAH_TR = {};

// Language list shared with render.js
const LANGS = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ky', name: 'Кыргызча', flag: '🇰🇬' }
];

// Tafsir source registry
// type: 'local' (QUL JSON in data/tafsir) or 'remote' (spa5k CDN)
const TAFSIR_SOURCES = {
  en: [
    { id: 'en-tafisr-ibn-kathir', type: 'remote', remoteId: 'en-tafisr-ibn-kathir', name: 'Ibn Kathir' },
    { id: 'en-tazkirul-quran', type: 'remote', remoteId: 'en-tazkirul-quran', name: 'Tazkirul Quran' }
  ],
  ky: [
    { id: 'kyrgyz-mokhtasar', type: 'local', file: 'tafsir/kyrgyz-mokhtasar.json', name: 'Кыска тафсир (Кыргызча)' }
  ],
  ru: [
    { id: 'russian-mokhtasar', type: 'local', file: 'tafsir/russian-mokhtasar.json', name: 'Мухтасар (рус.)' }
  ]
};

function getTafsirSourcesForLang(lang) {
  const own = TAFSIR_SOURCES[lang];
  if (own && own.length) return own;
  return TAFSIR_SOURCES.en || [];
}

// Cache for local QUL tafsir JSON
const localTafsirCache = {}; // key: source.id -> json object

// Kyrgyz word-by-word meanings: { "surah": { "ayah": ["meaning1", ...] } }
let wbwKyCache = null;

async function loadWbwKy() {
  if (wbwKyCache) return wbwKyCache;
  try {
    const r = await fetch('data/wbw-ky.json');
    if (!r.ok) return null;
    wbwKyCache = await r.json();
    return wbwKyCache;
  } catch (e) {
    console.error('Failed to load wbw-ky.json', e);
    return null;
  }
}

async function loadSurahNames() {
  try {
    const res = await fetch('data/surah-names.json');
    const data = await res.json();
    SURAH_NAMES = data.names || {};
    SURAH_TR = data.meanings || {};
  } catch (e) {
    console.error('Failed to load surah-names.json', e);
  }
}

async function loadChapters() {
  try {
    const res = await fetch('data/chapters.json');
    const data = await res.json();
    const chapters = Array.isArray(data) ? data : (data.chapters || []);
    setState({ chapters, loading: false });
  } catch (e) {
    console.error('Failed to load chapters.json, falling back to API', e);
    try {
      const r = await fetch(`${AAPI}/surah`);
      const d = await r.json();
      setState({ chapters: d.data || [], loading: false });
    } catch (e2) {
      console.error(e2);
      setState({ loading: false });
    }
  }
}

async function fetchWBW(chNum, langCode) {
  const wbwLang = WBW_LANG_MAP[langCode] || 'en';
  try {
    let all = [];
    let pg = 1;
    while (true) {
      const url = `${QAPI}/verses/by_chapter/${chNum}?language=${wbwLang}&word_translation_language=${wbwLang}&words=true&word_fields=text_uthmani,translation,transliteration&per_page=50&page=${pg}&translations=131&fields=text_uthmani&audio=7`;
      const r = await fetch(url);
      const d = await r.json();
      all = [...all, ...(d.verses || [])];
      if (!d.pagination || pg >= d.pagination.total_pages) break;
      pg++;
    }
    let patch = { verses: all, vLoading: false, wbw: true };
    if (langCode === 'ky') {
      const wbwKyData = await loadWbwKy();
      if (wbwKyData) patch.wbwKyData = wbwKyData;
    }
    setState(patch);
  } catch (e) {
    console.error('WBW failed, falling back to uthmani only', e);
    try {
      const r = await fetch(`${AAPI}/surah/${chNum}/quran-uthmani`);
      const d = await r.json();
      const verses = (d.data?.ayahs || []).map(a => ({
        id: a.number,
        verse_number: a.numberInSurah,
        text_uthmani: a.text,
        words: [],
        translations: []
      }));
      setState({ verses, wbw: false, vLoading: false });
    } catch (e2) {
      console.error(e2);
      setState({ vLoading: false });
    }
  }
}

async function loadTrans(chNum, langCode) {
  // Fawaz CDN for Kyrgyz & Kazakh
  if (FAWAZ_EDITIONS[langCode]) {
    try {
      const ed = FAWAZ_EDITIONS[langCode];
      const r = await fetch(`${FAWAZ_CDN}/${ed}/${chNum}.json`);
      const d = await r.json();
      if (d.chapter && Array.isArray(d.chapter)) {
        setState({ transText: d.chapter.map(v => v.text) });
      } else {
        setState({ transText: [] });
      }
    } catch (e) {
      console.error('Fawaz translation error', e);
      setState({ transText: [] });
    }
    return;
  }

  const ed = EDITIONS[langCode];
  if (!ed) {
    setState({ transText: [] });
    return;
  }
  try {
    const r = await fetch(`${AAPI}/surah/${chNum}/${ed}`);
    const d = await r.json();
    const arr = (d.data?.ayahs || []).map(a => a.text);
    setState({ transText: arr });
  } catch (e) {
    console.error('Translation error', e);
    setState({ transText: [] });
  }
}

async function ensureLocalTafsirLoaded(sourceId) {
  if (localTafsirCache[sourceId]) return localTafsirCache[sourceId];
  const allSources = Object.values(TAFSIR_SOURCES).flat();
  const src = allSources.find(s => s.id === sourceId && s.type === 'local');
  if (!src) return null;
  try {
    const r = await fetch(src.file);
    const json = await r.json();
    localTafsirCache[sourceId] = json;
    return json;
  } catch (e) {
    console.error('Failed to load local tafsir', sourceId, e);
    return null;
  }
}

function extractQULTafsirText(json, surah, ayah) {
  if (!json) return null;
  let key = `${surah}:${ayah}`;
  const visited = new Set();

  while (key && !visited.has(key)) {
    visited.add(key);
    const val = json[key];
    if (!val) return null;

    if (typeof val === 'string') {
      // pointer to another key like "2:3"
      key = val;
      continue;
    }

    if (typeof val === 'object' && val.text) {
      return val.text;
    }

    return null;
  }

  return null;
}

async function loadTaf(surahNumber, ayahNumber) {
  const lang = state.lang;
  const sources = getTafsirSourcesForLang(lang);
  if (!sources.length) return;

  const currentId = state.tafSrc && sources.find(s => s.id === state.tafSrc) ? state.tafSrc : sources[0].id;
  if (currentId !== state.tafSrc) {
    setState({ tafSrc: currentId });
  }

  const cacheKey = `${currentId}:${surahNumber}:${ayahNumber}`;
  if (state.tafData[cacheKey]) return;

  const src = sources.find(s => s.id === currentId);
  if (!src) return;

  try {
    if (src.type === 'local') {
      const json = await ensureLocalTafsirLoaded(src.id);
      const text = extractQULTafsirText(json, surahNumber, ayahNumber) || 'Тафсир бул аят үчүн табылган жок.';
      setState(s => ({ tafData: { ...s.tafData, [cacheKey]: text } }));
      return;
    }

    // remote spa5k tafsir
    const remoteId = src.remoteId || src.id;
    const r = await fetch(`${TCDN}/${remoteId}/${surahNumber}/${ayahNumber}.json`);
    if (!r.ok) throw new Error('remote tafsir not ok');
    const d = await r.json();
    const text = d.text || 'Not available';
    setState(s => ({ tafData: { ...s.tafData, [cacheKey]: text } }));
  } catch (e) {
    console.error('Tafsir load error', e);
    setState(s => ({
      tafData: {
        ...s.tafData,
        [cacheKey]: '<p>Tafsir not available for this ayah.</p>'
      }
    }));
  }
}

