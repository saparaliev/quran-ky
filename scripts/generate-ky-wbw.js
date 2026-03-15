#!/usr/bin/env node
/**
 * Fetches all 114 surahs word-by-word from Quran.com API v4, collects English
 * meanings, and writes unique-meanings.json and word-positions.json.
 *
 * Run: node scripts/generate-ky-wbw.js
 */

const fs = require('fs');
const path = require('path');

const QAPI = 'https://api.quran.com/api/v4';
const PER_PAGE = 50;
const DELAY_MS = 500;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchVerses(chapter, page) {
  const url = `${QAPI}/verses/by_chapter/${chapter}?language=en&words=true&word_fields=text_uthmani,translation,transliteration&per_page=${PER_PAGE}&page=${page}&fields=text_uthmani`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function main() {
  const uniqueMeanings = new Set();
  const wordPositions = Object.create(null);

  for (let chapter = 1; chapter <= 114; chapter++) {
    let page = 1;
    let totalPages = 1;

    do {
      console.log(`Fetching surah ${chapter}/114, page ${page}...`);
      const data = await fetchVerses(chapter, page);
      const verses = data.verses || [];
      totalPages = data.pagination?.total_pages ?? 1;

      for (const verse of verses) {
        const ayah = verse.verse_number;
        const words = verse.words || [];
        for (const w of words) {
          if (w.char_type_name !== 'word') continue;
          const meaning = (w.translation && w.translation.text) ? w.translation.text.trim() : '';
          const position = w.position != null ? w.position : 0;
          const key = `${chapter}:${ayah}:${position}`;
          wordPositions[key] = meaning;
          if (meaning) uniqueMeanings.add(meaning);
        }
      }

      page += 1;
      if (page <= totalPages) await delay(DELAY_MS);
    } while (page <= totalPages);

    if (chapter < 114) await delay(DELAY_MS);
  }

  const scriptsDir = path.join(__dirname);
  const uniquePath = path.join(scriptsDir, 'unique-meanings.json');
  const positionsPath = path.join(scriptsDir, 'word-positions.json');

  const uniqueArray = Array.from(uniqueMeanings).sort();
  fs.writeFileSync(uniquePath, JSON.stringify(uniqueArray, null, 2), 'utf8');
  console.log(`Wrote ${uniqueArray.length} unique meanings to ${uniquePath}`);

  fs.writeFileSync(positionsPath, JSON.stringify(wordPositions, null, 2), 'utf8');
  console.log(`Wrote ${Object.keys(wordPositions).length} word positions to ${positionsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
