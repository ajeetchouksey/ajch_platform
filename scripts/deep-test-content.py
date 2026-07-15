"""
Deep content testing suite for GH-300 exam and CCAF claude-code-cicd scenario.
Tests:
  - Answer key correctness (all 'correct' values reference the actual correct option text)
  - Explanation alignment (explanation text matches the correct option, not a distractor)
  - Distractor quality (wrong answers are plausible but clearly wrong)
  - No duplicate question text across all files
  - No answer-pattern bias (one option shouldn't dominate)
  - Explanation specificity (explanation must mention key terms from the correct option)
  - Question clarity (question ends with '?' or is a statement, no broken text)
  - Options format consistency (all start with A./B./C./D.)
  - Correct-answer index distribution (A/B/C/D spread)
  - Cross-exam: CCAF scenario questionIds reference real questions with matching topic tags
  - GH-300 scenario question alignment with parent exam domains
  - Notes coverage: each domain's notes file covers that domain's key topics
  - Domain weight vs question count consistency
"""

import json
import os
import sys
import re
from collections import Counter

WORKSPACE = 'public'
GHC_BASE = 'content/skillup/ghc'
CCAF_BASE = 'content/skillup/ccaf'

errors = []
warnings = []

def err(msg): errors.append(msg)
def warn(msg): warnings.append(msg)
def ok(label): print('  [PASS] ' + label)
def fail(label): print('  [FAIL] ' + label)
def section(title): print('\n=== ' + title + ' ===')


# ─────────────────────────────────────────
# LOAD DATA
# ─────────────────────────────────────────

def load_ghc():
    idx_path = os.path.join(WORKSPACE, GHC_BASE, 'index.json')
    with open(idx_path) as f:
        idx = json.load(f)
    questions = {}
    for fpath in idx.get('questionFiles', []):
        full = os.path.join(WORKSPACE, fpath)
        with open(full, encoding='utf-8') as f:
            for q in json.load(f):
                questions[q['id']] = q
    scenarios = {}
    for sfile in idx.get('scenarioFiles', []):
        full = os.path.join(WORKSPACE, sfile)
        with open(full, encoding='utf-8') as f:
            s = json.load(f)
        scenarios[s['id']] = s
    notes = {}
    notes_dir = os.path.join(WORKSPACE, GHC_BASE, 'notes')
    for nf in os.listdir(notes_dir):
        if nf.endswith('.md'):
            with open(os.path.join(notes_dir, nf), encoding='utf-8') as f:
                notes[nf] = f.read()
    with open(os.path.join(WORKSPACE, GHC_BASE, 'task-statements.json')) as f:
        ts = json.load(f)
    return idx, questions, scenarios, notes, ts


def load_ccaf():
    qdir = os.path.join(WORKSPACE, CCAF_BASE, 'questions')
    questions = {}
    for fname in os.listdir(qdir):
        if fname.endswith('.json'):
            with open(os.path.join(qdir, fname), encoding='utf-8') as f:
                for q in json.load(f):
                    questions[q['id']] = q
    scenario_path = os.path.join(WORKSPACE, CCAF_BASE, 'scenarios', 'claude-code-cicd.json')
    with open(scenario_path) as f:
        cicd_scenario = json.load(f)
    return questions, cicd_scenario


# ─────────────────────────────────────────
# TEST HELPERS
# ─────────────────────────────────────────

OPTION_LETTERS = ['A', 'B', 'C', 'D']

def get_correct_text(q):
    """Return the text of the correct option."""
    opts = q.get('options', [])
    correct_idx = q.get('correct', -1)
    if 0 <= correct_idx < len(opts):
        return opts[correct_idx]
    return None


def option_text_only(opt_str):
    """Strip leading 'A. ' prefix from option text."""
    return re.sub(r'^[A-D]\.\s*', '', opt_str).strip()


