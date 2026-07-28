"""
Fix gh300 questions where OCR wrapped option text across multiple lines,
creating split entries that should be joined.
Each fix is explicit: merge indices + (optionally) set the new correct index.
"""
import json, glob

# Map: question_id -> list of merge groups
# Each group is a list of current indices that form one option.
# Groups are in order A, B, C, D, (E if present).
# correct_new: new 0-based index after merge (None = same as current, since
#              the correct option is now at a different position only when
#              the split changes its position).
FIXES = {
    "gh300-d1-034": {
        "groups": [[0], [1, 2], [3, 4], [5]],
        "correct_new": 1,   # B unchanged
    },
    "gh300-d2-023": {
        "groups": [[0], [1, 2], [3], [4, 5], [6]],
        "correct_new": 0,   # A unchanged
    },
    "gh300-d3-003": {
        "groups": [[0, 1], [2], [3, 4], [5, 6]],
        "correct_new": 3,   # D = last group = index 3
    },
    "gh300-d3-005": {
        "groups": [[0, 1], [2], [3, 4], [5, 6]],
        "correct_new": 1,   # B = group index 1 (was split-index 2)
    },
    "gh300-d3-015": {
        "groups": [[0, 1], [2], [3], [4, 5]],
        "correct_new": 0,   # A = first group (was split-index 0)
    },
    "gh300-d3-016": {
        "groups": [[0, 1], [2], [3], [4, 5]],
        "correct_new": 3,   # D = last group (was split-index 3 = C, now D after merge)
    },
    "gh300-d3-026": {
        "groups": [[0, 1], [2, 3], [4, 5], [6, 7]],
        "correct_new": 0,   # A = first group
    },
    "gh300-d4-013": {
        "groups": [[0], [1, 2], [3, 4], [5]],
        "correct_new": 0,   # A unchanged
    },
}

fixed_count = 0

for f in sorted(glob.glob(
    "C:/Users/ajeet.k.chouksey/Documents/Code/ajch_platform/public/content/questions/gh300-domain*.json"
)):
    fname = f.replace("\\", "/").split("/")[-1]
    with open(f, encoding="utf-8") as fp:
        qs = json.load(fp)

    changed = False
    for q in qs:
        qid = q["id"]
        if qid not in FIXES:
            continue
        fix = FIXES[qid]
        old_opts = q["options"]
        new_opts = []
        for group in fix["groups"]:
            merged = " ".join(old_opts[i].strip() for i in group).strip()
            new_opts.append(merged)

        old_correct = q["correct"]
        new_correct = fix["correct_new"]

        print(f"[{qid}]")
        print(f"  Options: {len(old_opts)} -> {len(new_opts)}")
        print(f"  correct: {old_correct} -> {new_correct}")
        for i, o in enumerate(new_opts):
            marker = " *CORRECT*" if i == new_correct else ""
            print(f"  {i}({chr(65+i)}): {o[:90]}{marker}")
        print()

        q["options"] = new_opts
        q["correct"] = new_correct
        changed = True
        fixed_count += 1

    if changed:
        with open(f, "w", encoding="utf-8") as fp:
            json.dump(qs, fp, indent=2, ensure_ascii=False)
        print(f"  -> Saved {fname}")
        print()

print(f"Fixed {fixed_count} questions.")
