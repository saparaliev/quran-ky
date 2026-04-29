function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'className') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'innerHTML') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v);
    });
  }
  children.flat(9).forEach(c => {
    if (c == null) return;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  });
  return el;
}

function qbT(key, vars) {
  return typeof window.qbTranslate === 'function' ? window.qbTranslate(key, vars) : key;
}

/** App language: menus, surah names, translations, WBW, and tafsir. */
function renderUiLangDropdown() {
  const s = state;
  const sel = h(
    'select',
    {
      className: 'ui-lang-select',
      title: qbT('langSelectAria'),
      'aria-label': qbT('langSelectAria'),
      onChange: e => window.qbSetUiLang(e.target.value)
    },
    h('option', { value: 'ky' }, 'Кыргызча'),
    h('option', { value: 'en' }, 'English'),
    h('option', { value: 'ru' }, 'Русский')
  );
  sel.value = s.lang;
  return h('div', { className: 'topbar-lang' }, sel);
}

function renderTopBarRight() {
  return h(
    'div',
    { className: 'topbar-right' },
    renderUiLangDropdown()
  );
}

function surahPickerTitle() {
  const lang = state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky' ? state.lang : 'ky';
  if (lang === 'ky') return 'Сүрөлөр';
  if (lang === 'ru') return 'Суры';
  return 'Surahs';
}

function renderSurahPickerOverlay() {
  const s = state;
  if (!s.surahPickerOpen) return null;

  const q = String(s.surahPickerQ || '').trim();
  const qf = q.toLocaleLowerCase();

  const list = (s.chapters || []).slice().sort((a, b) => a.number - b.number);
  const filtered = !q
    ? list
    : list.filter(ch => {
        const sn = ch.number;
        const nm = (SURAH_NAMES[s.lang]?.[sn - 1] || '').toLocaleLowerCase();
        const tr = (SURAH_TR[s.lang]?.[sn - 1] || '').toLocaleLowerCase();
        const en1 = String(ch.englishName || '').toLocaleLowerCase();
        const en2 = String(ch.englishNameTranslation || '').toLocaleLowerCase();
        const ar = String(ch.name || '');
        return (
          String(sn).includes(q) ||
          nm.includes(qf) ||
          tr.includes(qf) ||
          en1.includes(qf) ||
          en2.includes(qf) ||
          ar.includes(q)
        );
      });

  const rows =
    s.loading && (!s.chapters || !s.chapters.length)
      ? [h('div', { className: 'surah-modal-empty' }, qbT('loadingSurahs'))]
      : filtered.map(ch => {
          const isCur = s.cur && s.cur.number === ch.number;
          return h(
            'button',
            {
              type: 'button',
              className: `surah-modal-row ${isCur ? 'on' : ''}`,
              onClick: () => {
                setState({ surahPickerOpen: false });
                loadSurah(ch);
              }
            },
            h('div', { className: 'surah-modal-num' }, String(ch.number)),
            h(
              'div',
              { className: 'surah-modal-mid' },
              h('div', { className: 'surah-modal-name' }, SURAH_NAMES[s.lang]?.[ch.number - 1] || ch.englishName)
            ),
            h('div', { className: 'surah-modal-ar' }, ch.name)
          );
        });

  return h(
    'div',
    { className: 'surah-ovl', onClick: () => setState({ surahPickerOpen: false }) },
    h(
      'div',
      { className: 'surah-modal', onClick: e => e.stopPropagation() },
      h(
        'div',
        { className: 'surah-modal-hdr' },
        h('div', { className: 'surah-modal-title' }, surahPickerTitle()),
        h(
          'button',
          { type: 'button', className: 'surah-modal-x', onClick: () => setState({ surahPickerOpen: false }) },
          '✕'
        )
      ),
      h('input', {
        className: 'surah-modal-search',
        placeholder: qbT('searchPlaceholder'),
        value: s.surahPickerQ || '',
        onInput: e => setState({ surahPickerQ: e.target.value })
      }),
      h('div', { className: 'surah-modal-list' }, ...rows)
    )
  );
}

function getJuzStartPos(juzNum) {
  try {
    if (typeof JUZ_START === 'undefined' || !JUZ_START) return null;
    const p = JUZ_START[juzNum];
    if (!p) return null;
    const s = parseInt(p.s, 10);
    const v = parseInt(p.v, 10);
    if (!Number.isFinite(s) || !Number.isFinite(v)) return null;
    return { s, v };
  } catch (e) {
    return null;
  }
}


function openBookmarksHome() {
  stopAudio();
  stopTafsirSpeech();
  if (typeof pauseKyAuxAudio === 'function') pauseKyAuxAudio();
  setState({ view: 'home', menuOpen: false, uiBookmarksOpen: true });
}

