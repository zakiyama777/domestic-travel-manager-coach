"""Build the final R03-R07 JSON files with real questions + correct answers.

Also normalize mojibake placeholders into readable Japanese (○).
"""
import re, json, os, sys
sys.path.insert(0, '/tmp/parse')

import importlib
import parse_questions
importlib.reload(parse_questions)
from parse_questions import extract_year_old

from parse_new_mondai import parse_new

LETTER_TO_IDX = {'ア':0,'イ':1,'ウ':2,'エ':3}

def letter_to_answer(letter):
    if not letter: return None
    if '・' in letter:
        parts = letter.split('・')
        return sorted([LETTER_TO_IDX[p] for p in parts if p in LETTER_TO_IDX])
    return LETTER_TO_IDX.get(letter)

with open('/tmp/parse/answers.json') as f:
    ANSWERS = json.load(f)

def sanitize_text(s):
    if not s: return s
    # Normalize whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    # Add a space before common Japanese number words if missing
    # The original text has "法第条目的" (should be "法第○条（目的）")
    # Common patterns:
    s = re.sub(r'法第条', '法第○条', s)
    s = re.sub(r'第条', '第○条', s)
    s = re.sub(r'第項', '第○項', s)
    s = re.sub(r'第号', '第○号', s)
    s = re.sub(r'第種', '第○種', s)
    # Normalize broken-up Japanese phrases (spaces within phrase)
    s = re.sub(r'選\s+び\s*な\s*さ\s*い', '選びなさい', s)
    s = re.sub(r'なさ\s+い', 'なさい', s)
    s = re.sub(r'誤\s+っ\s*て\s*い\s*る', '誤っている', s)
    s = re.sub(r'正\s+し\s*い', '正しい', s)
    # "つ選びなさい" → "1つ選びなさい" (they say "1つ" always)
    s = re.sub(r'(?<!\d)(?<![１-９])つ選びなさい', '1つ選びなさい', s)
    # Remove standalone hyphens or dashes that came from page markers
    s = re.sub(r'^\s*-\s*\d+\s*-\s*', '', s)
    s = re.sub(r'\s*-\s*\d+\s*-\s*$', '', s)
    return s

def shorten(s, n=1500):
    s = sanitize_text(s)
    return s if len(s) <= n else s[:n-1] + '…'

def make_question(year, section, qnum, prompt, choices_list, letter, label, src_m, src_k, is_official=True, orig_qnum=None):
    qid = f'pe-{year}-{section}-{(orig_qnum or qnum):02d}'
    ans = letter_to_answer(letter)
    if ans is None: return None
    section_ja = {'law':'法令','terms':'約款','practice':'国内旅行実務'}[section]
    short_ja = {'law':'旅行業法','terms':'約款','practice':'国内旅行実務'}[section]
    display_qnum = orig_qnum or qnum
    explanation = f'（{label} {section_ja} 問{display_qnum}） 正解：{letter}。出典：{src_m}（問題）／{src_k}（正解）。'
    if section == 'practice':
        explanation += ' 計算・資料読み取り問題は、必ず公式PDF（問題冊子）の図表・資料も確認してください。'
    return {
        'id': qid,
        'category': 'past_exam',
        'year': year,
        'section': section,
        'originalQuestionNumber': display_qnum,
        'question': shorten(prompt),
        'choices': [shorten(c, 500) for c in choices_list],
        'correctAnswer': ans,
        'explanation': explanation,
        'sourceLabel': f'{label} {short_ja} 問{display_qnum}',
        'examType': 'official' if is_official else 'sample',
        'isActive': True,
    }