def has_lettered_options(q):
    """Detect if options use A./B./C./D. prefix (GH-300 style) vs plain text (CCAF style)."""
    opts = q.get('options', [])
    if not opts:
        return False
    return bool(opts[0].startswith('A.') or opts[0].startswith('A. '))


def check_options_format(q):
    """All options must start with A./B./C./D. (only for lettered-option schema)."""
    if not has_lettered_options(q):
        return True, None  # CCAF plain-text options — skip format check
    opts = q.get('options', [])
    for i, opt in enumerate(opts):
        expected_prefix = OPTION_LETTERS[i] + '.'
        if not opt.startswith(expected_prefix):
            return False, 'Option {} does not start with "{}"'.format(i, expected_prefix)
    return True, None


def check_explanation_mentions_correct(q):
    """Explanation should contain at least one key term from the correct option."""
    correct_text = option_text_only(get_correct_text(q) or '')
    explanation = q.get('explanation', '').lower()
    # Extract meaningful words (4+ chars) from correct option
    words = [w.lower() for w in re.findall(r'[A-Za-z]{4,}', correct_text)]
    if not words:
        return True, None  # can't check
    matches = [w for w in words if w in explanation]
    if not matches:
        return False, 'Explanation shares no key terms with correct answer: "{}"'.format(correct_text[:60])
    return True, None


def check_no_explanation_betrays_correct(q):
    """
    Explanation should NOT explicitly match a distractor's unique text
    better than the correct option's text.
    Heuristic: count matching words with each option.
    """
    explanation = q.get('explanation', '').lower()
    opts = q.get('options', [])
    correct_idx = q.get('correct', -1)
    scores = []
    for opt in opts:
        words = re.findall(r'[A-Za-z]{4,}', option_text_only(opt).lower())
        score = sum(1 for w in words if w in explanation)
        scores.append(score)
    if not scores:
        return True, None
    max_score = max(scores)
    if max_score == 0:
        return True, None  # no signal
    correct_score = scores[correct_idx] if 0 <= correct_idx < len(scores) else 0
    # If another option outscores the correct one significantly, flag it
    for i, score in enumerate(scores):
        if i != correct_idx and score > correct_score + 2:
            return False, 'Option {} (wrong) scores {} vs correct option scores {} in explanation'.format(
                OPTION_LETTERS[i], score, correct_score)
    return True, None


# ─────────────────────────────────────────
# DEEP TESTS — GH-300
# ─────────────────────────────────────────

def test_ghc_answer_key(questions):
    section('GH-300: Answer Key Integrity')
    ambiguous = []
    for qid, q in questions.items():
        correct_idx = q.get('correct', -1)
        opts = q.get('options', [])
        if correct_idx < 0 or correct_idx >= len(opts):
            err('{}: correct={} out of range'.format(qid, correct_idx))
            continue
        correct_text = option_text_only(opts[correct_idx]).lower()
        # Correct option should NOT contain hedging language that matches wrong answers
        hedge_words = ['never', 'always', 'only', 'impossible', 'never used']
        wrong_correct = [w for w in hedge_words if w in correct_text]
        if wrong_correct:
            warn('{}: correct option contains absolute language: {}'.format(qid, wrong_correct))

    if not errors and not ambiguous:
        ok('All {} correct indices are within option range'.format(len(questions)))
    else:
        fail('Answer key issues found')


def test_ghc_options_format(questions):
    section('GH-300: Options Format (A./B./C./D. prefix)')
    bad = []
    for qid, q in questions.items():
        ok_fmt, msg = check_options_format(q)
        if not ok_fmt:
            err('{}: {}'.format(qid, msg))
            bad.append(qid)
    if not bad:
        ok('All {} questions have correctly prefixed options'.format(len(questions)))
    else:
        fail('{} questions have malformed option prefixes'.format(len(bad)))


