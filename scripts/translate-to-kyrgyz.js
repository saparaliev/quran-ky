#!/usr/bin/env node
/**
 * Translates unique English Quranic word meanings to Kyrgyz via Anthropic API.
 * Resumes from scripts/ky-translations-progress.json if present.
 *
 * Run: ANTHROPIC_API_KEY=your-key node scripts/translate-to-kyrgyz.js
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 100;
const DELAY_MS = 1000;
const SAVE_PROGRESS_EVERY_N_BATCHES = 10;

const scriptsDir = path.join(__dirname);
const uniquePath = path.join(scriptsDir, 'unique-meanings.json');
const progressPath = path.join(scriptsDir, 'ky-translations-progress.json');
const finalPath = path.join(scriptsDir, 'ky-translations-final.json');
const debugResponsePath = path.join(scriptsDir, 'debug-last-response.txt');

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are translating Quranic word-by-word meanings from English to Kyrgyz (Кыргызча).
These are individual word meanings from the Holy Quran. Keep translations concise — 1-4 words max.
Use proper Kyrgyz Cyrillic script. Be accurate with Islamic/Quranic terminology.

Return ONLY a valid JSON array of Kyrgyz translations. No markdown, no code blocks, no explanations before or after. Start your response with [ and end with ]. Example format: ["котормо1", "котормо2", "котормо3"]
Keep the exact same order as the input.`;

function buildPrompt(batch) {
  return `${SYSTEM_PROMPT}

Input meanings:
${JSON.stringify(batch)}`;
}

function cleanJsonSlice(str) {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function fallbackQuotedLines(text) {
  const lines = text.split(/\r?\n/);
  const result = [];
  const quoted = /^["'](.+)["']\s*,?\s*$/;
  for (const line of lines) {
    const trimmed = line.trim();
    const m = trimmed.match(quoted);
    if (m) result.push(m[1].replace(/\\"/g, '"').trim());
  }
  return result;
}

function extractJsonArray(text) {
  const raw = text.trim();
  const firstBracket = raw.indexOf('[');
  const lastBracket = raw.lastIndexOf(']');
  if (firstBracket === -1 || lastBracket === -1 || lastBracket <= firstBracket) {
    fs.writeFileSync(debugResponsePath, raw, 'utf8');
    console.warn('Could not find [ ] in response; wrote raw to', debugResponsePath);
    const fallback = fallbackQuotedLines(raw);
    if (fallback.length) return fallback;
    throw new Error('No JSON array or quoted lines found in response');
  }
  let slice = raw.slice(firstBracket, lastBracket + 1);
  slice = cleanJsonSlice(slice);
  try {
    return JSON.parse(slice);
  } catch (e) {
    fs.writeFileSync(debugResponsePath, raw, 'utf8');
    console.warn('JSON parse failed; wrote raw response to', debugResponsePath, e.message);
    const fallback = fallbackQuotedLines(raw);
    if (fallback.length) return fallback;
    throw e;
  }
}

async function callTranslateApi(batch) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: buildPrompt(batch) }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Anthropic API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const text = data.content && data.content[0] && data.content[0].text ? data.content[0].text : '';
  const parsed = extractJsonArray(text);
  return Array.isArray(parsed) ? parsed : [];
}

async function translateBatch(batch, batchIndex, totalBatches) {
  const start = batchIndex * BATCH_SIZE + 1;
  const end = Math.min(start + BATCH_SIZE - 1, batch.length + start - 1);
  console.log(`Batch ${batchIndex + 1}/${totalBatches} — translating meanings ${start}-${end}...`);

  let translations = await callTranslateApi(batch);

  if (translations.length < batch.length) {
    await delay(DELAY_MS);
    const retry = await callTranslateApi(batch);
    if (retry.length > translations.length) translations = retry;
    if (translations.length < batch.length) {
      console.warn(
        `Warning: Batch ${batchIndex + 1} returned ${translations.length} translations instead of ${batch.length} — handled with fallback`
      );
      while (translations.length < batch.length) {
        translations.push(batch[translations.length]);
      }
    }
  } else if (translations.length > batch.length) {
    console.warn(
      `Warning: Batch ${batchIndex + 1} returned ${translations.length} translations instead of ${batch.length} — handled with fallback`
    );
    translations = translations.slice(0, batch.length);
  }

  const map = {};
  for (let i = 0; i < batch.length; i++) {
    const val = translations[i];
    map[batch[i]] =
      typeof val === 'string' ? val.trim() : (val != null ? String(val).trim() : batch[i]);
    if (map[batch[i]] === '') map[batch[i]] = batch[i];
  }
  return map;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Set ANTHROPIC_API_KEY environment variable.');
    process.exit(1);
  }

  const unique = JSON.parse(fs.readFileSync(uniquePath, 'utf8'));
  if (!Array.isArray(unique)) {
    throw new Error('unique-meanings.json must be an array');
  }

  let result = {};
  if (fs.existsSync(progressPath)) {
    result = JSON.parse(fs.readFileSync(progressPath, 'utf8'));
    console.log(`Resuming: ${Object.keys(result).length} meanings already translated.`);
  }

  const remaining = unique.filter((m) => !(m in result));
  const batches = [];
  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    batches.push(remaining.slice(i, i + BATCH_SIZE));
  }

  if (batches.length === 0) {
    console.log('Nothing left to translate.');
    fs.writeFileSync(finalPath, JSON.stringify(result, null, 2), 'utf8');
    console.log(`Wrote ${finalPath}`);
    return;
  }

  const totalBatches = batches.length;
  for (let b = 0; b < totalBatches; b++) {
    const batchMap = await translateBatch(batches[b], b, totalBatches);
    Object.assign(result, batchMap);

    if ((b + 1) % SAVE_PROGRESS_EVERY_N_BATCHES === 0) {
      fs.writeFileSync(progressPath, JSON.stringify(result, null, 2), 'utf8');
      console.log(`Progress saved (${Object.keys(result).length} meanings).`);
    }

    if (b < totalBatches - 1) await delay(DELAY_MS);
  }

  fs.writeFileSync(progressPath, JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(finalPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Done. Wrote ${Object.keys(result).length} translations to ${finalPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
