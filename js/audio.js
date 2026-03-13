const AUDIO_BASE = 'https://everyayah.com/data/Alafasy_128kbps';

const pad3 = n => String(n).padStart(3, '0');

let audio = null;
let hlTimer = null;

function playAyah(sn, an) {
  stopAudio();
  const url = `${AUDIO_BASE}/${pad3(sn)}${pad3(an)}.mp3`;
  audio = new Audio(url);
  setState({ playing: `${sn}:${an}`, hlWord: 0 });

  const v = state.verses.find(x => x.verse_number === an);
  const wc = v?.words?.filter(w => w.char_type_name === 'word').length || 1;

  audio.play().catch(() => {});
  audio.onloadedmetadata = () => {
    const iv = (audio.duration * 1000) / Math.max(wc, 1);
    let wi = 0;
    hlTimer = setInterval(() => {
      wi++;
      if (wi >= wc) clearInterval(hlTimer);
      setState({ hlWord: wi });
    }, iv);
  };
  audio.onended = () => {
    stopAudio();
    if (state.continuous) {
      const ch = state.cur;
      if (ch && an < ch.numberOfAyahs) playAyah(sn, an + 1);
    }
  };
  audio.onerror = () => stopAudio();
}

function stopAudio() {
  if (audio) {
    audio.pause();
    audio = null;
  }
  clearInterval(hlTimer);
  setState({ playing: null, hlWord: -1 });
}

function playWordAudio(au) {
  if (!au) return;
  new Audio(`https://audio.qurancdn.com/${au}`).play().catch(() => {});
}