function openFeedback() {
  console.log('[typeform] openFeedback click');
  closeMenu();
  setTimeout(() => {
    console.log('[typeform] openFeedback timeout fired', { hasTf: !!window.tf });
    if (window.tf) {
      console.log('[typeform] creating popup for id', 'u1xJgcyY');
      window.tf
        .createPopup('u1xJgcyY', {
          autoClose: 3000
        })
        .open();
    } else {
      console.error('Typeform script not loaded');
    }
  }, 300);
}

function closeMenu() {
  if (state.menuOpen) setState({ menuOpen: false });
}

function navigate(view) {
  stopAudio();
  stopTafsirSpeech();
  if (typeof pauseKyAuxAudio === 'function') pauseKyAuxAudio();
  setState({ view, menuOpen: false });
}

function renderMenuOverlay() {
  const s = state;
  if (!s.menuOpen) return null;
  return h(
    'div',
    { className: 'menu-ovl', onClick: () => closeMenu() },
    h(
      'div',
      { className: 'menu-drawer', onClick: e => e.stopPropagation() },
      h('div', { className: 'menu-title' }, qbT('menuTitle')),
      h(
        'button',
        { className: `menu-item ${s.view === 'home' ? 'on' : ''}`, onClick: () => navigate('home') },
        qbT('navHome')
      ),
      h(
        'button',
        {
          className: 'menu-item',
          onClick: () => openBookmarksHome()
        },
        qbT('navBookmarks')
      ),
      h(
        'button',
        {
          className: `menu-item ${s.view === 'feedback' ? 'on' : ''}`,
          onClick: () => {
            openFeedback();
          }
        },
        qbT('navFeedback')
      ),
      h(
        'button',
        { className: `menu-item ${s.view === 'contribute' ? 'on' : ''}`, onClick: () => navigate('contribute') },
        qbT('navContribute')
      ),
      h(
        'button',
        { className: `menu-item ${s.view === 'about' ? 'on' : ''}`, onClick: () => navigate('about') },
        qbT('navAbout')
      )
    )
  );
}

function renderTopLeftMenuButton() {
  return h(
    'button',
    {
      className: 'menu-btn',
      title: qbT('menuTooltip'),
      onClick: () => setState({ menuOpen: !state.menuOpen })
    },
    '☰'
  );
}

function surahFilterTabLabel(mode) {
  const lang = state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky' ? state.lang : 'ky';
  const L = {
    all: { ky: 'Баары', en: 'All', ru: 'Все' },
    meccan: { ky: 'Мекке', en: 'Meccan', ru: 'Меккинские' },
    medinan: { ky: 'Мадина', en: 'Medinan', ru: 'Мединские' },
    juz: { ky: 'Жуз боюнча', en: 'By Juz', ru: 'По Джузу' }
  };
  return L[mode][lang] || L[mode].en;
}

function juzGroupHeaderText(juzNum) {
  const lang = state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky' ? state.lang : 'ky';
  if (lang === 'ky') return `Жуз ${juzNum}`;
  if (lang === 'ru') return `Джуз ${juzNum}`;
  return `Juz ${juzNum}`;
}

function applySurahRevFilter(chapters, mode) {
  if (mode === 'meccan') {
    return chapters.filter(c => String(c.revelationType || '').toLowerCase() === 'meccan');
  }
  if (mode === 'medinan') {
    return chapters.filter(c => String(c.revelationType || '').toLowerCase() === 'medinan');
  }
  return chapters;
}

function getSurahJuzNum(sn) {
  if (typeof JUZ === 'undefined' || JUZ[sn] == null) return 1;
  return JUZ[sn];
}

const SURAH_JUZ_SPANS = {
  2: [1, 2, 3],
  3: [3, 4],
  4: [4, 5, 6],
  5: [6],
  6: [6, 7, 8],
  7: [8, 9],
  9: [10, 11],
  10: [11],
  11: [11, 12],
  12: [12, 13],
  13: [13],
  16: [14],
  17: [15],
  18: [15, 16],
  20: [16],
  21: [17],
  23: [18],
  26: [19]
};

function getSurahJuzSpan(sn) {
  if (SURAH_JUZ_SPANS[sn]) return SURAH_JUZ_SPANS[sn];
  return [getSurahJuzNum(sn)];
}

