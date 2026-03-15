#!/usr/bin/env node
/**
 * Builds data/wbw-ky.json from Kyrgyz translations and word positions.
 * Run: node scripts/build-wbw-ky.js
 */

const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);
const rootDir = path.join(scriptsDir, '..');
const translationsPath = path.join(scriptsDir, 'ky-translations-final.json');
const positionsPath = path.join(scriptsDir, 'word-positions.json');
const outPath = path.join(rootDir, 'data', 'wbw-ky.json');

function main() {
  const translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
  const positions = JSON.parse(fs.readFileSync(positionsPath, 'utf8'));

  const keys = Object.keys(positions);
  const parsed = keys.map((k) => {
    const [surah, ayah, pos] = k.split(':').map(Number);
    return { key: k, surah, ayah, pos, en: positions[k] };
  });
  parsed.sort((a, b) => a.surah - b.surah || a.ayah - b.ayah || a.pos - b.pos);

  const result = {};
  let totalWords = 0;
  let fallbacks = 0;

  for (const { surah, ayah, pos, en } of parsed) {
    const s = String(surah);
    const a = String(ayah);
    if (!result[s]) result[s] = {};
    if (!result[s][a]) result[s][a] = [];
    const ky = translations[en];
    const use = ky != null && String(ky).trim() !== '' ? String(ky).trim() : en;
    if (use === en && en) fallbacks += 1;
    result[s][a].push(use);
    totalWords += 1;
  }

  const dataDir = path.dirname(outPath);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');

  console.log('Total words mapped:', totalWords);
  console.log('Fallbacks used (English):', fallbacks);
  console.log('Wrote', outPath);
}

main();
