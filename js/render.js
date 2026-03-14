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

function renderHome() {
  const s = state;
  const q = s.q.toLowerCase();
  const filtered = s.chapters.filter(c => {
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

  return h(
    'div',
    {},
    h(
      'div',
      { className: 'hdr' },
      h(
        'div',
        { className: 'ctr' },
        h('div', { className: 'bismillah' }, 'بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ'),
        h('div', { className: 'title' }, 'Quran Central Asia'),
        h('div', { className: 'sub' }, "Кыргызча • English • Русский"),
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'center', marginTop: '10px' } },
          (() => {
            const sel = h(
              'select',
              {
                className: 'home-lang-select',
                onChange: e => {
                  const lang = e.target.value;
                  const sources = getTafsirSourcesForLang(lang);
                  const nextTaf = sources[0]?.id || null;
                  setState({ lang, tafSrc: nextTaf });
                }
              },
              ...LANGS.map(l => h('option', { value: l.code }, `${l.flag} ${l.name}`))
            );
            sel.value = s.lang;
            return sel;
          })()
        ),
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
            placeholder: 'Search surahs...',
            value: s.q,
            onInput: e => setState({ q: e.target.value })
          })
        )
      )
    ),
    h(
      'div',
      { className: 'ctr', style: { padding: '16px' } },
      s.loading
        ? h('div', { className: 'loading' }, h('span', { className: 'spin' }), 'Loading surahs...')
        : filtered.map(ch =>
            h(
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
                  h(
                    'span',
                    {},
                    SURAH_TR[s.lang]?.[ch.number - 1] || ch.englishNameTranslation
                  ),
                  h('span', {}, `${ch.numberOfAyahs} ayahs • ${String(ch.revelationType || '').toLowerCase()}`)
                )
              )
            )
          )
    )
  );
}

