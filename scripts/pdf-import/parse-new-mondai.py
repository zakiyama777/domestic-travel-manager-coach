"""Parse R06/R07 新出題例 mondai PDFs."""
import re, os

def fw_to_ascii(s):
    out = []
    for ch in s:
        code = ord(ch)
        if 0xFF41 <= code <= 0xFF5A: out.append(chr(code - 0xFF41 + ord('a')))
        elif 0xFF21 <= code <= 0xFF3A: out.append(chr(code - 0xFF21 + ord('A')))
        else: out.append(ch)
    return ''.join(out)

FW_TO_INT = {'０':0,'１':1,'２':2,'３':3,'４':4,'５':5,'６':6,'７':7,'８':8,'９':9}
def fw_num(s):
    n = ''
    for ch in s:
        if ch in FW_TO_INT: n += str(FW_TO_INT[ch])
        elif ch.isdigit(): n += ch
    return int(n) if n else None

def parse_new(pdf_txt_path):
    raw = open(pdf_txt_path).read()
    # Remove page separators and headers
    raw = re.sub(r'_{3,}', '\n', raw)
    raw = re.sub(r'【\d+】[^\n]*\n', '\n', raw)  # section header like 【１】...
    raw = re.sub(r'\s-\d+-\s', '\n', raw)
    
    # Split by 問N pattern
    # Match: 問[fullwidth-digit or digit]+ followed by \n and question body
    q_pattern = re.compile(r'問\s*([0-9０-９]+)\s*\n', re.MULTILINE)
    matches = list(q_pattern.finditer(raw))
    
    questions = []
    for i, m in enumerate(matches):
        qnum = fw_num(m.group(1))
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(raw)
        body = raw[start:end]
        # Parse prompt + 4 choices
        # Choice markers: 'ア．' or 'ア.' - may appear at start of line OR inline.
        # Use lookahead to detect a fresh choice: preceded by line-start, or by 2+ whitespace.
        choice_pat = re.compile(r'(?:^|(?<=\s{2}))\s*(ア|イ|ウ|エ|オ)[．\.]\s*', re.MULTILINE)
        cms = list(choice_pat.finditer(body))
        # Deduplicate: for the same letter appearing multiple times (e.g. within text),
        # keep only the first occurrence of each letter in order ア→イ→ウ→エ.
        seen_letters = set()
        uniq_cms = []
        expected = ['ア','イ','ウ','エ','オ']
        exp_idx = 0
        for cm in cms:
            letter = cm.group(1)
            if exp_idx < len(expected) and letter == expected[exp_idx] and letter not in seen_letters:
                uniq_cms.append(cm)
                seen_letters.add(letter)
                exp_idx += 1
        cms = uniq_cms
        if len(cms) >= 4:
            prompt_end = cms[0].start()
            prompt = body[:prompt_end].strip()
            # Clean prompt: remove page markers, extra whitespace
            prompt = re.sub(r'[_\n]+', ' ', prompt)
            prompt = re.sub(r'\s+', ' ', prompt).strip()
            # Remove leading form feed and 試験問題 boilerplate  
            prompt = re.sub(r'^[^\u3000-\u9fff]*', '', prompt).strip()
            choices = {}
            for j, cm in enumerate(cms):
                letter = cm.group(1)
                ce = cms[j+1].start() if j+1 < len(cms) else len(body)
                text = body[cm.start():ce]
                # Remove the letter marker
                text = re.sub(r'^\s*[アイウエオ][．\.]\s*', '', text, count=1)
                text = re.sub(r'[_\n]+', ' ', text)
                text = re.sub(r'\s+', ' ', text).strip()
                # Strip trailing page markers
                text = re.sub(r'\s*-\s*\d+\s*-\s*$', '', text).strip()
                choices[letter] = text
            # Only keep 4 standard choices (ア,イ,ウ,エ)
            c4 = {k:choices[k] for k in ['ア','イ','ウ','エ'] if k in choices}
            questions.append({'qnum': qnum, 'prompt': prompt, 'choices': c4})
        else:
            questions.append({'qnum': qnum, 'prompt': body.strip()[:300], 'choices': {}})
    return questions

if __name__ == '__main__':
    for year, f in [('R06','/tmp/exam_txt/R06___mondairei_poppler.txt'),
                    ('R07','/tmp/exam_txt/R07_mondairei_poppler.txt')]:
        qs = parse_new(f)
        print(f'\n===== {year} =====')
        print(f'Total Qs: {len(qs)}')
        good = sum(1 for q in qs if len(q['choices'])==4)
        print(f'With 4 choices: {good}')
        if qs:
            print(f'Q1 prompt: {qs[0]["prompt"][:150]}')
            print(f'Q1 choices: {qs[0]["choices"]}')
        # Print last Q number to see range
        if qs:
            print(f'Last Q num: {qs[-1]["qnum"]}')
