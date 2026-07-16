import json
import os
import sys

base = 'public/content/skillup/ghc'
errors = []
warnings = []

# 1. Validate index.json
with open(os.path.join(base, 'index.json'), encoding='utf-8') as f:
    idx = json.load(f)

print('=== index.json ===')
for field in ['id', 'examCode', 'title', 'questions', 'domains', 'questionFiles', 'scenarioFiles']:
    status = 'OK  ' if field in idx else 'MISS'
    print('  [{}] {}'.format(status, field))

declared_q_count = idx['questions']
declared_files = idx.get('questionFiles', [])
declared_scenarios = idx.get('scenarioFiles', [])
print('  [OK  ] declares {} questions across {} files'.format(declared_q_count, len(declared_files)))

# 2. Load all questions
print()
print('=== Question Files ===')
all_questions = {}
for fname in declared_files:
    path = os.path.join('public', fname)
    try:
        with open(path, encoding='utf-8') as f:
            qs = json.load(f)
        all_questions.update({q['id']: q for q in qs})
        domain_nums = set(q['domain'] for q in qs)
        print('  [OK  ] {}: {} questions, domains={}'.format(fname, len(qs), domain_nums))
    except FileNotFoundError:
        errors.append('MISSING: ' + path)
        print('  [MISS] ' + fname)

print('  Total questions loaded: {}'.format(len(all_questions)))
if len(all_questions) != declared_q_count:
    errors.append('Question count mismatch: declared={}, actual={}'.format(declared_q_count, len(all_questions)))
    print('  [FAIL] Count mismatch: declared={}, actual={}'.format(declared_q_count, len(all_questions)))
else:
    print('  [OK  ] Count matches declared ({})'.format(declared_q_count))

# 3. Validate question schema
print()
print('=== Question Schema Validation ===')
schema_errors = 0
for qid, q in all_questions.items():
    for field in ['id', 'domain', 'difficulty', 'type', 'question', 'options', 'correct', 'explanation']:
        if field not in q:
            errors.append('{}: missing field {}'.format(qid, field))
            schema_errors += 1
    if len(q.get('options', [])) < 4:
        errors.append('{}: fewer than 4 options'.format(qid))
        schema_errors += 1
    correct = q.get('correct', -1)
    opts_len = len(q.get('options', []))
    if correct not in range(opts_len):
        errors.append('{}: correct index {} out of range (options={})'.format(qid, correct, opts_len))
        schema_errors += 1
    if not qid.startswith('ghc-d'):
        errors.append('{}: unexpected ID format'.format(qid))
        schema_errors += 1

if schema_errors == 0:
    print('  [OK  ] All {} questions pass schema validation'.format(len(all_questions)))
else:
    print('  [FAIL] {} schema error(s)'.format(schema_errors))

# 4. Duplicate ID check
print()
print('=== Duplicate ID Check ===')
ids_list = list(all_questions.keys())
dupes = list(set(x for x in ids_list if ids_list.count(x) > 1))
if dupes:
    errors.append('Duplicate IDs: ' + str(dupes))
    print('  [FAIL] Duplicates: ' + str(dupes))
else:
    print('  [OK  ] No duplicate IDs across {} questions'.format(len(ids_list)))

# 5. Domain coverage
print()
print('=== Domain Coverage (25 per domain expected) ===')
domain_counts = {}
for q in all_questions.values():
    d = q['domain']
    domain_counts[d] = domain_counts.get(d, 0) + 1
for d in range(1, 7):
    count = domain_counts.get(d, 0)
    status = 'OK  ' if count == 25 else 'WARN'
    if count != 25:
        warnings.append('Domain {}: {} questions (expected 25)'.format(d, count))
    print('  [{}] Domain {}: {} questions'.format(status, d, count))

# 6. Difficulty distribution
print()
print('=== Difficulty Distribution ===')
diffs = {}
for q in all_questions.values():
    d = q.get('difficulty', 'unknown')
    diffs[d] = diffs.get(d, 0) + 1
total = len(all_questions)
for d, count in sorted(diffs.items()):
    pct = round(count / total * 100)
    print('  {}: {} ({}%)'.format(d, count, pct))

# 7. Scenario files
print()
print('=== Scenario Files ===')
for sfile in declared_scenarios:
    spath = os.path.join('public', sfile)
    try:
        with open(spath, encoding='utf-8') as f:
            s = json.load(f)
        sq_count = len(s.get('questions', []))
        print('  [OK  ] {}: {} questions, domains={}'.format(sfile, sq_count, s.get('domains')))
        for sq in s.get('questions', []):
            for field in ['id', 'question', 'options', 'correct', 'explanation']:
                if field not in sq:
                    errors.append('{}/{}: missing {}'.format(sfile, sq.get('id', '?'), field))
    except FileNotFoundError:
        errors.append('MISSING scenario: ' + sfile)
        print('  [MISS] ' + sfile)

# 8. Notes files
print()
print('=== Notes Files (6 expected) ===')
notes_dir = os.path.join(base, 'notes')
if os.path.exists(notes_dir):
    notes_files = sorted([f for f in os.listdir(notes_dir) if f.endswith('.md')])
    for nf in notes_files:
        path = os.path.join(notes_dir, nf)
        size = os.path.getsize(path)
        status = 'OK  ' if size > 500 else 'WARN'
        print('  [{}] {} ({} bytes)'.format(status, nf, size))
    if len(notes_files) != 6:
        warnings.append('Expected 6 notes files, found {}'.format(len(notes_files)))
else:
    errors.append('Notes directory missing')

# 9. task-statements.json
print()
print('=== task-statements.json ===')
ts_path = os.path.join(base, 'task-statements.json')
with open(ts_path, encoding='utf-8') as f:
    ts = json.load(f)
ts_domains = ts.get('domains', [])
print('  [OK  ] {} domains defined'.format(len(ts_domains)))
ts_qids = []
for d in ts_domains:
    for task in d.get('tasks', []):
        ts_qids.extend(task.get('questionIds', []))
missing_in_ts = [qid for qid in ts_qids if qid not in all_questions]
if missing_in_ts:
    errors.append('task-statements references missing IDs: ' + str(missing_in_ts))
    print('  [FAIL] {} unresolved question ID(s) in task-statements'.format(len(missing_in_ts)))
else:
    print('  [OK  ] All {} question ID references resolve'.format(len(ts_qids)))

# 10. PR #183 branch check
print()
print('=== Summary ===')
print('  Questions:  {}'.format(len(all_questions)))
print('  Domains:    {}'.format(len(domain_counts)))
print('  Scenarios:  {}'.format(len(declared_scenarios)))
print('  Notes:      {}'.format(len(notes_files) if os.path.exists(notes_dir) else 0))

print()
if errors:
    print('ERRORS ({}):'.format(len(errors)))
    for e in errors:
        print('  [FAIL] ' + e)
if warnings:
    print('WARNINGS ({}):'.format(len(warnings)))
    for w in warnings:
        print('  [WARN] ' + w)

print()
if errors:
    print('RESULT: FAIL')
    sys.exit(1)
else:
    print('RESULT: PASS - GH-300 content is valid')