function buildJuzGroupedRows(chapters) {
  const rows = [];
  const byJuz = new Map();
  for (const ch of chapters) {
    const span = getSurahJuzSpan(ch.number);
    for (const jn of span) {
      if (!byJuz.has(jn)) byJuz.set(jn, []);
      byJuz.get(jn).push(ch);
    }
  }
  for (let j = 1; j <= 30; j++) {
    const arr = byJuz.get(j);
    if (!arr || !arr.length) continue;
    rows.push({ kind: 'hdr', juz: j });
    for (const ch of arr) rows.push({ kind: 'ch', ch });
  }
  return rows;
}

/** Localized Meccan/Medinan for surah list meta (ky/en/ru). */
function revelationTypeLabel(ch) {
  const lang = state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky' ? state.lang : 'ky';
  const t = String(ch.revelationType || '').toLowerCase();
  const meccan = { ky: 'Мекке', en: 'Meccan', ru: 'Меккинская' };
  const medinan = { ky: 'Мадина', en: 'Medinan', ru: 'Мединская' };
  if (t === 'medinan') return medinan[lang] || medinan.en;
  return meccan[lang] || meccan.en;
}

function revelationTypeKey(ch) {
  const t = String(ch.revelationType || '').toLowerCase();
  return t === 'medinan' ? 'medinan' : 'meccan';
}

function juzSpanLabelList(sn) {
  const lang = state.lang === 'en' || state.lang === 'ru' || state.lang === 'ky' ? state.lang : 'ky';
  const base = lang === 'ky' ? 'Жуз' : lang === 'ru' ? 'Джуз' : 'Juz';
  return getSurahJuzSpan(sn).map(j => `${base} ${j}`);
}

function renderChapterRow(ch, opts) {
  const s = state;
  const mode = opts && opts.mode ? opts.mode : 'all';
  const revKey = revelationTypeKey(ch);
  const revLabel = revelationTypeLabel(ch);
  const rightMeta =
    mode === 'juz'
      ? juzSpanLabelList(ch.number).join(' · ')
      : h(
          'span',
          { className: 'rev-badge' },
          h('span', { className: `rev-dot rev-dot--${revKey}` }),
          revLabel
        );
  return h(
    'button',
    { className: 'ch-btn', onClick: () => loadSurah(ch) },
    h('div', { className: 'ch-num' }, String(ch.number)),
    h(
      'div',
      { style: { flex: '1', minWidth: '0' } },
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h(
          'span',
          { className: 'ch-name' },
          SURAH_NAMES[s.lang]?.[ch.number - 1] || ch.englishName
        ),
        h('span', { className: 'ch-ar' }, ch.name)
      ),
      h(
        'div',
        { style: { display: 'flex', justifyContent: 'space-between' }, className: 'ch-meta' },
        h('span', {}, SURAH_TR[s.lang]?.[ch.number - 1] || ch.englishNameTranslation),
        h('span', {}, `${ch.numberOfAyahs} ${qbT('metaAyahs')} • `, rightMeta)
      )
    )
  );
}

function renderSurahFilterTabs() {
  const cur = state.surahListFilter || 'all';
  const modes = ['all', 'meccan', 'medinan', 'juz'];
  return h(
    'div',
    { className: 'surah-filter-tabs' },
    ...modes.map(mode =>
      h(
        'button',
        {
          type: 'button',
          className: `surah-filter-pill ${cur === mode ? 'surah-filter-pill--active' : ''}`,
          onClick: () => {
            localStorage.setItem('qb_filter', mode);
            setState({ surahListFilter: mode });
          }
        },
        surahFilterTabLabel(mode)
      )
    )
  );
}

