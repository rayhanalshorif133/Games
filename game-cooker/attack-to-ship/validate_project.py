import os
import re
import json

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find href and src
refs = re.findall(r'(?:src|href)=[\'"]([^\'"]+)[\'"]', html)
print('Referenced files in index.html:', refs)

missing = [r for r in refs if not os.path.exists(r) and not r.startswith('http')]
if missing:
    print('MISSING in index.html:', missing)
else:
    print('ALL referenced files in index.html exist!')

with open('c3project.json', 'r', encoding='utf-8') as f:
    c3 = json.load(f)

for obj in c3['object-types']:
    tex = obj['texture']
    if not os.path.exists(tex):
        print('Missing texture:', tex)

for snd in c3['audio']:
    if not os.path.exists(snd):
        print('Missing audio:', snd)

print('Everything in c3project.json verified!')