function renderSurah() {
  const s = state;
  const ch = s.cur;
  if (!ch) return h('div');
  const curAN = s.playing ? parseInt(s.playing.split(':')[1], 10) : null;

  const hdr = h(
    'div',
    { className: 's-hdr' },
    h(
      'div',
      { className: 's-bar ctr' },
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
            'span',
            { className: 's-title' },
            SURAH_NAMES[s.lang]?.[ch.number - 1] || ch.englishName
          ),
          h('span', { className: 's-ar' }, ch.name)
        ),
        h(
          'div',
          { className: 's-meta' },
          `${SURAH_TR[s.lang]?.[ch.number - 1] || ch.englishNameTranslation} • ${ch.numberOfAyahs} ayahs`
        )
      ),
      h(
        'button',
        {
          className: `pill ${s.wbw ? 'pill-on' : 'pill-off'}`,
          title: 'Toggle word-by-word view',
          onClick: () => setState({ wbw: !s.wbw })
        },
        'WBW'
      ),
      h(
        'button',
        {
          className: `pill ${s.continuous ? 'pill-on' : 'pill-off'}`,
          onClick: () => setState({ continuous: !s.continuous }),
          title: 'Continuous play'
        },
        s.continuous ? '⏩ Auto' : '⏩'
      ),
      h(
        'div',
        { style: { position: 'relative' } },
        h(
          'button',
          {
            style: {
              background: 'none',
              border: 'none',
              color: '#e2e8f0',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '18px'
            },
            onClick: () => setState({ showLang: !s.showLang })
          },
          '🌐'
        ),
        s.showLang
          ? h(
              'div',
              { className: 'lang-dd' },
              ...LANGS.map(l =>
                h(
                  'button',
                  {
                    className: `lang-btn ${s.lang === l.code ? 'on' : ''}`,
                    onClick: () => {
                      const sources = getTafsirSourcesForLang(l.code);
                      const nextTaf = sources[0]?.id || null;
                      setState({
                        lang: l.code,
                        showLang: false,
                        vLoading: true,
                        tafSrc: nextTaf,
                        tafOpen: null,
                        tafData: {}
                      });
                      loadTrans(ch.number, l.code);
                      fetchWBW(ch.number, l.code);
                    }
                  },
                  h('span', {}, `${l.flag}`),
                  h('span', { className: 'lang-label' }, l.name)
                )
              )
            )
          : null
      )
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
    ? h('div', { className: 'loading' }, h('span', { className: 'spin' }), 'Loading...')
    : h(
        'div',
        {},
        ...s.verses.map((v, i) => {
          const an = v.verse_number;
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
                  className: `v-btn ${showT ? 'on' : ''}`,
                  onClick: () => {
                    if (showT) setState({ tafOpen: null });
                    else {
                      setState({ tafOpen: vk });
                      loadTaf(ch.number, an);
                    }
                  }
                },
                '📖'
              )
            )
          );

          let arabicEl;
          const wbwIsEnglish =
            s.lang !== 'en' && v.words?.[0]?.translation?.language_name === 'english';

          if (s.wbw && v.words && v.words.length > 0) {
            const wbwNote = wbwIsEnglish
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
                  '⟡ Word meanings shown in English (WBW not available in ' +
                    (LANGS.find(l => l.code === s.lang)?.name || s.lang) +
                    ')'
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
                  return v.words.map((w, wi) => {
                    const isW = w.char_type_name === 'word';
                    if (isW) wordIdx += 1;
                    const isHL = isP && isW && wordIdx === s.hlWord;
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
                              en: w.translation?.text,
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
                    isW ? h('div', { className: 'w-en' }, w.translation?.text || '') : null
                  );
                  });
                })()
              )
            );
          } else {
            arabicEl = h('p', { className: 'arabic-line' }, v.text_uthmani || '');
          }

          const transEl = h(
            'p',
            {
              className: 'trans',
              style: s.lang !== 'en' ? { fontSize: '14px', color: '#c4b5fd', fontWeight: '500' } : {}
            },
            s.transText[i] ||
              (v.translations?.[0]?.text || '')
                .replace(/<[^>]*>/g, '')
                .replace(/\s+/g, ' ')
                .trim()
          );

          let tafEl = null;
          if (showT) {
          const tafList = getTafsirSourcesForLang(s.lang);
          const activeTaf = tafList.find(t => t.id === s.tafSrc)?.id || tafList[0]?.id;
          if (activeTaf && activeTaf !== s.tafSrc) {
            state.tafSrc = activeTaf;
            loadTaf(ch.number, an);
          }
          const tKey2 = `${activeTaf}:${ch.number}:${an}`;
          const isSpeaking = s.speaking && s.speakingTafsirKey === tKey2;

          tafEl = h(
            'div',
            { className: 'taf-box' },
            h(
              'div',
              { className: 'taf-hdr' },
              h('span', { className: 'taf-label' }, '📖 Tafsir'),
              h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                (() => {
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
                  return tSel;
                })(),
                (() => {
                  const rateSel = h(
                    'select',
                    {
                      className: 'taf-rate',
                      title: 'Tafsir speech speed',
                      onChange: e => {
                        const val = parseFloat(e.target.value);
                        setState({ speechRate: isNaN(val) ? 1.0 : val });
                      }
                    },
                    h('option', { value: '0.8' }, '0.8x'),
                    h('option', { value: '1.0' }, '1.0x'),
                    h('option', { value: '1.2' }, '1.2x')
                  );
                  rateSel.value = String(s.speechRate || 1.0);
                  return rateSel;
                })(),
                h(
                  'button',
                  {
                    className: 'v-btn',
                    title: isSpeaking ? 'Stop tafsir audio' : 'Play tafsir audio',
                    onClick: () => {
                      const html = s.tafData[tKey2];
                      if (!html) return;
                      if (isSpeaking) {
                        stopTafsirSpeech();
                        render();
                      } else {
                        playTafsirSpeech(ch.number, an, activeTaf, html);
                      }
                    }
                  },
                  isSpeaking ? '⏹' : '🔊'
                )
              )
            ),
            h('div', {
              className: 'taf-content',
              innerHTML: s.tafData[tKey2] || 'Loading tafsir...'
            })
          );
          }

          return h('div', { className: 'verse' }, ctrl, arabicEl, transEl, tafEl);
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
            h('div', { className: 'wp-lbl' }, 'Meaning'),
            h('div', { className: 'wp-val' }, w.en || '—')
          ),
          h(
            'div',
            { className: 'wp-card' },
            h('div', { className: 'wp-lbl' }, 'Position'),
            h('div', { className: 'wp-val' }, `Word ${w.idx} • Ayah ${w.ayah}`)
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
                'Auto ⏩'
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
              onClick: () => stopAudio()
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

  return h('div', {}, hdr, bism, cont, wpEl, abEl);
}