function renderHome() {
  const s = state;
  const q = (s.q || '').toLowerCase();
  const qFiltered = s.chapters.filter(c => {
    if (!q) return true;
    const nm = (SURAH_NAMES[s.lang]?.[c.number - 1] || '').toLowerCase();
    const tr = (SURAH_TR[s.lang]?.[c.number - 1] || '').toLowerCase();
    return (
      (c.englishName || '').toLowerCase().includes(q) ||
      (c.englishNameTranslation || '').toLowerCase().includes(q) ||
      (c.name || '').includes(s.q) ||
      String(c.number).includes(q) ||
      nm.includes(q) ||
      tr.includes(q)
    );
  });

  const bmPanel = s.uiBookmarksOpen
    ? h(
        'div',
        { className: 'ctr', style: { padding: '0 16px 12px' } },
        (s.bmarks || []).length
          ? h(
              'div',
              { className: 'bm-strip' },
              ...(s.bmarks || []).map(vk => {
                const parts = String(vk).split(':');
                const sn = parseInt(parts[0], 10);
                const an = parseInt(parts[1], 10);
                return h(
                  'button',
                  {
                    type: 'button',
                    className: 'bm-chip',
                    onClick: () => openSurahAt(sn, an)
                  },
                  vk
                );
              })
            )
          : h('div', { style: { color: '#94a3b8', fontSize: '13px' } }, qbT('bookmarksEmpty'))
      )
    : null;

  return h(
    'div',
    {},
    h(
      'div',
      { className: 'hdr' },
      h(
        'div',
        { className: 'ctr' },
        h(
          'div',
          { className: 'topbar' },
          renderTopLeftMenuButton(),
          h('div', { className: 'topbar-fill' }),
          renderTopBarRight()
        ),
        h('div', { className: 'title' }, 'Quran Bulak'),
        h('div', { className: 'sub' }, qbT('tagline')),
        h(
          'div',
          { className: 'home-tools' },
          h(
            'div',
            { className: 'search-wrap' },
            h('svg', {
              innerHTML:
                '<path stroke="currentColor" stroke-width="2" fill="none" d="M21 21l-5-5m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>',
              style: { position: 'absolute', left: '12px', top: '11px', width: '16px', height: '16px' },
              viewBox: '0 0 24 24'
            }),
            h('input', {
              className: 'search',
              placeholder: qbT('searchPlaceholder'),
              value: s.q,
              onInput: e => {
                const val = e.target.value;
                // Update query immediately; also show instant chapter-name matches for 3+ chars
                // so UI doesn't appear empty while debounced search runs.
                const trimmed = String(val || '').trim();
                const isNum = /^\d{1,3}$/.test(trimmed) ? parseInt(trimmed, 10) : null;
                const doFull = trimmed.length >= 3 || (isNum && isNum >= 1 && isNum <= 114);
                if (doFull) {
                  const chapterGroups = buildChapterGroups(trimmed);
                  setState({ q: val, searchResults: chapterGroups, searchCount: 0 });
                } else {
                  setState({ q: val, searchResults: null, searchCount: 0 });
                }
                scheduleFullSearch(val);
              }
            })
          )
        )
      )
    ),
    bmPanel,
    h(
      'div',
      { className: 'ctr', style: { padding: '16px' } },
      s.loading
        ? h('div', { className: 'loading' }, h('span', { className: 'spin' }), qbT('loadingSurahs'))
        : (() => {
            const rawQ = (s.q || '').trim();
            const isNum = /^\d{1,3}$/.test(rawQ) ? parseInt(rawQ, 10) : null;
            const doFull = rawQ.length >= 3 || (isNum && isNum >= 1 && isNum <= 114);
            if (!doFull) {
              const mode = s.surahListFilter || 'all';
              const filterEl = renderSurahFilterTabs();
              if (mode === 'juz') {
                const rows = buildJuzGroupedRows(qFiltered);
                return h(
                  'div',
                  { className: 'surah-list-sidebar' },
                  filterEl,
                  ...rows.map(r =>
                    r.kind === 'hdr'
                      ? h(
                          'button',
                          {
                            type: 'button',
                            className: 'juz-group-hdr juz-group-hdr-btn',
                            onClick: async () => {
                              const p = getJuzStartPos(r.juz);
                              if (!p) return;
                              await openSurahAt(p.s, p.v);
                            }
                          },
                          juzGroupHeaderText(r.juz)
                        )
                      : renderChapterRow(r.ch, { mode: 'juz' })
                  )
                );
              }
              const list = applySurahRevFilter(qFiltered, mode);
              return h(
                'div',
                { className: 'surah-list-sidebar' },
                filterEl,
                ...list.map(ch => renderChapterRow(ch, { mode }))
              );
            }

            const groups = s.searchResults || [];
            const hasAnyResults = groups.length > 0;
            const UI = {
              labelSearching: qbT('searchLabelSearching'),
              btnAll: qbT('searchBtnAll'),
              loading: qbT('searchLoading'),
              none: qbT('searchNone'),
              found: n => qbT('searchFound', { n })
            };
            const topRow = h(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '10px',
                  marginBottom: '10px'
                }
              },
              h(
                'div',
                { style: { fontSize: '12px', color: '#94a3b8' } },
                s.searchAllLoaded ? UI.found(s.searchCount) : UI.labelSearching
              ),
              h(
                'button',
                {
                  className: 'pill pill-off',
                  style: { padding: '6px 10px' },
                  disabled: s.searchAllLoading,
                  onClick: () => searchAllSurahsNow()
                },
                s.searchAllLoading ? UI.loading : UI.btnAll
              )
            );

            const loadingEl = s.searchAllLoading
              ? h('div', { className: 'loading' }, h('span', { className: 'spin' }), UI.loading)
              : null;

            const emptyEl = !s.searchAllLoading && !hasAnyResults
              ? h('div', { style: { color: '#94a3b8', fontSize: '13px', padding: '10px 0' } }, UI.none)
              : null;

            const resultsEl = h(
              'div',
              { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
              ...groups
                .map(g => {
                  const head = h(
                    'div',
                    { style: { fontSize: '13px', color: '#e2e8f0', fontWeight: '600' } },
                    `${g.surah}. ${g.label}`
                  );

                  // If this group is only a chapter-name/number match, allow navigation
                  if (!(g.hits || []).length) {
                    return h(
                      'button',
                      {
                        className: 'ch-btn',
                        onClick: () => {
                          const ch = s.chapters.find(c => c.number === g.surah);
                          if (ch) loadSurah(ch);
                        }
                      },
                      h('div', { className: 'ch-num' }, String(g.surah)),
                      h('div', { style: { flex: '1', minWidth: '0' } }, head)
                    );
                  }

                  const ar = searchCacheAr.get(g.surah) || null;
                  const hitBtns = (g.hits || []).slice(0, 50).map(hit => {
                    const arTxt = ar ? (ar[hit.ayah - 1] || '') : '';
                    return h(
                      'button',
                      {
                        className: 'ch-btn',
                        onClick: () => openSurahAt(g.surah, hit.ayah),
                        style: { textAlign: 'left' }
                      },
                      h('div', { className: 'ch-num' }, `${hit.ayah}`),
                      h(
                        'div',
                        { style: { flex: '1', minWidth: '0' } },
                        h(
                          'div',
                          { style: { fontSize: '12px', color: '#94a3b8', marginBottom: '4px' } },
                          `${g.surah}:${hit.ayah}`
                        ),
                        h(
                          'div',
                          { style: { fontSize: '18px', direction: 'rtl', textAlign: 'right', color: '#e2e8f0', fontFamily: 'serif', marginBottom: '6px' } },
                          arTxt || '...'
                        ),
                        h('div', {
                          style: { fontSize: '13px', color: '#c4b5fd', lineHeight: '1.6' },
                          innerHTML: highlightHtml(hit.ky, rawQ)
                        })
                      )
                    );
                  });

                  return h('div', {}, head, h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' } }, ...hitBtns));
                })
            );

            return h('div', {}, topRow, loadingEl, emptyEl, resultsEl);
          })()
    )
  , renderMenuOverlay());
}

