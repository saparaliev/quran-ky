function readSurahListFilter() {
  const v = localStorage.getItem('qb_filter');
  if (v === 'all' || v === 'meccan' || v === 'medinan' || v === 'juz') return v;
  return 'all';
}

/** Stored app language (UI + Quran translation). Persists as `qb_lang`. */
function readStoredLang() {
  const raw = localStorage.getItem('qb_lang');
  return raw === 'en' || raw === 'ru' || raw === 'ky' ? raw : 'ky';
}

const i18n = {
  ky: {
    tagline: 'Куранды окуу жана үйрөнүү',
    btnSearch: 'Издөө',
    btnBookmark: 'Белги',
    searchPlaceholder: 'Сүрө издөө...',
    tafsir: 'Тафсир',
    menuTitle: 'Меню',
    menuTooltip: 'Меню',
    langSelectAria: 'Тил (меню жана котормо)',
    navHome: 'Башкы',
    navBookmarks: 'Белгилер',
    navFeedback: 'Пикир',
    navContribute: 'Салым',
    navAbout: 'Тууралуу',
    loadingSurahs: 'Сүрөлөр жүктөлүүдө...',
    loading: 'Жүктөлүүдө...',
    loadingTafsir: 'Тафсир жүктөлүүдө...',
    searchLabelSearching: 'Издөө (оффлайн + кэш)',
    searchBtnAll: 'Бардык сүрөлөрдөн издөө',
    searchLoading: 'Жүктөлүүдө...',
    searchNone: 'Эч нерсе табылган жок',
    searchFound: '{n} нетижө табылды',
    metaAyahs: 'аят',
    bookmarksEmpty: 'Белги жок',
    pageFeedback: 'Пикир',
    pageContribute: 'Салым',
    pageAbout: 'Тууралуу',
    feedbackIntro: 'Көйгөйлөр, идеялар же суроолорду жазыңыз. Жооптор Typeform аркылуу коопсуз чогултулат.',
    feedbackConnectTitle: 'Typeform туташтырыңыз',
    feedbackConnectBody:
      'js/render.js файлында TYPEFORM_FEEDBACK_ID көрсөтүңүз (же бөлүшүү шилтемесиндеги /to/ ID). Андан кийин бул бетти жаңыртыңыз.',
    contributeTitle: 'Салым',
    contributeBody: 'Жакында PayPal / банк которууларынын реквизиттерин кошобуз.',
    aboutTitle: 'Quran Bulak тууралуу',
    aboutBody1:
      'Биз Чыгыш Азия аудиториясы үчүн жөнөкөй жана тез Куран окуу тажрыйбасын түзүүгө аракет кылган аз эле адамбыз.',
    aboutBody2:
      'Биздин максат — Араб тексти, котормолор, тафсир жана мобилдикке ыңгайлуу интерфейс аркылуу насыйаттуу окуу.',
    aboutBody3: 'Пикирлер кошумча — менюдан «Пикир» баракчасын колдонуңуз.',
    wMean: 'Маани',
    wPos: 'Орун',
    wpPosFmt: 'Сөз {word} • {ayah}-аят',
    autoPlay: 'Авто ⏩',
    errGeneric: 'Жүктөө катасы. Интернетти текшериңиз же кайра аракет кылыңыз.',
    titleDoc: 'Quran Bulak',
    ttWbw: 'Сөзмө-сөз көрүнүшү',
    ttTranslit: 'Транслитерация',
    btnWbw: 'Сөзмө-сөз',
    btnPhonetic: 'Транслит',
    ttContinuous: 'Улантуу менен окуу',
    ttTafsirRate: 'Тафсир үнү ылдамдыгы',
    ttStopTafsirTts: 'Тафсирди токтотуу',
    ttPlayTafsirTts: 'Тафсирди окуу (браузер)',
    ttPlayKyTafsir: 'Кыргызча тафсир аудиосу',
    ttPlayKyTrans: 'Кыргызча котормуу аудиосу',
    wbwNote: 'Сөз маанилери англисче көрсөтүлүүдө (WBW {lang} үчүн жеткиликтүү эмес)'
  },
  en: {
    tagline: 'Quran Reading and Learning',
    btnSearch: 'Search',
    btnBookmark: 'Bookmark',
    searchPlaceholder: 'Search surah...',
    tafsir: 'Tafsir',
    menuTitle: 'Menu',
    menuTooltip: 'Menu',
    langSelectAria: 'Language (menus & Quran text)',
    navHome: 'Home',
    navBookmarks: 'Bookmarks',
    navFeedback: 'Feedback',
    navContribute: 'Contribute',
    navAbout: 'About',
    loadingSurahs: 'Loading surahs...',
    loading: 'Loading...',
    loadingTafsir: 'Loading tafsir...',
    searchLabelSearching: 'Search (offline + cache)',
    searchBtnAll: 'Search all surahs',
    searchLoading: 'Loading...',
    searchNone: 'No results found',
    searchFound: '{n} results found',
    metaAyahs: 'ayahs',
    bookmarksEmpty: 'No bookmarks yet',
    pageFeedback: 'Feedback',
    pageContribute: 'Contribute',
    pageAbout: 'About',
    feedbackIntro:
      'Share bugs, ideas, or questions. Your answers are collected in our Typeform (secure form provider).',
    feedbackConnectTitle: 'Connect your Typeform',
    feedbackConnectBody:
      'In js/render.js, set TYPEFORM_FEEDBACK_ID from your published form’s share link (the part after /to/). Then reload this page.',
    contributeTitle: 'Contribute',
    contributeBody: 'We’ll add PayPal / bank transfer details here soon.',
    aboutTitle: 'About Quran Bulak',
    aboutBody1:
      'We are a small group of Quran enthusiasts building a simple, fast Quran reading experience for Central Asian audiences.',
    aboutBody2:
      'Our focus is mindful reading: Arabic text, translations, tafsir, and helpful study tools — with an interface that works well on mobile.',
    aboutBody3: 'Feedback is welcome — use the Feedback page from the menu.',
    wMean: 'Meaning',
    wPos: 'Position',
    wpPosFmt: 'Word {word} • Ayah {ayah}',
    autoPlay: 'Auto ⏩',
    errGeneric: 'Something went wrong while loading. Check your connection and try again.',
    titleDoc: 'Quran Bulak',
    ttWbw: 'Toggle word-by-word view',
    ttTranslit: 'Transliteration',
    btnWbw: 'Word by Word',
    btnPhonetic: 'Phonetic',
    ttContinuous: 'Continuous play',
    ttTafsirRate: 'Tafsir speech speed',
    ttStopTafsirTts: 'Stop tafsir audio',
    ttPlayTafsirTts: 'Play tafsir (browser)',
    ttPlayKyTafsir: 'Play Kyrgyz tafsir audio',
    ttPlayKyTrans: 'Play Kyrgyz translation audio',
    wbwNote: '⟡ Word meanings shown in English (WBW not available in {lang})'
  },
  ru: {
    tagline: 'Чтение и изучение Корана',
    btnSearch: 'Поиск',
    btnBookmark: 'Закладки',
    searchPlaceholder: 'Поиск суры...',
    tafsir: 'Тафсир',
    menuTitle: 'Меню',
    menuTooltip: 'Меню',
    langSelectAria: 'Язык (меню и текст Корана)',
    navHome: 'Главная',
    navBookmarks: 'Закладки',
    navFeedback: 'Отзыв',
    navContribute: 'Поддержать',
    navAbout: 'О приложении',
    loadingSurahs: 'Загрузка сур…',
    loading: 'Загрузка…',
    loadingTafsir: 'Загрузка тафсира…',
    searchLabelSearching: 'Поиск (offline + cache)',
    searchBtnAll: 'Искать во всех сурах',
    searchLoading: 'Загрузка…',
    searchNone: 'Ничего не найдено',
    searchFound: '{n} результатов найдено',
    metaAyahs: 'аятов',
    bookmarksEmpty: 'Закладок пока нет',
    pageFeedback: 'Отзыв',
    pageContribute: 'Поддержать',
    pageAbout: 'О приложении',
    feedbackIntro:
      'Сообщите об ошибке, идее или вопросе. Ответы собираются через Typeform (безопасная форма).',
    feedbackConnectTitle: 'Подключите Typeform',
    feedbackConnectBody:
      'В js/render.js задайте TYPEFORM_FEEDBACK_ID из ссылки опубликованной формы (часть после /to/). Затем перезагрузите страницу.',
    contributeTitle: 'Поддержать',
    contributeBody: 'Скоро добавим реквизиты PayPal / банковского перевода.',
    aboutTitle: 'О Quran Bulak',
    aboutBody1:
      'Мы небольшая группа энтузиастов Корана и делаем простое и быстрое приложение для чтения для аудитории Центральной Азии.',
    aboutBody2:
      'Фокус — вдумчивое чтение: арабский текст, переводы, тафсир и удобство на мобильных.',
    aboutBody3: 'Обратная связь приветствуется — страница «Отзыв» в меню.',
    wMean: 'Значение',
    wPos: 'Позиция',
    wpPosFmt: 'Слово {word} • Аят {ayah}',
    autoPlay: 'Авто ⏩',
    errGeneric: 'Ошибка загрузки. Проверьте соединение и попробуйте снова.',
    titleDoc: 'Quran Bulak',
    ttWbw: 'Показать пословно',
    ttTranslit: 'Транслитерация',
    btnWbw: 'Пословно',
    btnPhonetic: 'Транслит',
    ttContinuous: 'Непрерывное воспроизведение',
    ttTafsirRate: 'Скорость озвучивания тафсира',
    ttStopTafsirTts: 'Остановить аудио тафсира',
    ttPlayTafsirTts: 'Воспроизвести тафсир (браузер)',
    ttPlayKyTafsir: 'Аудио тафсира (кыргызский)',
    ttPlayKyTrans: 'Аудио перевода (кыргызский)',
    wbwNote: '⟡ Значения слов на английском (нет WBW для {lang})'
  }
};

