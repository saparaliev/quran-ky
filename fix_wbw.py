import json

with open('kyrgyz-wbw.json', encoding='utf-8') as f:
    data = json.load(f)

CORRECTIONS = {
    'сенге': 'сага',
    'нигмет': 'ырайым',
    'нигметтер': 'ырайымдар',
    'нигметин': 'ырайымын',
    'намаздар': 'намаздар',
    'сенин': 'сенин',
}

fixed = 0
for k, v in data.items():
    for wrong, correct in CORRECTIONS.items():
        if wrong in v:
            data[k] = v.replace(wrong, correct)
            fixed += 1
            print(f'{k}: "{v}" → "{data[k]}"')

with open('kyrgyz-wbw.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print(f'\nFixed {fixed} words')
