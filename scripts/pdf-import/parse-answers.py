"""Updated answer parser with R03-R05 terms Q21-Q25 handling."""
import fitz, json, re, os
from collections import defaultdict

ANS_LETTER = set('アイウエオ')
FW = '０１２３４５６７８９'
def fw_to_int(s):
    out=''
    for ch in s:
        if ch in FW: out += str(FW.index(ch))
        elif ch.isdigit(): out += ch
    return int(out) if out else None

SUBNUM_MAP = {'①':1,'②':2,'③':3,'④':4,'⑤':5,'⑥':6,'⑦':7,'⑧':8,'⑨':9}

def extract_sections(pdf):
    doc = fitz.open(pdf)
    page = doc[0]
    words = page.get_text("words")
    items = [(round(w[1]), w[0], w[4]) for w in words]
    items.sort(key=lambda z:(z[0], z[1]))
    sec_ys = {}
    for y,x,t in items:
        if '旅行業法' in t and '１' in t: sec_ys['law']=y
        elif '旅行業約款' in t and '２' in t: sec_ys['terms']=y
        elif '国内旅行実務' in t and '３' in t: sec_ys['practice']=y
    ordered = sorted(sec_ys.items(), key=lambda z:z[1])
    ranges = {}
    for i,(sec,y) in enumerate(ordered):
        ye = ordered[i+1][1] if i+1<len(ordered) else 10000
        ranges[sec] = (y, ye)
    return items, ranges

def parse_law_terms_old(pdf, year):
    """Parse R03-R05 law & terms. Returns lists of 25 letters each."""
    items, ranges = extract_sections(pdf)
    out = {}
    for sec in ('law','terms'):
        if sec not in ranges:
            out[sec] = []; continue
        y0,y1 = ranges[sec]
        seg = [it for it in items if y0<it[0]<y1]
        # Two columns, split at x=270
        L = [it for it in seg if it[1] < 270]
        R = [it for it in seg if it[1] >= 270]
        # For the right column of terms, there's an extra inner column at x=300 for bare-digit sub-section Qs (21-25)
        def parse_col(col, include_bare=False):
            col_sorted = sorted(col, key=lambda z:(z[0], z[1]))
            pairs = []  # list of (qkey, letter)
            pending_num = None
            pending_bare = None  # for bare-digit Qs
            for y,x,t in col_sorted:
                t = t.strip()
                if not t: continue
                m = re.fullmatch(r'（(\d+)）', t)
                if m:
                    pending_num = ('paren', int(m.group(1)))
                    continue
                # Bare fullwidth digit 1-9 (only in right column at x≈300)
                if include_bare and t in FW[1:] and 290 <= x <= 330:
                    # sub-section index 2-6 → Q21-Q25 (index = digit - 1 + 20, so Q(digit + 19))
                    # Actually: digit 2 → Q21, digit 3 → Q22, ..., digit 6 → Q25
                    # But digit 1 marks subsection 1 = Q1-Q20 (ignore)
                    d = int(FW.index(t))
                    if d >= 2 and d <= 6:
                        pending_num = ('bare', 20 + (d - 1))  # 2→21, 3→22, 4→23, 5→24, 6→25
                    else:
                        pending_num = None
                    continue
                if t in ANS_LETTER or re.fullmatch(r'[アイウエオ](?:・[アイウエオ])+', t):
                    if pending_num is not None:
                        kind, n = pending_num
                        pairs.append((n, t))
                        pending_num = None
                    continue
            return pairs
        
        include_bare = (sec == 'terms')
        pairs = parse_col(L, False) + parse_col(R, include_bare)
        by_num = {}
        for n,l in pairs: by_num[n] = l
        lst = [by_num.get(i) for i in range(1,26)]
        out[sec] = lst
    return out