function qbTranslate(key, vars) {
  const code =
    state && state.lang && (state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky')
      ? state.lang
      : readStoredLang();
  let s =
    (i18n[code] && i18n[code][key] != null
      ? i18n[code][key]
      : i18n.en[key] != null
        ? i18n.en[key]
        : i18n.ky[key] != null
          ? i18n.ky[key]
          : key);
  if (typeof s === 'string' && vars && typeof vars === 'object') {
    for (const [k, v] of Object.entries(vars)) {
      s = s.split(`{${k}}`).join(String(v));
    }
  }
  return s;
}

window.qbTranslate = qbTranslate;

window.qbSetUiLang = function qbSetUiLang(code) {
  if (code !== 'en' && code !== 'ru' && code !== 'ky') return;
  localStorage.setItem('qb_lang', code);
  const sources = getTafsirSourcesForLang(code);
  const nextTaf = sources[0]?.id || null;
  const patch = {
    lang: code,
    tafSrc: nextTaf,
    tafOpen: null,
    tafData: {},
    playingKyTafsirKey: null
  };
  if (code !== 'ky') patch.wbwKyData = null;
  if (state.view === 'surah' && state.cur) {
    if (typeof pauseKyAuxAudio === 'function') pauseKyAuxAudio();
    stopTafsirSpeech();
    patch.vLoading = true;
    loadTrans(state.cur.number, code);
    fetchWBW(state.cur.number, code);
  }
  setState(patch);
};

window.qbToastKey = function qbToastKey(key) {
  setState({ toastMsg: qbTranslate(key), toastUntil: Date.now() + 3800 });
};

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
  uiBookmarksOpen: false,
  toastMsg: null,
  toastUntil: 0,
  chapters: [],
  cur: null,
  verses: [],
  transText: [],
  translitEn: null,
  lang: readStoredLang(),
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
  surahListFilter: readSurahListFilter(),
  surahPickerOpen: false,
  surahPickerQ: '',
  surahPickerNonce: 0,
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

window.hl = function hl(el) {
  try {
    if (!el || !el.classList) return;
    el.classList.add('verse-hl');
    setTimeout(() => {
      try {
        el.classList.remove('verse-hl');
      } catch (e) {}
    }, 1200);
  } catch (e) {}
};


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

  // Lock page scroll when the side menu is open.
  try {
    document.body.style.overflow = state.menuOpen ? 'hidden' : '';
    document.body.classList.toggle('menu-open', !!state.menuOpen);
  } catch (e) {}

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

  if (state.toastMsg && state.toastUntil > Date.now()) {
    const toast = document.createElement('div');
    toast.className = 'qb-toast';
    toast.textContent = state.toastMsg;
    app.appendChild(toast);
    setTimeout(() => setState({ toastMsg: null, toastUntil: 0 }), 3200);
  }

  requestAnimationFrame(() => {
    app.classList.add('view-enter-active');
    app.classList.remove('view-enter');
    initKyStaticAudioButtons();

    document.documentElement.setAttribute('lang', state.lang || readStoredLang());
    document.title = qbTranslate('titleDoc');

    // If we navigated from search / juz, scroll to the requested ayah once rendered.
    // This can race with async verse loading, so retry once after a short delay.
    if (
      state.pendingJump &&
      state.view === 'surah' &&
      state.cur &&
      state.cur.number === state.pendingJump.surah &&
      !state.vLoading
    ) {
      const an = state.pendingJump.ayah;
      state.pendingJump = null;
      const tryScroll = (retry) => {
        const markerId = `juzm-${state.cur.number}-${an}`;
        const el = document.getElementById(markerId) || document.getElementById(`vc${an}`);
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Prefer highlighting the verse, even when we scroll to the marker.
          const vEl = document.getElementById(`vc${an}`);
          if (vEl && typeof window.hl === 'function') window.hl(vEl);
          return;
        }
        if (retry) {
          setTimeout(() => tryScroll(false), 500);
        }
      };
      requestAnimationFrame(() => tryScroll(true));
    }

    // Surah selector modal: on open, center active surah and focus search.
    if (state.surahPickerOpen && state.view === 'surah') {
      const nonce = state.surahPickerNonce || 0;
      if (window.__qcaSurahPickerHandledNonce !== nonce) {
        window.__qcaSurahPickerHandledNonce = nonce;
        requestAnimationFrame(() => {
          try {
            const active = document.querySelector('.surah-modal-row.on');
            if (active && active.scrollIntoView) {
              active.scrollIntoView({ block: 'center' });
            }
            const inp = document.querySelector('.surah-modal-search');
            if (inp && inp.focus) inp.focus();
          } catch (e) {}
        });
      }
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
  document.documentElement.style.fontSize = '100%';
  document.documentElement.setAttribute('lang', state.lang || readStoredLang());
  document.title = qbTranslate('titleDoc');

  // Global ESC handler for modals
  window.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (state && state.surahPickerOpen) {
      setState({ surahPickerOpen: false });
    }
  });

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