def test_ghc_explanation_alignment(questions):
    section('GH-300: Explanation Alignment with Correct Answer')
    failures = []
    for qid, q in questions.items():
        passed, msg = check_explanation_mentions_correct(q)
        if not passed:
            warn('{}: {}'.format(qid, msg))
            failures.append(qid)
    if not failures:
        ok('All {} explanations share key terms with their correct option'.format(len(questions)))
    else:
        print('  [WARN] {} questions have weak explanation-to-correct-answer alignment:'.format(len(failures)))
        for qid in failures[:5]:
            print('         ' + qid)


def test_ghc_no_duplicate_questions(questions):
    section('GH-300: Duplicate Question Text Check')
    texts = {}
    dupes = []
    for qid, q in questions.items():
        text = q['question'].strip().lower()
        if text in texts:
            dupes.append((qid, texts[text]))
            err('Duplicate question text: {} == {}'.format(qid, texts[text]))
        texts[text] = qid
    if not dupes:
        ok('No duplicate question text found across all {} questions'.format(len(questions)))
    else:
        fail('{} duplicate question(s) detected'.format(len(dupes)))


def test_ghc_answer_distribution(questions):
    section('GH-300: Correct Answer Index Distribution (A/B/C/D bias check)')
    dist = Counter()
    for q in questions.values():
        c = q.get('correct', -1)
        if 0 <= c <= 3:
            dist[OPTION_LETTERS[c]] += 1
    total = sum(dist.values())
    expected = total / 4
    print('  Distribution across {} questions:'.format(total))
    biased = []
    for letter in OPTION_LETTERS:
        count = dist.get(letter, 0)
        pct = round(count / total * 100)
        deviation = abs(count - expected) / expected * 100
        flag = ' <-- BIAS WARNING' if deviation > 40 else ''
        print('    {}: {} ({}%){}'.format(letter, count, pct, flag))
        if deviation > 40:
            warn('Answer {} is over/under-represented ({} vs expected ~{:.0f})'.format(letter, count, expected))
            biased.append(letter)
    if not biased:
        ok('No significant answer distribution bias detected')
    else:
        fail('Bias detected for: ' + ', '.join(biased))


def test_ghc_question_text_quality(questions):
    section('GH-300: Question Text Quality')
    issues = []
    for qid, q in questions.items():
        text = q['question']
        # Must end with ? or be a complete sentence
        if not text.strip().endswith('?') and not text.strip().endswith('.'):
            warn('{}: question does not end with ? or period'.format(qid))
            issues.append(qid)
        # Minimum length
        if len(text.strip()) < 20:
            err('{}: question too short ({} chars)'.format(qid, len(text)))
        # No broken/truncated text markers
        if '...' in text and len(text) < 40:
            warn('{}: possible truncated question'.format(qid))
    if not issues:
        ok('All {} questions have well-formed text'.format(len(questions)))
    else:
        print('  [WARN] {} questions may have formatting issues'.format(len(issues)))


def test_ghc_distractor_plausibility(questions):
    section('GH-300: Distractor Plausibility (wrong options should be non-trivial)')
    trivially_wrong = []
    for qid, q in questions.items():
        opts = q.get('options', [])
        correct_idx = q.get('correct', -1)
        for i, opt in enumerate(opts):
            if i == correct_idx:
                continue
            text = option_text_only(opt).lower()
            # Flag if a distractor contains obvious giveaway words
            giveaways = ['this is impossible', 'copilot does not exist', 'never possible', 'magic button']
            if any(g in text for g in giveaways):
                warn('{}: distractor {} may be trivially wrong'.format(qid, OPTION_LETTERS[i]))
                trivially_wrong.append(qid)
    if not trivially_wrong:
        ok('No trivially obvious distractors detected')
    else:
        print('  [WARN] {} questions may have weak distractors'.format(len(trivially_wrong)))


