import json, re, glob

# ── All OCR / PDF artifact patterns to strip ──────────────────────────────
CLEANERS = [
    # SkillCertPro footer block (catches all variants including mid-text)
    (re.compile(r'\s*\d{1,3}/\d{1,3}\s+Use Page numbers[\s\S]*', re.I), ''),
    (re.compile(r'\s*Use Page numbers below[\s\S]*', re.I), ''),
    (re.compile(r'\s*(?:WWWe|We help you to succeed)[\s\S]*', re.I), ''),
    (re.compile(r'\s*Skillcertpro\s+Quick Links[\s\S]*', re.I), ''),
    # Trailing page counter like "60/60" or "59/60" at end of text
    (re.compile(r'\s*\d{1,3}/\d{1,3}\s*$'), ''),
    # Garbled date timestamps: "7127126, 5:01 PM" style
    (re.compile(r'\d{5,},\s*\d+:\d+\s*[AP]M\s*'), ''),
    # Real date timestamps: "7/27/2026, 5:01 PM"
    (re.compile(r'\d{1,2}/\d{1,2}/\d{2,4},?\s*\d+:\d+\s*[AP]M\s*'), ''),
    # PDF page-break nav artifacts: "| 12)" or "10) 11) | 12"
    (re.compile(r'\s*\d+\)\s*\|\s*\d+\)'), ' '),
    (re.compile(r'\s*\|\s*\d+\)'), ' '),
    # SkillCertPro footer links block
    (re.compile(r'\s*ABOUT US\s+FAQ\s+BROWSE ALL[\s\S]*', re.I), ''),
    (re.compile(r'\s*REFUND POLICY[\s\S]*', re.I), ''),
    # Stray question counter at very end "60/60" standalone
    (re.compile(r'(?<=[.!?])\s+\d{1,3}/\d{1,3}\s*$'), ''),
    # Double whitespace collapse
    (re.compile(r'  +'), ' '),
]


def clean_text(text):
    if not text:
        return text
    for pattern, replacement in CLEANERS:
        text = pattern.sub(replacement, text)
    return text.strip()


total_fixed = 0
report = []

for f in sorted(glob.glob(
    'C:/Users/ajeet.k.chouksey/Documents/Code/ajch_platform/public/content/questions/gh300-domain*.json'
)):
    fname = f.replace('\\', '/').split('/')[-1]
    with open(f, encoding='utf-8') as fp:
        qs = json.load(fp)

    file_changed = False
    for q in qs:
        q_changed = []
        for field in ('question', 'explanation', 'scenario'):
            orig = q.get(field) or ''
            if not orig:
                continue
            cleaned = clean_text(orig)
            if cleaned != orig:
                q[field] = cleaned
                q_changed.append(field)
                total_fixed += 1

        opts_changed = False
        for i, opt in enumerate(q.get('options', [])):
            cleaned_opt = clean_text(opt)
            if cleaned_opt != opt:
                q['options'][i] = cleaned_opt
                opts_changed = True
                total_fixed += 1
        if opts_changed:
            q_changed.append('options')

        if q_changed:
            file_changed = True
            report.append((fname, q['id'], q_changed))

    if file_changed:
        with open(f, 'w', encoding='utf-8') as fp:
            json.dump(qs, fp, indent=2, ensure_ascii=False)

print('=== AUDIT REPORT ===')
if report:
    for fname, qid, fields in report:
        print(f'  FIXED  {qid:20s}  {fname}  [{", ".join(fields)}]')
else:
    print('  No additional artifacts found.')
print(f'\nTotal fields cleaned: {total_fixed}')
