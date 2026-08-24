## Accessibility Audit: aaryaai.dev (homepage)
**Standard:** WCAG 2.1 AA | **Date:** August 23, 2026

**Method:** Live inspection of the deployed site (not the source code) via browser automation — computed-style contrast checks (canvas-normalized, so this covers `oklch`/`oklab` colors correctly, not just `rgb()`), a DOM/accessibility-tree pass for landmarks, labels, and heading order, and a keyboard spot-check. I did not run a live screen reader (VoiceOver/NVDA) — findings about what assistive tech would announce are inferred from the accessible-name/landmark structure, not confirmed by ear. A viewport-resize attempt to test 200% zoom reflow didn't actually take effect in the tool, so that item is flagged as unverified rather than tested.

### Summary
**Issues found:** 6 | **Critical:** 0 | **Major:** 4 | **Minor:** 2

### Findings

#### Perceivable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | Five `<nav>` landmarks on the page, none with a distinguishing `aria-label` — a screen reader user browsing by landmark hears "navigation" five times with no way to tell the top nav from the sidebar sections | 1.3.1 Info and Relationships | 🟢 Minor | Add `aria-label` to each, e.g. `aria-label="Primary"`, `aria-label="Skill Up sections"`, `aria-label="Footer"` |
| 2 | Three `<h3>` elements appear in the DOM before the page's own `<h1>` (heading sequence starts `h3, h3, h3, h1, h2, ...`) — likely off-screen/decorative content or a component mounted above the hero. Not a level-skip, but heading-order navigation (a real screen-reader workflow) hits unintroduced h3 content before the page has been announced | 1.3.1 Info and Relationships | 🟢 Minor | Check what's producing those early h3s (a hidden component, SEO text, or similar) and either demote them to non-heading markup or move them after the `h1` |
| 3 | Reflow at 200% zoom not verified — the app uses a fixed-viewport shell (`html`/`body` set `overflow: hidden`, with `<main>` handling its own internal scroll). That pattern isn't inherently broken (it correctly delegates scroll to `<main overflow-y-auto>`, confirmed by inspection), but this class of layout is a common place for 1.4.10 failures at 200% zoom or narrow viewports, and I wasn't able to actually verify it here | 1.4.10 Reflow | 🟡 Major (unverified — flagging the pattern, not a confirmed break) | Manually test at 200% browser zoom: confirm no horizontal scrolling is needed and the sidebar/nav doesn't trap content off-screen |

#### Operable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | No skip-to-content link. The first focusable element leads a keyboard user through the full header (9 nav items, search, "Rate this," Login) before reaching `<main>` — on every single page | 2.4.1 Bypass Blocks | 🟡 Major | Add a visually-hidden-until-focused `<a href="#main">Skip to content</a>` as the first element in `<body>`, and an `id="main"` on the `<main>` element |

#### Understandable
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | The newsletter signup field (`placeholder="your@email.com"`) has no `<label>`, `aria-label`, or `aria-labelledby` — a screen reader announces it only as "edit text," with no indication it's for email or what it's for once text is typed and the placeholder disappears | 3.3.2 Labels or Instructions | 🟡 Major | Add `aria-label="Email address"` at minimum, or a visible `<label>` (can be visually styled to match the current look) |

#### Robust
| # | Issue | WCAG Criterion | Severity | Recommendation |
|---|-------|---------------|----------|----------------|
| 1 | The icon-only header button for GitHub token login exposes its name only via the `title` attribute (`title="Login with Personal Access Token"`), not `aria-label`. `title` isn't reliably read by assistive tech and never triggers on touch, so mobile and many screen-reader users get an unnamed button | 4.1.2 Name, Role, Value | 🟡 Major | Add `aria-label="Login with Personal Access Token"` alongside (or instead of) the `title` |

### Color Contrast Check
Sampled against actual rendered colors (canvas-normalized from computed `oklch`/`oklab` values, not guessed from source). Everything sampled passes comfortably — no contrast violations found in this pass:

| Element | Foreground | Effective background | Ratio | Required | Pass? |
|---------|-----------|------------|-------|----------|-------|
| Body text | `oklch(0.968 0.007 247.9)` (~white) | `rgb(14,26,45)` | 15.92:1 | 4.5:1 | ✅ |
| H1 | `#ffffff` | `rgb(14,26,45)` | 17.44:1 | 4.5:1 (large text: 3:1) | ✅ |
| Paragraph text | `oklch(0.869 0.022 252.9)` | `rgb(14,26,45)` | 11.73:1 | 4.5:1 | ✅ |
| Nav links | `#ffffff` | `oklab(0.279 …/0.75)` (header bar) | 14.62:1 | 4.5:1 | ✅ |
| Generic links | `oklch(0.968 …)` | header bar | 13.34:1 | 4.5:1 | ✅ |
| Buttons (default) | `oklch(0.704 0.04 256.8)` (slate-ish) | header bar | 5.56:1 | 4.5:1 | ✅ (closest margin of the set — worth re-checking if this token is reused on a lighter surface elsewhere) |
| Footer text | `oklch(0.968 …)` | `rgb(14,26,45)` | 15.92:1 | 4.5:1 | ✅ |

This was a homepage-only sample of common tokens — it's a good sign for the design system generally, but doesn't cover every page (blog prose highlight colors, study-note callouts, and code blocks use additional custom colors defined in `index.css` that weren't rendered on this page to sample directly).

### Keyboard Navigation
| Element | Tab Order | Focus visible | Notes |
|---------|-----------|-------------|--------|
| Header nav ("Use Cases", 6th tab stop) | Sequential, logical | ✅ Visible outline box appeared around the link | Spot check only — a full walk through every interactive element, dropdown, and the mobile drawer wasn't done |

Not tested: whether any component traps focus incorrectly (e.g. a modal), and whether Escape/arrow-key behavior is correct on dropdowns — worth a manual pass if any of the nav items open menus.

### Screen Reader
Not tested with live assistive technology. Based on the accessible-name/landmark analysis above: the unlabeled `<nav>` elements and the two unnamed form controls (email input, login button) are the parts most likely to sound broken or confusing in VoiceOver/NVDA — everything else structurally (single `h1`, `lang="en"` set, both images on the homepage have `alt` text, proper `header`/`main`/`footer` landmarks present) should read reasonably well.

### Priority Fixes
1. **Add `aria-label` to the icon-only login button and the email signup input** — these are the two places a screen reader user is currently given no way to know what a control does; both are one-line fixes.
2. **Add a skip-to-content link** — affects every keyboard user, every page load; currently the only way past the header is tabbing through all of it.
3. **Verify 200% zoom/reflow manually** — the fixed-viewport shell pattern isn't a confirmed problem, but it's worth five minutes in a real browser to rule out, since this pattern is a common AA failure point.
4. **Label the five `<nav>` landmarks and fix the pre-`<h1>` heading order** — lower impact, but cheap to fix once located, and both make landmark/heading-based navigation (a core screen-reader workflow) noticeably better.