def build_old(year, mondai, label, src_m, src_k, wy):
    data = extract_year_old(year, mondai)
    ans = ANSWERS[year]
    out = []
    # law
    for i, q in enumerate(data['law']):
        if i >= 25: break
        if len(q['choices']) != 4: continue
        letter = ans['law'][i] if i < len(ans['law']) else None
        if not letter: continue
        choices = [q['choices'][k] for k in ['ア','イ','ウ','エ']]
        mk = make_question(year, 'law', i+1, q['prompt'], choices, letter, label, src_m, src_k)
        if mk: out.append(mk)
    # terms
    for i, q in enumerate(data['terms']):
        if i >= 25: break
        if len(q['choices']) != 4: continue
        letter = ans['terms'][i] if i < len(ans['terms']) else None
        if not letter: continue
        choices = [q['choices'][k] for k in ['ア','イ','ウ','エ']]
        mk = make_question(year, 'terms', i+1, q['prompt'], choices, letter, label, src_m, src_k)
        if mk: out.append(mk)
    # practice
    practice_ans = ans.get('practice', [])
    for i, q in enumerate(data['practice']):
        if len(q['choices']) != 4: continue
        if i >= len(practice_ans): break
        letter = practice_ans[i].get('ans')
        if not letter: continue
        choices = [q['choices'][k] for k in ['ア','イ','ウ','エ']]
        mk = make_question(year, 'practice', i+1, q['prompt'], choices, letter, label, src_m, src_k)
        if mk: out.append(mk)
    return {
        '_meta': {
            'year': year, 'label': label, 'westernYear': wy,
            'examType': 'official',
            'source': f'{src_m} / {src_k}',
            'note': f'{label} 本試験の問題と公式正解を半自動抽出。法令・約款は本文25問ずつを変換済み。国内旅行実務は図表・計算資料を含むため、必ず公式PDF（{src_m}）も参照してください。小さな丸数字（第○条・第○項など）は抽出上の制約で○に置換しています。',
        },
        'questions': out,
    }

def build_new(year, txt_path, label, src_m, src_k, wy):
    qs = parse_new(txt_path)
    ans = ANSWERS[year]
    qs_by_num = {q['qnum']: q for q in qs}
    out = []
    def ans_map(ans_list):
        m = {}
        for e in ans_list:
            p = e.get('parent')
            if p is None: continue
            if p not in m: m[p] = e['ans']
        return m
    am_all = {'law': ans_map(ans['law']), 'terms': ans_map(ans['terms']), 'practice': ans_map(ans['practice'])}
    sec_ranges = {'law': (1,25), 'terms': (26,50), 'practice': (51,99)}
    for sec, (lo, hi) in sec_ranges.items():
        am = am_all[sec]
        seq = 0
        for p in range(lo, hi+1):
            if p not in qs_by_num: continue
            q = qs_by_num[p]
            if len(q['choices']) != 4: continue
            letter = am.get(p)
            if not letter: continue
            seq += 1
            choices = [q['choices'][k] for k in ['ア','イ','ウ','エ']]
            mk = make_question(year, sec, seq, q['prompt'], choices, letter, label, src_m, src_k, is_official=False, orig_qnum=p)
            if mk: out.append(mk)
    return {
        '_meta': {
            'year': year, 'label': label, 'westernYear': wy,
            'examType': 'sample',
            'source': f'{src_m} / {src_k}',
            'note': f'{label} 国家試験の出題例（サンプル）。{src_m}/{src_k} から抽出。本試験の全問題ではなく観光庁が公開した「出題例」のみ。問番号は出題例冊子の問1～問85に対応。',
        },
        'questions': out,
    }

CONFIGS = [
    ('R03', 'old', 'R03mondai.pdf', '令和3年度', 'R03mondai.pdf', 'R03kaitou_2.pdf', 2021),
    ('R04', 'old', 'R04mondai.pdf', '令和4年度', 'R04mondai.pdf', 'R04kaitou_2.pdf', 2022),
    ('R05', 'old', 'R05mondai.pdf', '令和5年度', 'R05mondai.pdf', 'R05kaitou_2.pdf', 2023),
    ('R06', 'new', '/tmp/exam_txt/R06___mondairei_poppler.txt', '令和6年度', 'R06___mondairei.pdf', 'R06__kaitourei_2.pdf', 2024),
    ('R07', 'new', '/tmp/exam_txt/R07_mondairei_poppler.txt', '令和7年度', 'R07_mondairei.pdf', 'R07_kaitourei_2.pdf', 2025),
]

os.makedirs('/tmp/parse/out', exist_ok=True)
for cfg in CONFIGS:
    year, style = cfg[0], cfg[1]
    if style == 'old':
        _, _, mondai, label, src_m, src_k, wy = cfg
        data = build_old(year, mondai, label, src_m, src_k, wy)
    else:
        _, _, txt_path, label, src_m, src_k, wy = cfg
        data = build_new(year, txt_path, label, src_m, src_k, wy)
    outpath = f'/tmp/parse/out/{year}.json'
    with open(outpath, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    by_sec = {'law':0, 'terms':0, 'practice':0}
    for q in data['questions']:
        by_sec[q['section']] = by_sec.get(q['section'],0) + 1
    print(f'{year}: {len(data["questions"])} total — law={by_sec["law"]}, terms={by_sec["terms"]}, practice={by_sec["practice"]} → {outpath}')