function renderPageShell(title, bodyEl) {
  return h(
    'div',
    {},
    h(
      'div',
      { className: 'hdr' },
      h(
        'div',
        { className: 'ctr' },
        h(
          'div',
          { className: 'topbar' },
          renderTopLeftMenuButton(),
          h('div', { className: 'page-title' }, title),
          renderTopBarRight()
        ),
      )
    ),
    h('div', { className: 'ctr', style: { padding: '16px' } }, bodyEl),
    renderMenuOverlay()
  );
}

function renderFeedback() {
  // Feedback is handled via Typeform popup from the menu.
  return renderPageShell(
    qbT('pageFeedback'),
    h('div', { className: 'page-card' }, qbT('feedbackIntro'))
  );
}

function renderContribute() {
  return renderPageShell(
    qbT('pageContribute'),
    h(
      'div',
      { className: 'page-card' },
      h('div', { className: 'page-h' }, qbT('contributeTitle')),
      h(
        'div',
        { className: 'page-p' },
        qbT('contributeBody')
      )
    )
  );
}

function renderAbout() {
  return renderPageShell(
    qbT('pageAbout'),
    h(
      'div',
      { className: 'page-card' },
      h('div', { className: 'page-h' }, qbT('aboutTitle')),
      h(
        'div',
        { className: 'page-p' },
        qbT('aboutBody1')
      ),
      h(
        'div',
        { className: 'page-p', style: { marginTop: '10px' } },
        qbT('aboutBody2')
      ),
      h(
        'div',
        { className: 'page-p', style: { marginTop: '10px', color: '#94a3b8' } },
        qbT('aboutBody3')
      )
    )
  );
}