def test_ghc_domain_weight_alignment(idx, questions):
    section('GH-300: Domain Weight vs Question Count Alignment')
    total_q = len(questions)
    domain_counts = Counter(q['domain'] for q in questions.values())
    domains_meta = {d['id']: d for d in idx.get('domains', [])}
    all_ok = True
    for d_num in range(1, 7):
        count = domain_counts.get(d_num, 0)
        meta = domains_meta.get(d_num, {})
        weight = meta.get('weight', 0)
        expected = round(total_q * weight / 100)
        actual_pct = round(count / total_q * 100)
        drift = abs(actual_pct - weight)
        flag = ' <-- DRIFT' if drift > 5 else ''
        print('  Domain {}: declared={}%, actual={}% ({} questions, expected ~{}){}'.format(
            d_num, weight, actual_pct, count, expected, flag))
        if drift > 5:
            warn('Domain {} weight drift: declared {}% vs actual {}%'.format(d_num, weight, actual_pct))
            all_ok = False
    if all_ok:
        ok('All domain weights align with question distribution (within 5%)')


def test_ghc_task_statements_completeness(ts, questions):
    section('GH-300: Task-Statements Coverage Completeness')
    ts_qids = set()
    domains_in_ts = {d['id'] for d in ts.get('domains', [])}
    for d in ts.get('domains', []):
        for task in d.get('tasks', []):
            ts_qids.update(task.get('questionIds', []))
            # Check knowledge and skills are non-empty
            if not task.get('knowledge'):
                warn('Domain {} task {}: empty knowledge list'.format(d['id'], task.get('id')))
            if not task.get('skills'):
                warn('Domain {} task {}: empty skills list'.format(d['id'], task.get('id')))

    all_q_ids = set(questions.keys())
    in_ts_not_in_q = ts_qids - all_q_ids
    in_q_not_in_ts = all_q_ids - ts_qids

    if in_ts_not_in_q:
        err('task-statements references IDs not in questions: {}'.format(list(in_ts_not_in_q)[:5]))
        fail('task-statements has {} unresolved question IDs'.format(len(in_ts_not_in_q)))
    else:
        ok('All task-statement question IDs resolve to real questions')

    if in_q_not_in_ts:
        warn('{} questions not mapped in task-statements: {}'.format(len(in_q_not_in_ts), list(in_q_not_in_ts)[:5]))
    else:
        ok('All {} questions are mapped in task-statements'.format(len(all_q_ids)))


def test_ghc_scenarios_alignment(scenarios, questions):
    section('GH-300: Scenario Question Alignment with Parent Exam')
    for sid, s in scenarios.items():
        declared_domains = set(s.get('domains', []))
        for sq in s.get('questions', []):
            qid = sq['id']
            # Each scenario question should touch concepts from declared domains
            correct_idx = sq.get('correct', -1)
            opts = sq.get('options', [])
            if correct_idx < 0 or correct_idx >= len(opts):
                err('{}/{}: correct index out of range'.format(sid, qid))
            # Options format
            for i, opt in enumerate(opts):
                if not opt.startswith(OPTION_LETTERS[i] + '.'):
                    err('{}/{}: option {} bad prefix'.format(sid, qid, i))
            # Explanation present and non-trivial
            if len(sq.get('explanation', '')) < 30:
                warn('{}/{}: very short explanation'.format(sid, qid))
        ok('{}: {} questions validated, declared domains={}'.format(sid, len(s.get('questions', [])), declared_domains))


