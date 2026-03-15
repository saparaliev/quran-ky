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
  chapters: [],
  cur: null,
  verses: [],
  transText: [],
  lang: 'en',
  q: '',
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
  setState({
    cur: ch,
    view: 'surah',
    vLoading: true,
    verses: [],
    transText: [],
    selWord: null,
    tafOpen: null,
    playing: null,
    hlWord: -1
  });
  stopAudio();
  await fetchWBW(ch.number, state.lang);
  loadTrans(ch.number, state.lang);
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  const ae = document.activeElement;
  const wasFocused = ae && ae.tagName === 'INPUT' && ae.classList.contains('search');
  const cursorPos = wasFocused ? ae.selectionStart : 0;

  app.classList.add('view-enter');
  app.innerHTML = '';
  app.appendChild(state.view === 'home' ? renderHome() : renderSurah());
  requestAnimationFrame(() => {
    app.classList.add('view-enter-active');
    app.classList.remove('view-enter');
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

  loadChapters();
  render();
})();

