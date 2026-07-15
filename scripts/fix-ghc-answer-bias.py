"""
Fix GH-300 correct answer bias.
Target: ~37-38 questions per index (0,1,2,3) across 150 questions.
Current: A(0)=4, B(1)=139, C(2)=7, D(3)=0

Strategy: for questions where correct=1, swap the correct option to a target index
by physically moving the option text (so A/B/C/D letter in the prefix stays
consistent with position) and updating the `correct` field.

The question content and explanation remain unchanged.
"""

import json
import os
import random

random.seed(42)  # deterministic

BASE = 'public/content/skillup/ghc/questions'
TARGET_PER_SLOT = {0: 37, 1: 38, 2: 38, 3: 37}  # must sum to 150

files = sorted(f for f in os.listdir(BASE) if f.endswith('.json'))

# Load all questions preserving file membership
all_files_data = {}
for fname in files:
    with open(os.path.join(BASE, fname)) as f:
        all_files_data[fname] = json.load(f)

# Current distribution
current_dist = {0: [], 1: [], 2: [], 3: []}
for fname, qs in all_files_data.items():
    for i, q in enumerate(qs):
        current_dist[q['correct']].append((fname, i))

print('Before redistribution:')
for idx in range(4):
    print('  index {}: {}'.format(idx, len(current_dist[idx])))

# We need to move questions from index 1 (has 139) to 0, 2, 3
# Target: 0->37, 1->38, 2->38, 3->37
# Need to move from 1: 139-38 = 101 questions
# Destinations: 0 needs 37-4=33 more, 2 needs 38-7=31 more, 3 needs 37-0=37 more
# Total to move: 33+31+37 = 101 ✓

moves_needed = {
    0: TARGET_PER_SLOT[0] - len(current_dist[0]),  # 37-4 = 33
    2: TARGET_PER_SLOT[2] - len(current_dist[2]),  # 38-7 = 31
    3: TARGET_PER_SLOT[3] - len(current_dist[3]),  # 37-0 = 37
}
print('\nMoves needed:')
for dest, count in moves_needed.items():
    print('  move {} questions from index 1 -> index {}'.format(count, dest))

# Build list of candidates to move (all currently at index 1)
candidates = list(current_dist[1])
random.shuffle(candidates)

# Assign moves
to_move = {}  # (fname, q_idx) -> new_correct_index
idx_ptr = 0
for dest_idx, count in moves_needed.items():
    for _ in range(count):
        fname, q_idx = candidates[idx_ptr]
        to_move[(fname, q_idx)] = dest_idx
        idx_ptr += 1

print('\nApplying {} option rotations...'.format(len(to_move)))

# Apply: for each question to move, swap the correct option with target slot
def swap_options(q, current_correct, target_correct):
    """Swap the correct option to the target index position."""
    opts = list(q['options'])
    # Swap option texts (preserving A./B./C./D. prefixes)
    letters = ['A', 'B', 'C', 'D']
    # Extract raw text (strip prefix)
    raw = [o[3:] for o in opts]  # strip "X. " (3 chars)
    # Swap raw texts at current_correct and target_correct
    raw[current_correct], raw[target_correct] = raw[target_correct], raw[current_correct]
    # Rebuild with correct prefixes
    q['options'] = ['{}.  {}'.format(letters[i], raw[i]) for i in range(len(opts))]
    q['correct'] = target_correct
    return q

# Fix the "A. " prefix (our options use "A. " = 3 chars, but let's handle both "A." and "A. ")
def get_raw_text(opt_str):
    import re
    return re.sub(r'^[A-D]\.\s*', '', opt_str)

def rebuild_options(q, current_correct, target_correct):
    opts = q['options']
    raw = [get_raw_text(o) for o in opts]
    raw[current_correct], raw[target_correct] = raw[target_correct], raw[current_correct]
    letters = ['A', 'B', 'C', 'D']
    # Detect original prefix style (with or without space after period)
    import re
    prefix_match = re.match(r'^[A-D](\.\s*)', opts[0])
    sep = prefix_match.group(1) if prefix_match else '. '
    q['options'] = ['{}{}{}'.format(letters[i], sep, raw[i]) for i in range(len(opts))]
    q['correct'] = target_correct
    return q

changed = 0
for fname, qs in all_files_data.items():
    for q_idx, q in enumerate(qs):
        key = (fname, q_idx)
        if key in to_move:
            target = to_move[key]
            current = q['correct']
            rebuild_options(q, current, target)
            changed += 1

print('Applied {} swaps.'.format(changed))

# Verify new distribution
new_dist = {0: 0, 1: 0, 2: 0, 3: 0}
for fname, qs in all_files_data.items():
    for q in qs:
        new_dist[q['correct']] += 1

print('\nAfter redistribution:')
for idx in range(4):
    print('  index {} ({}): {}'.format(idx, 'ABCD'[idx], new_dist[idx]))

# Write back
for fname, qs in all_files_data.items():
    with open(os.path.join(BASE, fname), 'w', encoding='utf-8') as f:
        json.dump(qs, f, indent=2, ensure_ascii=False)

print('\nFiles written. Done.')