def parse_practice_old(pdf):
    items, ranges = extract_sections(pdf)
    if 'practice' not in ranges: return []
    y0,y1 = ranges['practice']
    seg = [it for it in items if y0<it[0]<y1]
    # Two columns; parent digits at x<70 (L) and x≈300 (R)
    def parse_col(col_items, is_right=False):
        linear = sorted(col_items, key=lambda z:(z[0], z[1]))
        out = []
        pending_num = None
        current_parent = None
        for y,x,t in linear:
            t = t.strip()
            if not t: continue
            # Parent digit markers
            if t in '１２３４５６７８９' and ((not is_right and x < 80) or (is_right and 290 <= x <= 330)):
                current_parent = fw_to_int(t)
                continue
            if t in SUBNUM_MAP:
                pending_num = ('sub', SUBNUM_MAP[t])
                continue
            m = re.fullmatch(r'（(\d+)）', t)
            if m:
                pending_num = ('paren', int(m.group(1)))
                continue
            if t in ANS_LETTER or re.fullmatch(r'[アイウエオ](?:・[アイウエオ])+', t):
                if pending_num is not None:
                    kind, n = pending_num
                    out.append({'parent': current_parent, 'kind': kind, 'n': n, 'ans': t, 'y': y, 'x': x})
                    pending_num = None
                continue
        return out
    L = [it for it in seg if it[1] < 270]
    R = [it for it in seg if it[1] >= 270]
    return parse_col(L, False) + parse_col(R, True)

def parse_new(pdf):
    """R06-R07 new format: 問N sequential numbering."""
    items, ranges = extract_sections(pdf)
    out = {'law':[],'terms':[],'practice':[]}
    for sec in ('law','terms','practice'):
        if sec not in ranges: continue
        y0,y1 = ranges[sec]
        seg = [it for it in items if y0<it[0]<y1]
        def parse_col(col_items):
            linear = sorted(col_items, key=lambda z:(z[0], z[1]))
            pairs = []
            pending = None
            last_parent_num = None
            pending_sub = None
            for y,x,t in linear:
                t = t.strip()
                if not t: continue
                m = re.fullmatch(r'問\s*(\d+)', t)
                if m:
                    pending = int(m.group(1))
                    last_parent_num = pending
                    pending_sub = None
                    continue
                if t == '問':
                    pending = '__wait'; continue
                if pending == '__wait' and re.fullmatch(r'\d+', t):
                    pending = int(t); last_parent_num = pending; pending_sub = None
                    continue
                if t in SUBNUM_MAP:
                    pending_sub = SUBNUM_MAP[t]; continue
                if t in ANS_LETTER or re.fullmatch(r'[アイウエオ](?:・[アイウエオ])+', t):
                    if pending_sub is not None and last_parent_num is not None:
                        pairs.append({'parent': last_parent_num, 'sub': pending_sub, 'ans': t})
                        pending_sub = None
                    elif isinstance(pending, int):
                        pairs.append({'parent': pending, 'sub': None, 'ans': t})
                        pending = None
                    continue
            return pairs
        L = [it for it in seg if it[1] < 270]
        R = [it for it in seg if it[1] >= 270]
        out[sec] = parse_col(L) + parse_col(R)
    return out

YEARS = [
    ('R03','R03kaitou_2.pdf','old'),
    ('R04','R04kaitou_2.pdf','old'),
    ('R05','R05kaitou_2.pdf','old'),
    ('R06','R06__kaitourei_2.pdf','new'),
    ('R07','R07_kaitourei_2.pdf','new'),
]

all_answers = {}
for year, fn, style in YEARS:
    path = f'/home/user/uploaded_files/{fn}'
    entry = {}
    if style == 'old':
        lt = parse_law_terms_old(path, year)
        entry['law'] = lt['law']
        entry['terms'] = lt['terms']
        entry['practice'] = parse_practice_old(path)
    else:
        r = parse_new(path)
        entry['law'] = r['law']
        entry['terms'] = r['terms']
        entry['practice'] = r['practice']
    all_answers[year] = entry

for year in sorted(all_answers.keys()):
    entry = all_answers[year]
    print(f'\n===== {year} =====')
    if isinstance(entry['law'], list) and entry['law'] and not isinstance(entry['law'][0], dict):
        print(f"LAW ({sum(1 for x in entry['law'] if x)}/25):", entry['law'])
        print(f"TERMS ({sum(1 for x in entry['terms'] if x)}/25):", entry['terms'])
    else:
        print(f"LAW ({len(entry['law'])}):", [e['ans'] for e in entry['law']])
        print(f"TERMS ({len(entry['terms'])}):", [e['ans'] for e in entry['terms']])
    print(f"PRACTICE ({len(entry['practice'])}):")
    for i,p in enumerate(entry['practice'][:40]):
        print(f'   [{i}] {p}')

with open('/tmp/parse/answers.json','w') as f:
    json.dump(all_answers, f, ensure_ascii=False, indent=2)
print('\nSaved /tmp/parse/answers.json')
