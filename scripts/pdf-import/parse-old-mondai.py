"""Parse mondai PDFs into structured questions (R03-R05 format).

Sections:
- Law: 25 Qs numbered (1)-(25) sequentially.
- Terms: sub-sections 1-6. Sub 1 has (1)-(20). Subs 2-6 each have one question → map to Q21-Q25.
- Practice: complex, we capture bodies but don't fully normalize.

For R06/R07: different format (新出題例), deferred to separate handler.
"""
import re, json, os

# Mojibake cleanup (shared with answer parser)
SUBSECTION_CHARS = ['ઃ','઄','અ','આ','ઇ','ઈ']  # 1, 2, 3, 4, 5, 6

def clean(s):
    s = s.replace('唖', ' ')
    s = re.sub(r'[\x02-\x0C]', '', s)
    s = re.sub(r'[\u0A80-\u0AFF]', '', s)
    s = re.sub(r'GC\w+\.smd Page \d+\s+\d+/\d+/\d+ \d+:\d+ v\d+\.\d+', '', s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = re.sub(r'\n+', '\n', s)
    return s

def fw_to_ascii(s):
    out = []
    for ch in s:
        code = ord(ch)
        if 0xFF41 <= code <= 0xFF5A: out.append(chr(code - 0xFF41 + ord('a')))
        elif 0xFF21 <= code <= 0xFF3A: out.append(chr(code - 0xFF21 + ord('A')))
        elif code == 0xFF0C: out.append(',')
        else: out.append(ch)
    return ''.join(out)

def flat_text(txt):
    return re.sub(r'\s+', ' ', txt).strip()

def parse_question_body(body):
    """Split 'prompt ア ... イ ... ウ ... エ ...' into (prompt, {letter: text})."""
    m = re.search(r'(^|[ 、。）\)])ア\s+(.+?)\s+イ\s+(.+?)\s+ウ\s+(.+?)\s+エ\s+(.+)$', body)
    if m:
        choices = {'ア': m.group(2).strip(), 'イ': m.group(3).strip(), 'ウ': m.group(4).strip(), 'エ': m.group(5).strip()}
        for k, v in choices.items():
            v = re.sub(r'\s+-\s+\d+\s+-\s*$', '', v).strip()
            # Some trailing artifacts
            v = re.sub(r'\(\s*注\s*\).*$', '', v).strip()
            choices[k] = v
        prompt = body[:m.start()].strip()
        prompt = re.sub(r'\s+-\s+\d+\s+-\s*$', '', prompt).strip()
        return prompt, choices
    return body, {}

def extract_questions_simple(section_flat):
    """Split by ( number ) marker: '(X)' or '()'."""
    pattern = re.compile(r'\(\s*\d*\s*\)')
    parts = pattern.split(section_flat)
    return [p.strip() for p in parts[1:]]

def parse_terms_section(section_raw):
    """For sections 2-6 of the old format: split by Gujarati subsection markers."""
    # Strategy: find each subsection start by its Gujarati char
    # Subsection 1 uses ઃ at start + "标準旅行業約款", contains 20 Qs.
    # Subsections 2-6 use ઄ અ આ ઇ ઈ at start; each contains 1 Q.
    # Split by positions where a Gujarati char appears at beginning of a visual section (with newline before).
    # Easier: find all occurrences of each Gujarati subsection-header marker (where marker is at start of a header line).
    subsec_pattern = re.compile(r'[\u0A80-\u0AFF]唖(?=[^\s])')  # e.g. "ઃ唖標準旅行業約款..."
    starts = [m.start() for m in subsec_pattern.finditer(section_raw)]
    # Dedupe close ones (within 20 chars)
    cleaned_starts = []
    for s in starts:
        if not cleaned_starts or s - cleaned_starts[-1] > 20:
            cleaned_starts.append(s)
    # Create subsections
    subsections = []
    for i, s in enumerate(cleaned_starts):
        e = cleaned_starts[i+1] if i+1 < len(cleaned_starts) else len(section_raw)
        subsections.append(section_raw[s:e])
    # Process each: subsection 1 → extract 20 Qs using (N) pattern; subs 2-6 → 1 Q each (the whole body after header)
    results = []  # list of (qnum, prompt, choices)
    qnum = 0
    for i, sub in enumerate(subsections):
        cleaned = fw_to_ascii(clean(sub))
        flat = flat_text(cleaned)
        if i == 0:
            # Sub 1: many Qs
            bodies = extract_questions_simple(flat)
            for b in bodies:
                qnum += 1
                p, c = parse_question_body(b)
                results.append({'qnum': qnum, 'prompt': p, 'choices': c})
        else:
            # One question per subsection. The content is [header stuff] + [1 question text] + choices.
            # The "question body" starts after the subsection header line ending with a period.
            # Let's just find the first "ア ...イ ...ウ ...エ ..." pattern and capture everything before as prompt.
            qnum += 1
            p, c = parse_question_body(flat)
            # The prompt contains the subsection header; strip it
            # Remove the header text up to the first typical question pattern
            # E.g. "一般貸切旅客自動車運送事業標準運送約款に関する次の記述のうち、誤っているものを つ選びなさい。 ア..."
            # The prompt extracted by parse_question_body already ends before ア. Good.
            results.append({'qnum': qnum, 'prompt': p, 'choices': c})
    return results

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW_DIR = os.path.join(REPO_ROOT, 'content', 'past-exams', '_raw')
TXT_DIR = os.path.join(RAW_DIR, 'txt')

def extract_year_old(year, mondai_fn):
    base = os.path.basename(mondai_fn).replace('.pdf', '_poppler.txt')
    path = os.path.join(TXT_DIR, base)
    if not os.path.exists(path):
        # Try the default raw dir or uploaded_files as fallback
        pdf_path = os.path.join(RAW_DIR, mondai_fn)
        if not os.path.exists(pdf_path):
            pdf_path = f'/home/user/uploaded_files/{mondai_fn}'
        os.makedirs(TXT_DIR, exist_ok=True)
        os.system(f'pdftotext -layout "{pdf_path}" "{path}"')
    raw = open(path).read()
    txt = fw_to_ascii(clean(raw))
    
    sec1_hdr = '旅行業法及びこれに基づく命令'
    sec2_hdr = '旅行業約款、運送約款及び宿泊約款'
    sec3_hdr = '国内旅行実務'
    def nth_raw(s, needle, n):
        positions = []; i = 0
        while True:
            j = s.find(needle, i)
            if j < 0: break
            positions.append(j); i = j + len(needle)
        return positions[n-1] if len(positions) >= n else -1
    
    # For terms we need RAW text with Gujarati chars for subsection detection
    s1_r = nth_raw(raw, sec1_hdr, 2)
    s2_r = nth_raw(raw, sec2_hdr, 2)
    s3_r = nth_raw(raw, sec3_hdr, 2)
    s1_c = nth_raw(txt, sec1_hdr, 2)
    s2_c = nth_raw(txt, sec2_hdr, 2)
    s3_c = nth_raw(txt, sec3_hdr, 2)
    
    result = {'law':[], 'terms':[], 'practice':[]}
    # Law
    sec1_text = flat_text(txt[s1_c:s2_c])
    bodies = extract_questions_simple(sec1_text)
    for i, b in enumerate(bodies):
        p, c = parse_question_body(b)
        result['law'].append({'qnum': i+1, 'prompt': p, 'choices': c})
    # Terms (uses raw subsection parsing)
    terms_raw = raw[s2_r:s3_r]
    result['terms'] = parse_terms_section(terms_raw)
    # Practice
    sec3_text = flat_text(txt[s3_c:])
    bodies = extract_questions_simple(sec3_text)
    for i, b in enumerate(bodies):
        p, c = parse_question_body(b)
        result['practice'].append({'qnum': i+1, 'prompt': p, 'choices': c})
    return result

if __name__ == '__main__':
    for year, fn in [('R03','R03mondai.pdf'),('R04','R04mondai.pdf'),('R05','R05mondai.pdf')]:
        r = extract_year_old(year, fn)
        print(f'\n===== {year} =====')
        for sec, qs in r.items():
            good = sum(1 for q in qs if len(q['choices'])==4)
            print(f'  {sec}: {len(qs)} bodies, {good} with 4 choices')
        # Sample terms Q21
        print(f'  Terms Q21 sample: {r["terms"][20]["prompt"][:200]}' if len(r["terms"])>20 else 'no Q21')
        print(f'  Terms Q25 choices: {list(r["terms"][24]["choices"].keys()) if len(r["terms"])>24 else "no Q25"}')