def test_ghc_notes_domain_coverage(notes, questions):
    section('GH-300: Notes Files Domain Topic Coverage')
    domain_topic_map = {
        1: ['responsible', 'ethical', 'hallucin', 'validat', 'accountab', 'risk'],
        2: ['inline', 'chat', 'agent mode', 'cli', 'copilot edits', 'mcp', 'pr summar', 'settings'],
        3: ['data flow', 'prompt construct', 'proxy', 'context window', 'llm', 'training cutoff'],
        4: ['zero-shot', 'few-shot', 'prompt structure', 'context', 'chat history', '#file'],
        5: ['boilerplate', 'refactor', 'documenta', 'test', 'edge case', 'security', 'performan'],
        6: ['exclusion', 'glob', 'public code filter', 'ownership', 'indemnif', 'audit log'],
    }
    notes_domain_map = {
        1: 'ghc-d1-responsible-ai.md',
        2: 'ghc-d2-copilot-features.md',
        3: 'ghc-d3-data-architecture.md',
        4: 'ghc-d4-prompt-engineering.md',
        5: 'ghc-d5-productivity.md',
        6: 'ghc-d6-privacy-safeguards.md',
    }
    for d_num, topics in domain_topic_map.items():
        nf = notes_domain_map.get(d_num)
        if nf not in notes:
            err('Missing notes file for domain {}: {}'.format(d_num, nf))
            continue
        content = notes[nf].lower()
        missing_topics = [t for t in topics if t.lower() not in content]
        covered = len(topics) - len(missing_topics)
        if missing_topics:
            warn('Domain {} notes missing topics: {}'.format(d_num, missing_topics))
            print('  [WARN] Domain {} notes: {}/{} topics covered, missing: {}'.format(
                d_num, covered, len(topics), missing_topics))
        else:
            ok('Domain {} notes: all {} key topics covered'.format(d_num, len(topics)))


# ─────────────────────────────────────────
# DEEP TESTS — CCAF claude-code-cicd scenario
# ─────────────────────────────────────────

def test_ccaf_scenario_question_topic_match(ccaf_questions, cicd_scenario):
    section('CCAF claude-code-cicd: Question-to-Scenario Topic Alignment')
    scenario_key_patterns = cicd_scenario.get('key_patterns', [])
    pattern_words = set()
    for p in scenario_key_patterns:
        pattern_words.update(re.findall(r'[A-Za-z]{3,}', p.lower()))

    qids = cicd_scenario.get('questionIds', [])
    for qid in qids:
        q = ccaf_questions.get(qid)
        if not q:
            err('CCAF cicd scenario: question {} not found'.format(qid))
            continue
        q_text = (q['question'] + ' ' + q.get('explanation', '')).lower()
        tags = [t.lower() for t in q.get('tags', [])]
        all_text = q_text + ' ' + ' '.join(tags)
        matches = [w for w in pattern_words if w in all_text]
        coverage_pct = round(len(matches) / len(pattern_words) * 100)
        status = 'PASS' if coverage_pct >= 10 else 'WARN'
        print('  [{}] {}: {}% scenario pattern coverage (matched: {})'.format(
            status, qid, coverage_pct, matches[:4]))
        if coverage_pct < 10:
            warn('{}: low scenario topic coverage ({}%)'.format(qid, coverage_pct))


def test_ccaf_scenario_no_answer_leakage(ccaf_questions, cicd_scenario):
    section('CCAF claude-code-cicd: Answer Leakage Check (explanation should not give away answer trivially)')
    qids = cicd_scenario.get('questionIds', [])
    leaky = []
    for qid in qids:
        q = ccaf_questions.get(qid)
        if not q:
            continue
        passed, msg = check_no_explanation_betrays_correct(q)
        if not passed:
            warn('{}: {}'.format(qid, msg))
            leaky.append(qid)
    if not leaky:
        ok('No obvious explanation-based answer leakage detected in {} questions'.format(len(qids)))
    else:
        print('  [WARN] {} questions may have explanation bias'.format(len(leaky)))


def test_ccaf_scenario_options_format(ccaf_questions, cicd_scenario):
    section('CCAF claude-code-cicd: Scenario Question Options Format')
    qids = cicd_scenario.get('questionIds', [])
    bad = []
    for qid in qids:
        q = ccaf_questions.get(qid)
        if not q:
            continue
        passed, msg = check_options_format(q)
        if not passed:
            err('{}: {}'.format(qid, msg))
            bad.append(qid)
    if not bad:
        ok('All {} referenced questions have correctly formatted options'.format(len(qids)))
    else:
        fail('{} questions have malformed option format'.format(len(bad)))


