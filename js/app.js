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
  showLang: false,
  loading: true,
  vLoading: false
};

function setState(patch) {
  const next = typeof patch === 'function' ? patch(state) : patch;
  Object.assign(state, next);
  render();
}

async function loadSurah(ch) {
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

