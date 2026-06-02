# Contributing to Aarya — My AI Learning Hub

Thank you for helping make this platform better for everyone studying for AI certifications!

## Ways to Contribute

| Contribution type | How |
|---|---|
| New exam question | Use the [Contribute a Question](https://aaryaai.dev/contribute) form |
| Bug report | [Open an issue](https://github.com/ajeetchouksey/ajch_platform/issues/new?template=bug_report.md) |
| Suggest a feature | [Open a discussion](https://github.com/ajeetchouksey/ajch_platform/discussions) |
| Fix a typo / improve notes | Edit the `.md` file in `public/content/notes/` and open a PR |
| Add a blog post | Read the [Content Schema docs](https://aaryaai.dev/docs) first |

---

## Question Submission Workflow

1. Go to [aaryaai.dev/contribute](https://aaryaai.dev/contribute)
2. Fill in the form — exam, domain, question text, four options, correct answer, explanation, tags
3. Click **Open Draft PR** — this opens a pre-filled GitHub issue for maintainer review
4. A maintainer (or the Curriculum Engineer agent) will validate the question against the exam blueprint, check for duplicates, and either merge or provide feedback

### Question Quality Bar

- Question must map to a real exam domain objective
- Exactly one correct answer (unambiguous)
- Distractors must be plausible (not obviously wrong)
- Explanation must cite a source or reference (doc link preferred)
- No copy-paste from copyrighted materials

### Question JSON Schema

Questions land in `public/content/questions/<exam-id>/`. Each file must validate against the schema at `src/types/content.ts` (`Question` interface):

```jsonc
{
  "id": "ccaf-d1-0042",          // <exam>-d<domain>-<4-digit-seq>
  "domain": 1,                   // 1-indexed domain number
  "text": "Which of the following...",
  "options": ["A…", "B…", "C…", "D…"],
  "answer": 2,                   // 0-indexed correct option
  "explanation": "C is correct because…",
  "tags": ["agentic", "tool-use"],
  "difficulty": "medium"         // easy | medium | hard
}
```

---

## Setting Up Locally

```bash
git clone https://github.com/ajeetchouksey/ajch_platform.git
cd ajch_platform
npm install
npm run dev
```

Vite dev server starts at `http://localhost:5173`.

## Commit Convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add X
fix: correct Y
docs: update contributing guide
chore: bump dependency
style: formatting
```

## Code of Conduct

Be kind, be constructive. See [GitHub's Community Guidelines](https://docs.github.com/en/site-policy/github-terms/github-community-guidelines).