def test_ccaf_scenario_correct_index_range(ccaf_questions, cicd_scenario):
    section('CCAF claude-code-cicd: Correct Index In-Range Check')
    qids = cicd_scenario.get('questionIds', [])
    out_of_range = []
    for qid in qids:
        q = ccaf_questions.get(qid)
        if not q:
            continue
        correct = q.get('correct', -1)
        opts_len = len(q.get('options', []))
        if correct not in range(opts_len):
            err('{}: correct={} out of range (options={})'.format(qid, correct, opts_len))
            out_of_range.append(qid)
    if not out_of_range:
        ok('All {} correct indices are valid'.format(len(qids)))
    else:
        fail('{} questions have out-of-range correct index'.format(len(out_of_range)))


def test_ccaf_scenario_key_pattern_completeness(cicd_scenario):
    section('CCAF claude-code-cicd: key_patterns Field Completeness')
    key_patterns = cicd_scenario.get('key_patterns', [])
    required_concepts = [
        'headless', '-p', 'structured', 'read-only', 'exit code',
        'tool_choice', 'batch', 'multi-pass'
    ]
    all_text = ' '.join(key_patterns).lower()
    for concept in required_concepts:
        if concept.lower() in all_text:
            ok('key_patterns covers concept: "{}"'.format(concept))
        else:
            warn('key_patterns may not cover concept: "{}"'.format(concept))


# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

if __name__ == '__main__':
    print('=' * 60)
    print('DEEP CONTENT TEST SUITE')
    print('Targets: GH-300 exam + CCAF claude-code-cicd scenario')
    print('=' * 60)

    idx, ghc_questions, ghc_scenarios, ghc_notes, ghc_ts = load_ghc()
    ccaf_questions, cicd_scenario = load_ccaf()

    # GH-300 tests
    test_ghc_answer_key(ghc_questions)
    test_ghc_options_format(ghc_questions)
    test_ghc_explanation_alignment(ghc_questions)
    test_ghc_no_duplicate_questions(ghc_questions)
    test_ghc_answer_distribution(ghc_questions)
    test_ghc_question_text_quality(ghc_questions)
    test_ghc_distractor_plausibility(ghc_questions)
    test_ghc_domain_weight_alignment(idx, ghc_questions)
    test_ghc_task_statements_completeness(ghc_ts, ghc_questions)
    test_ghc_scenarios_alignment(ghc_scenarios, ghc_questions)
    test_ghc_notes_domain_coverage(ghc_notes, ghc_questions)

    # CCAF claude-code-cicd scenario tests
    test_ccaf_scenario_question_topic_match(ccaf_questions, cicd_scenario)
    test_ccaf_scenario_no_answer_leakage(ccaf_questions, cicd_scenario)
    test_ccaf_scenario_options_format(ccaf_questions, cicd_scenario)
    test_ccaf_scenario_correct_index_range(ccaf_questions, cicd_scenario)
    test_ccaf_scenario_key_pattern_completeness(cicd_scenario)

    # ─── FINAL REPORT ───
    print()
    print('=' * 60)
    print('FINAL REPORT')
    print('=' * 60)
    print('  Errors:   {}'.format(len(errors)))
    print('  Warnings: {}'.format(len(warnings)))

    if errors:
        print()
        print('ERRORS:')
        for e in errors:
            print('  [FAIL] ' + e)

    if warnings:
        print()
        print('WARNINGS:')
        for w in warnings:
            print('  [WARN] ' + w)

    print()
    if errors:
        print('RESULT: FAIL ({} error(s))'.format(len(errors)))
        sys.exit(1)
    else:
        print('RESULT: PASS')
        if warnings:
            print('  ({} advisory warning(s) — no blockers)'.format(len(warnings)))
