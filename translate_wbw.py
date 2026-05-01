"""
Translate Turkish Word-by-Word Quran to Kyrgyz using Claude API
Processes in batches of 50 words per API call for efficiency
Output: kyrgyz-wbw.json with same key format {surah:verse:word: "kyrgyz meaning"}
"""

import json
import urllib.request
import time
import os

# Load Turkish data
with open('turkish-wbw-translation.json', encoding='utf-8') as f:
    turkish = json.load(f)

print(f"Total Turkish words: {len(turkish)}")

# Load existing Kyrgyz output if resuming
OUTPUT_FILE = 'kyrgyz-wbw.json'
if os.path.exists(OUTPUT_FILE):
    with open(OUTPUT_FILE, encoding='utf-8') as f:
        kyrgyz = json.load(f)
    print(f"Resuming — already translated: {len(kyrgyz)}")
else:
    kyrgyz = {}

# Only process keys not yet translated
remaining = {k: v for k, v in turkish.items() if k not in kyrgyz}
print(f"Remaining to translate: {len(remaining)}")

BATCH_SIZE = 80  # words per API call
API_KEY = os.environ.get('ANTHROPIC_API_KEY', '')

if not API_KEY:
    print("ERROR: Set ANTHROPIC_API_KEY environment variable")
    exit(1)

def translate_batch(batch_dict):
    """Translate a batch of Turkish words to Kyrgyz via Claude API"""
    batch_text = "\n".join(f"{k}: {v}" for k, v in batch_dict.items())
    
    prompt = f"""Бул Куран сөздөрүнүн түркчөдөн кыргызчага которулган тизмеси.
Ар бир сөздү кыргызчага котор. Сөз маанисин гана бер, ар бир сөзгө кыска, так котормо.
Форматты так сакта: key: котормо
Башка эч нерсе жазба.

Түркчө сөздөр:
{batch_text}

Кыргызча которгуч:"""

    payload = json.dumps({
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://api.anthropic.com/v1/messages',
        data=payload,
        headers={
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
            'anthropic-version': '2023-06-01'
        }
    )
    
    with urllib.request.urlopen(req, timeout=30) as resp:
        data = json.loads(resp.read())
    
    text = data['content'][0]['text'].strip()
    
    # Parse response
    result = {}
    for line in text.split('\n'):
        line = line.strip()
        if ':' in line:
            # Find the key (format surah:verse:word)
            parts = line.split(':', 3)
            if len(parts) >= 4:
                key = f"{parts[0]}:{parts[1]}:{parts[2]}"
                value = parts[3].strip()
                if key in batch_dict:
                    result[key] = value
    return result

# Process in batches
keys = list(remaining.keys())
total_batches = (len(keys) + BATCH_SIZE - 1) // BATCH_SIZE
translated_count = 0
failed_count = 0

print(f"\nProcessing {len(keys)} words in {total_batches} batches of {BATCH_SIZE}...")
print("="*50)

for i in range(0, len(keys), BATCH_SIZE):
    batch_keys = keys[i:i+BATCH_SIZE]
    batch = {k: remaining[k] for k in batch_keys}
    batch_num = i // BATCH_SIZE + 1
    
    # Show first surah:verse in batch
    first_key = batch_keys[0]
    last_key = batch_keys[-1]
    print(f"Batch {batch_num}/{total_batches} ({first_key} → {last_key})...", end=' ', flush=True)
    
    try:
        result = translate_batch(batch)
        
        # For any keys not returned, use Turkish as fallback
        for k in batch_keys:
            if k in result:
                kyrgyz[k] = result[k]
            else:
                kyrgyz[k] = turkish[k]  # fallback to Turkish
        
        translated_count += len(result)
        failed_count += len(batch_keys) - len(result)
        print(f"✓ {len(result)}/{len(batch_keys)} translated")
        
        # Save progress every 5 batches
        if batch_num % 5 == 0:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(kyrgyz, f, ensure_ascii=False, separators=(',', ':'))
            print(f"  💾 Saved progress ({len(kyrgyz)} total)")
        
        time.sleep(0.3)  # small delay between batches
        
    except Exception as e:
        print(f"✗ Error: {e}")
        failed_count += len(batch_keys)
        # Use Turkish as fallback for failed batch
        for k in batch_keys:
            kyrgyz[k] = turkish[k]
        time.sleep(2)

# Final save
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(kyrgyz, f, ensure_ascii=False, separators=(',', ':'))

print("\n" + "="*50)
print(f"✅ Done!")
print(f"Total words: {len(kyrgyz)}")
print(f"Successfully translated: {translated_count}")
print(f"Fallback to Turkish: {failed_count}")
print(f"Output saved to: {OUTPUT_FILE}")

# Show sample output for Fatiha
print("\nSample — Fatiha (Surah 1):")
for k, v in sorted(kyrgyz.items(), key=lambda x: [int(n) for n in x[0].split(':')]):
    if k.startswith('1:'):
        print(f"  {k}: {v}")