function renderSurah() {
  const s = state;
  const ch = s.cur;
  if (!ch) return h('div');
  const curAN = s.playing ? parseInt(s.playing.split(':')[1], 10) : null;
  const lang = s.lang === 'en' || s.lang === 'ru' || s.lang === 'ky' ? s.lang : 'ky';

  const juzStartKeyToNum = (() => {
    const m = new Map();
    try {
      if (typeof JUZ_START !== 'undefined' && JUZ_START) {
        for (const [juzStr, pos] of Object.entries(JUZ_START)) {
          const jn = parseInt(juzStr, 10);
          const sn = pos && typeof pos === 'object' ? parseInt(pos.s, 10) : NaN;
          const vn = pos && typeof pos === 'object' ? parseInt(pos.v, 10) : NaN;
          if (Number.isFinite(jn) && Number.isFinite(sn) && Number.isFinite(vn)) {
            m.set(`${sn}:${vn}`, jn);
          }
        }
      }
    } catch (e) {}
    return m;
  })();

  function juzMarkerLabel(n) {
    if (lang === 'ky') return `۞ Жуз ${n} башталат`;
    if (lang === 'ru') return `۞ Джуз ${n} начинается`;
    return `۞ Juz ${n} begins`;
  }

  const hdr = h(
    'div',
    { className: 's-hdr' },
    h(
      'div',
      { className: 's-bar ctr' },
      renderTopLeftMenuButton(),
      h(
        'button',
        {
          className: 'back-btn',
          onClick: () => {
            stopAudio();
            stopTafsirSpeech();
            setState({ view: 'home' });
          }
        },
        '←'
      ),
      h(
        'div',
        { style: { flex: '1' } },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          h(
            'button',
            {
              type: 'button',
              className: 's-title-btn',
              onClick: () =>
                setState(s0 => ({
                  surahPickerOpen: true,
                  surahPickerQ: '',
                  surahPickerNonce: (s0.surahPickerNonce || 0) + 1
                }))
            },
            h('span', { className: 's-title' }, SURAH_NAMES[s.lang]?.[ch.number - 1] || ch.englishName),
            h('span', { className: 's-chev', 'aria-hidden': 'true' }, '▾')
          ),
          h('span', { className: 's-ar' }, ch.name)
        ),
        h(
          'div',
          { className: 's-meta' },
          `${SURAH_TR[s.lang]?.[ch.number - 1] || ch.englishNameTranslation} • ${ch.numberOfAyahs} ${qbT(
            'metaAyahs'
          )}`
        )
      ),
      h(
        'button',
        {
          className: `pill ${s.wbw ? 'pill-on' : 'pill-off'}`,
          title: qbT('ttWbw'),
          onClick: () => setState({ wbw: !s.wbw })
        },
        qbT('btnWbw')
      ),
      h(
        'button',
        {
          className: `pill ${s.showTranslit ? 'pill-on' : 'pill-off'}`,
          title: qbT('ttTranslit'),
          onClick: () => {
            const next = !s.showTranslit;
            localStorage.setItem('qca_show_translit', next ? '1' : '0');
            setState({ showTranslit: next });
          }
        },
        qbT('btnPhonetic')
      ),
      h(
        'button',
        {
          className: `pill ${s.continuous ? 'pill-on' : 'pill-off'}`,
          onClick: () => setState({ continuous: !s.continuous }),
          title: qbT('ttContinuous')
        },
        s.continuous ? qbT('autoPlay') : '⏩'
      ),
      renderTopBarRight()
    )
  );

  const bism =
    ch.number !== 9 && ch.number !== 1
      ? h(
          'div',
          {
            style: {
              textAlign: 'center',
              padding: '20px 0',
              fontSize: '24px',
              color: '#6ee7b7',
              fontFamily: 'serif'
            }
          },
          'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'
        )
      : null;

  const versesEl = s.vLoading
    ? h('div', { className: 'loading' }, h('span', { className: 'spin' }), qbT('loading'))
    : h(
        'div',
        {},
        ...s.verses.map((v, i) => {
          const an = v.verse_number;
          const jn = juzStartKeyToNum.get(`${ch.number}:${an}`) || null;
          const vk = `${ch.number}:${an}`;
          const isP = s.playing === vk;
          const isBM = s.bmarks.includes(vk);
          const showT = s.tafOpen === vk;

          const ctrl = h(
            'div',
            { className: 'v-ctrl' },
            h('span', { className: 'v-num' }, String(an)),
            h(
              'div',
              { style: { display: 'flex', gap: '2px' } },
              h(
                'button',
                {
                  className: `v-btn ${isP ? 'on' : ''}`,
                  onClick: () => (isP ? stopAudio() : playAyah(ch.number, an))
                },
                isP ? '⏸' : '▶'
              ),
              h(
                'button',
                {
                  className: `v-btn ${isBM ? 'bm' : ''}`,
                  onClick: () => {
                    const nb = isBM ? s.bmarks.filter(x => x !== vk) : [...s.bmarks, vk];
                    localStorage.setItem('qca_bm', JSON.stringify(nb));
                    setState({ bmarks: nb });
                  }
                },
                isBM ? '★' : '☆'
              ),
              h(
                'button',
                {
                  className: `v-btn v-btn-taf ${showT ? 'on' : ''}`,
                  onClick: () => {
                    if (showT) setState({ tafOpen: null });
                    else {
                      setState({ tafOpen: vk });
                      loadTaf(ch.number, an);
                    }
                  }
                },
                qbT('tafsir')
              )
            )
          );

          let arabicEl;
          const wbwIsEnglish =
            s.lang !== 'en' && v.words?.[0]?.translation?.language_name === 'english';
          const showWbwFallbackNote = wbwIsEnglish && s.lang !== 'ky';

          if (s.wbw && v.words && v.words.length > 0) {
            const wbwNote = showWbwFallbackNote
              ? h(
                  'div',
                  {
                    style: {
                      fontSize: '10px',
                      color: '#475569',
                      textAlign: 'right',
                      marginBottom: '4px',
                      fontStyle: 'italic'
                    }
                  },
                  qbT('wbwNote', { lang: LANGS.find(l => l.code === s.lang)?.name || s.lang })
                )
              : null;
            arabicEl = h(
              'div',
              {},
              wbwNote,
              h(
                'div',
                { className: 'wbw-row' },
                (() => {
                  let wordIdx = -1;
                  const surahKey = String(ch.number);
                  const ayahKey = String(an);
                  const kyMeanings = s.wbwKyData && s.lang === 'ky' ? s.wbwKyData[surahKey]?.[ayahKey] : null;
                  return v.words.map((w, wi) => {
                    const isW = w.char_type_name === 'word';
                    if (isW) wordIdx += 1;
                    const isHL = isP && isW && wordIdx === s.hlWord;
                    const meaning = (isW && s.lang === 'ky' && kyMeanings && kyMeanings[wordIdx] != null)
                      ? kyMeanings[wordIdx]
                      : (w.translation?.text || '');
                    return h(
                    'button',
                    {
                      className: `wbw-word ${isHL ? 'hl' : ''}`,
                      onClick: () => {
                        if (isW) {
                          playWordAudio(w.audio_url);
                          setState({
                            selWord: {
                              ar: w.text_uthmani || w.text,
                              tr: w.transliteration?.text,
                              en: meaning,
                              surah: ch.number,
                              ayah: an,
                              idx: wi + 1
                            }
                          });
                        }
                      }
                    },
                    h('div', { className: 'w-ar' }, w.text_uthmani || w.text),
                    isW ? h('div', { className: 'w-tr' }, w.transliteration?.text || '') : null,
                    isW ? h('div', { className: 'w-en' }, meaning) : null
                  );
                  });
                })()
              )
            );
          } else {
            arabicEl = h('p', { className: 'arabic-line' }, v.text_uthmani || '');
          }

          let translitEl = null;
          if (s.showTranslit) {
            // English: show Latin transliteration (HTML formatted)
            if (s.lang === 'en' && s.translitEn) {
              const key = `${ch.number}:${an}`;
              const html = s.translitEn[key];
              if (html) {
                translitEl = h('p', {
                  className: 'translit-line',
                  innerHTML: html
                });
              }
            } else {
              // Russian / Kyrgyz: show Cyrillic transliteration from kazakh_translit.json (dataset label KZ)
              try {
                const td = window.translitData;
                const t = td && td[String(ch.number)] && td[String(ch.number)][String(an)];
                const txt = t && t.translit ? String(t.translit).trim() : '';
                if (txt) {
                  translitEl = h(
                    'p',
                    { className: 'kz-translit-line' },
                    h('span', { className: 'kz-translit-text' }, txt)
                  );
                }
              } catch (e) {}
            }
          }

          const transPlain =
            s.transText[i] ||
            (v.translations?.[0]?.text || '')
              .replace(/<[^>]*>/g, '')
              .replace(/\s+/g, ' ')
              .trim();
          const transP = h(
            'p',
            {
              className: 'trans',
              style: s.lang !== 'en' ? { fontSize: '14px', color: '#c4b5fd', fontWeight: '500' } : {}
            },
            transPlain
          );
          const kyTransUrl = `audio/ky/${ch.number}/${an}.mp3`;
          const transEl =
            s.lang === 'ky'
              ? h(
                  'div',
                  { className: 'trans-row' },
                  transP,
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'ky-static-audio-btn',
                      style: { display: 'none' },
                      title: qbT('ttPlayKyTrans'),
                      'data-ky-static-audio': kyTransUrl,
                      onClick: e => {
                        e.preventDefault();
                        playKyStaticAudio('trans', kyTransUrl);
                      }
                    },
                    '🔊'
                  )
                )
              : transP;

          let tafEl = null;
          if (showT) {
          const tafList = getTafsirSourcesForLang(s.lang);
          const activeTaf = tafList.find(t => t.id === s.tafSrc)?.id || tafList[0]?.id;
          if (activeTaf && activeTaf !== s.tafSrc) {
            state.tafSrc = activeTaf;
            loadTaf(ch.number, an);
          }
          const tKey2 = `${activeTaf}:${ch.number}:${an}`;
          const isKyMokhtasar = s.lang === 'ky' && activeTaf === 'kyrgyz-mokhtasar';
          const kyTafUrl = `audio/tafsir/${ch.number}/${an}.mp3`;

          const tSel = h(
            'select',
            {
              className: 'taf-sel',
              onChange: e => {
                setState({ tafSrc: e.target.value });
                loadTaf(ch.number, an);
              }
            },
            ...tafList.map(t => h('option', { value: t.id }, t.name))
          );
          if (activeTaf) tSel.value = activeTaf;

          // Tafsir audio buttons removed (keep text panel + toggle only).

          tafEl = h(
            'div',
            { className: 'taf-box' },
            h(
              'div',
              { className: 'taf-hdr' },
              h('span', { className: 'taf-label' }, qbT('tafsir')),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                tSel
              )
            ),
            h('div', {
              className: 'taf-content',
              innerHTML: s.tafData[tKey2] || qbT('loadingTafsir')
            })
          );
          }

          const verseNode = h('div', { className: 'verse', id: `vc${an}` }, ctrl, arabicEl, translitEl, transEl, tafEl);
          if (!jn) return verseNode;
          const marker = h(
            'div',
            { className: 'juz-marker', id: `juzm-${ch.number}-${an}` },
            h('div', { className: 'juz-line' }),
            h('span', {}, juzMarkerLabel(jn)),
            h('div', { className: 'juz-line' })
          );
          return h('div', {}, marker, verseNode);
        })
      );

  let wpEl = null;
  if (s.selWord) {
    const w = s.selWord;
    wpEl = h(
      'div',
      { className: `wpanel ${s.playing ? 'up' : ''}` },
      h(
        'div',
        { className: 'wpanel-inner' },
        h(
          'div',
          {
            style: {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '10px'
            }
          },
          h(
            'div',
            {},
            h('div', { className: 'wp-ar' }, w.ar),
            h('div', { className: 'wp-tr' }, w.tr || '')
          ),
          h(
            'button',
            {
              className: 'wp-close',
              onClick: () => setState({ selWord: null })
            },
            '✕'
          )
        ),
        h(
          'div',
          { className: 'wp-grid' },
          h(
            'div',
            { className: 'wp-card' },
            h('div', { className: 'wp-lbl' }, qbT('wMean')),
            h('div', { className: 'wp-val' }, w.en || '—')
          ),
          h(
            'div',
            { className: 'wp-card' },
            h('div', { className: 'wp-lbl' }, qbT('wPos')),
            h('div', { className: 'wp-val' }, qbT('wpPosFmt', { word: w.idx, ayah: w.ayah }))
          )
        )
      )
    );
  }

  let abEl = null;
  if (s.playing) {
    abEl = h(
      'div',
      { className: 'abar' },
      h(
        'div',
        { className: 'abar-inner' },
        h(
          'div',
          { className: 'abar-info' },
          h('b', {}, '▶ '),
          `${SURAH_NAMES[state.lang]?.[ch.number - 1] || ch.englishName} : ${curAN}`,
          s.continuous
            ? h(
                'span',
                {
                  style: {
                    marginLeft: '6px',
                    fontSize: '10px',
                    background: 'rgba(16,185,129,0.2)',
                    color: '#6ee7b7',
                    padding: '1px 6px',
                    borderRadius: '8px'
                  }
                },
                qbT('autoPlay')
              )
            : null
        ),
        h(
          'div',
          { className: 'abar-btns' },
          h(
            'button',
            {
              className: 'abar-btn',
              onClick: () => {
                if (curAN > 1) playAyah(ch.number, curAN - 1);
              }
            },
            '⏮'
          ),
          h(
            'button',
            {
              className: 'abar-pause',
              onClick: () => stopAudio(),
              onTouchstart: e => {
                // Ensure tap works on mobile even if click is delayed
                e.preventDefault();
                stopAudio();
              }
            },
            '⏸'
          ),
          h(
            'button',
            {
              className: 'abar-btn',
              onClick: () => {
                if (curAN < ch.numberOfAyahs) playAyah(ch.number, curAN + 1);
              }
            },
            '⏭'
          )
        )
      )
    );
  }

  const cont = h(
    'div',
    { className: 'ctr', style: { padding: '0 16px', paddingBottom: s.playing ? '80px' : '20px' } },
    versesEl
  );

  return h('div', {}, hdr, bism, cont, wpEl, abEl, renderMenuOverlay(), renderSurahPickerOverlay());
}

