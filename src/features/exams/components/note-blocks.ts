// ── rehype plugin: wrap each study block in a colour-coded card ───────────────
// A study block is a `### Key Concept` / `### Exam Trap` / … heading plus every
// sibling after it up to the next h2/h3. The heading node itself is untouched
// (same position), so the notes TOC and scroll-spy keep working.
import { headingKicker } from './notes-format';

interface HNode { type: string; tagName?: string; value?: string; children?: HNode[]; properties?: Record<string, unknown> }

function text(n: HNode): string {
  if (n.type === 'text') return n.value ?? '';
  return (n.children ?? []).map(text).join('');
}

const elementKids = (n: HNode) => (n.children ?? []).filter((c) => c.type === 'element');

/** Diagrams belong to the section, not to the study block above them. */
function isFigure(n: HNode): boolean {
  if (n.type !== 'element') return false;
  if (n.tagName === 'img' || n.tagName === 'figure') return true;
  const kids = elementKids(n);
  if (n.tagName === 'p') return kids.length === 1 && kids[0].tagName === 'img';
  if (n.tagName === 'pre') {
    const cls = kids[0]?.properties?.className;
    return Array.isArray(cls) && cls.includes('language-mermaid');
  }
  return false;
}

function wrap(children: HNode[]): HNode[] {
  const out: HNode[] = [];
  let block: HNode | null = null;
  for (const n of children) {
    const isHeading = n.type === 'element' && (n.tagName === 'h2' || n.tagName === 'h3' || n.tagName === 'h1');
    if (isHeading) {
      block = null;
      const k = n.tagName === 'h3' ? headingKicker(text(n)) : null;
      if (k) {
        block = { type: 'element', tagName: 'div', properties: { className: ['note-block'], dataKind: k.kicker.kind }, children: [n] };
        out.push(block);
        continue;
      }
    }
    if (block && isFigure(n)) block = null;
    if (block) block.children!.push(n);
    else out.push(n);
  }
  return out;
}

export function rehypeNoteBlocks() {
  return (tree: HNode) => {
    tree.children = wrap(tree.children ?? []);
  };
}
