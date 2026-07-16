import json
import os
import sys

question_dir = 'public/content/skillup/ccaf/questions'
scenario_path = 'public/content/skillup/ccaf/scenarios/claude-code-cicd.json'
target_ids = ['d2-003', 'd2-009', 'd2-010', 'd3-003', 'd3-010', 'd2-017', 'd5-016', 'd1-018']

all_questions = {}
for fname in os.listdir(question_dir):
    if fname.endswith('.json'):
        with open(os.path.join(question_dir, fname)) as f:
            for q in json.load(f):
                all_questions[q['id']] = q

key_patterns = [
    'headless', '-p flag', 'structured', 'read-only',
    'scoped rule', 'exit code', 'tool_choice', 'batch', 'multi-pass', 'ci'
]

print('=== Referenced Question Coverage ===')
for qid in target_ids:
    q = all_questions[qid]
    text = (q['question'] + ' ' + q.get('explanation', '')).lower()
    matched = [p for p in key_patterns if p.lower() in text]
    domain = q.get('domain', '?')
    tags = q.get('tags', [])
    question_text = q['question'][:85]
    print(f"  {qid} [domain={domain}] {question_text}...")
    print(f"         Tags: {tags}")
    if matched:
        print(f"         CI/CD pattern coverage: {matched}")
    print()

domains = {}
for qid in target_ids:
    d = all_questions[qid].get('domain', '?')
    domains[d] = domains.get(d, 0) + 1

print('=== Domain Distribution ===')
for d, count in sorted(domains.items()):
    print(f"  Domain {d}: {count} question(s)")

print('\n=== Key Pattern Coverage Check ===')
all_text = ' '.join(
    all_questions[qid]['question'] + ' ' + all_questions[qid].get('explanation', '')
    for qid in target_ids
).lower()

required_for_scenario = [
    ('-p flag / headless mode', ['headless', '-p']),
    ('structured/JSON output', ['json', 'structured']),
    ('read-only permissions', ['read-only', 'readonly', 'permission']),
    ('exit codes', ['exit code', 'exit_code']),
    ('CI automation (no human)', ['ci', 'pipeline', 'automat']),
]

all_pass = True
for label, terms in required_for_scenario:
    covered = any(t in all_text for t in terms)
    status = 'PASS' if covered else 'FAIL'
    if not covered:
        all_pass = False
    print(f"  [{status}] {label}")

print()
if all_pass:
    print("RESULT: All scenario key patterns are covered by the referenced questions.")
else:
    print("RESULT: Some scenario patterns are NOT covered — consider adding questions.")
    sys.exit(1)
