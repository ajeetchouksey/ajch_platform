import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Layers, Copy, Check } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Strategy = 'fixed' | 'sentence' | 'paragraph' | 'recursive';

// ─── Chunk colours (8-cycle) ──────────────────────────────────────────────────

const PALETTE = [
  { bg: 'rgba(139,92,246,0.18)',  border: 'rgba(139,92,246,0.35)',  text: '#c4b5fd' },
  { bg: 'rgba(59,130,246,0.18)',  border: 'rgba(59,130,246,0.35)',  text: '#93c5fd' },
  { bg: 'rgba(16,185,129,0.18)',  border: 'rgba(16,185,129,0.35)',  text: '#6ee7b7' },
  { bg: 'rgba(245,158,11,0.18)',  border: 'rgba(245,158,11,0.35)',  text: '#fcd34d' },
  { bg: 'rgba(244,63,94,0.18)',   border: 'rgba(244,63,94,0.35)',   text: '#fda4af' },
  { bg: 'rgba(6,182,212,0.18)',   border: 'rgba(6,182,212,0.35)',   text: '#67e8f9' },
  { bg: 'rgba(249,115,22,0.18)',  border: 'rgba(249,115,22,0.35)',  text: '#fdba74' },
  { bg: 'rgba(168,85,247,0.18)',  border: 'rgba(168,85,247,0.35)', text: '#d8b4fe' },
];

const SAMPLE_TEXT = `Retrieval-Augmented Generation (RAG) is a technique that combines the parametric knowledge of a large language model with non-parametric retrieval from an external knowledge base.

The basic pipeline works as follows: when a user submits a query, it is first converted into a vector embedding. This embedding is then used to search a vector database for the most semantically similar document chunks.

The retrieved chunks are injected into the model's context window alongside the original query. The language model then synthesises a response grounded in the retrieved evidence, reducing hallucination and enabling up-to-date answers beyond the model's training cutoff.

Chunking strategy is a critical design decision. Poorly sized chunks lead to context fragmentation — the answer spans two chunks and neither is retrieved. Over-sized chunks waste context budget and introduce irrelevant noise. The optimal chunk size depends on your embedding model, retrieval task, and downstream context window.`;

// ─── Chunkers ────────────────────────────────────────────────────────────────

function chunkFixed(text: string, size: number, overlap: number): string[] {
  const step = Math.max(1, size - overlap);
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + size));
    if (i + size >= text.length) break;
    i += step;
  }
  return chunks.filter(Boolean);
}

function chunkSentence(text: string, size: number, overlapChars: number): string[] {
  const sentences = text.match(/[^.!?\n]+[.!?]+["']?|\n+|[^.!?\n]+$/g) ?? [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current.length + s.length > size && current.trim()) {
      chunks.push(current.trim());
      current = overlapChars > 0 ? current.slice(-overlapChars) + s : s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function chunkParagraph(text: string, size: number): string[] {
  const paras = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = '';
  for (const p of paras) {
    const candidate = current ? current + '\n\n' + p : p;
    if (candidate.length > size && current) {
      chunks.push(current);
      current = p;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function chunkRecursive(text: string, size: number, overlapChars: number, seps: string[]): string[] {
  if (text.length <= size) return [text];
  if (seps.length === 0) return chunkFixed(text, size, overlapChars);
  const sep = seps[0];
  const parts = sep ? text.split(sep) : [];
  if (parts.length <= 1) return chunkRecursive(text, size, overlapChars, seps.slice(1));
  const result: string[] = [];
  let current = '';
  for (const part of parts) {
    const candidate = current ? current + sep + part : part;
    if (candidate.length > size && current.trim()) {
      if (current.length > size) {
        result.push(...chunkRecursive(current, size, overlapChars, seps.slice(1)));
      } else {
        result.push(current.trim());
      }
      current = overlapChars > 0 ? current.slice(-overlapChars) + sep + part : part;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) {
    if (current.length > size) {
      result.push(...chunkRecursive(current, size, overlapChars, seps.slice(1)));
    } else {
      result.push(current.trim());
    }
  }
  return result.filter(Boolean);
}

function buildChunks(text: string, strategy: Strategy, size: number, overlap: number): string[] {
  if (!text.trim()) return [];
  const overlapChars = Math.floor(size * overlap / 100);
  switch (strategy) {
    case 'fixed':     return chunkFixed(text, size, overlapChars);
    case 'sentence':  return chunkSentence(text, size, overlapChars);
    case 'paragraph': return chunkParagraph(text, size);
    case 'recursive': return chunkRecursive(text, size, overlapChars, ['\n\n', '\n', '. ', ' ']);
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      className="p-1.5 rounded-md transition-colors hover:bg-slate-700/60 text-slate-500 hover:text-slate-300"
      title="Copy chunk"
    >
      {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STRATEGIES: { value: Strategy; label: string; desc: string }[] = [
  { value: 'fixed',     label: 'Fixed-size',  desc: 'Split at a fixed character count with optional overlap.' },
  { value: 'sentence',  label: 'Sentence',    desc: 'Split at sentence boundaries, grouping up to max size.' },
  { value: 'paragraph', label: 'Paragraph',   desc: 'Group paragraphs (\\n\\n splits) up to max size.' },
  { value: 'recursive', label: 'Recursive',   desc: 'Try \\n\\n → \\n → sentence → word until within max size.' },
];

export default function RagChunkVisualizer() {
  const [text, setText]         = useState(SAMPLE_TEXT);
  const [strategy, setStrategy] = useState<Strategy>('fixed');
  const [size, setSize]         = useState(400);
  const [overlap, setOverlap]   = useState(10);

  const chunks = useMemo(
    () => buildChunks(text, strategy, size, overlap),
    [text, strategy, size, overlap],
  );

  const stats = useMemo(() => {
    if (!chunks.length) return null;
    const lens = chunks.map(c => c.length);
    return {
      count: chunks.length,
      total: text.length,
      avg: Math.round(lens.reduce((a, b) => a + b, 0) / lens.length),
      min: Math.min(...lens),
      max: Math.max(...lens),
    };
  }, [chunks, text]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-slate-500">
        <Link to="/tools" className="hover:text-slate-300 transition-colors">Tools</Link>
        <ChevronRight size={14} />
        <span className="text-slate-300">RAG Chunk Visualizer</span>
      </nav>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.30)' }}>
          <Layers size={20} style={{ color: '#60a5fa' }} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">RAG Chunk Visualizer</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            See how chunking strategies split your text — compare fixed-size, sentence, paragraph, and recursive splitting.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        {/* Left — text input */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Input Text
            </label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={10}
              placeholder="Paste your document here…"
              className="w-full rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3 text-sm text-slate-300
                focus:outline-none focus:border-blue-500/50 transition-colors resize-none font-mono leading-relaxed"
            />
            <p className="text-[10px] text-slate-600 mt-1">{text.length.toLocaleString()} characters</p>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Chunks',    value: stats.count },
                { label: 'Avg size',  value: `${stats.avg}c` },
                { label: 'Min size',  value: `${stats.min}c` },
                { label: 'Max size',  value: `${stats.max}c` },
                { label: 'Coverage',  value: `${Math.round(chunks.join('').length / stats.total * 100)}%` },
              ].map(s => (
                <div key={s.label} className="rounded-lg px-3 py-2.5 text-center"
                  style={{ background: 'rgba(30,41,59,0.7)', border: '1px solid rgba(71,85,105,0.3)' }}>
                  <p className="text-base font-black text-white">{s.value}</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Chunks */}
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Chunks ({chunks.length})
            </label>
            {chunks.length === 0 ? (
              <p className="text-sm text-slate-600 italic">Paste text above to see chunks.</p>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {chunks.map((chunk, i) => {
                  const col = PALETTE[i % PALETTE.length];
                  return (
                    <div key={i} className="rounded-xl p-3 group"
                      style={{ background: col.bg, border: `1px solid ${col.border}` }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider font-mono"
                          style={{ color: col.text }}>
                          chunk {i + 1} · {chunk.length}c
                        </span>
                        <CopyBtn text={chunk} />
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                        {chunk}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right — controls */}
        <div className="space-y-5 lg:sticky lg:top-4">
          {/* Strategy */}
          <div className="rounded-2xl p-4 space-y-3"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.25)' }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chunking Strategy</p>
            <div className="space-y-2">
              {STRATEGIES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setStrategy(s.value)}
                  className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-150"
                  style={
                    strategy === s.value
                      ? { background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)' }
                      : { background: 'rgba(30,41,59,0.5)',    border: '1px solid rgba(71,85,105,0.20)' }
                  }
                >
                  <p className={`text-xs font-bold ${strategy === s.value ? 'text-blue-300' : 'text-slate-300'}`}>
                    {s.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Size slider */}
          <div className="rounded-2xl p-4 space-y-4"
            style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(71,85,105,0.25)' }}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Parameters</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Max chunk size</label>
                <span className="text-xs font-mono font-bold text-blue-300">{size}c</span>
              </div>
              <input
                type="range" min={50} max={2000} step={50}
                value={size}
                onChange={e => setSize(parseInt(e.target.value))}
                className="w-full accent-blue-500"
                aria-label="Max chunk size"
              />
              <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                <span>50</span><span>2000</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">
                  Overlap
                  {strategy === 'paragraph' && (
                    <span className="ml-1 text-[9px] text-slate-600">(N/A for paragraph)</span>
                  )}
                </label>
                <span className="text-xs font-mono font-bold text-blue-300">{overlap}%</span>
              </div>
              <input
                type="range" min={0} max={50} step={5}
                value={overlap}
                disabled={strategy === 'paragraph'}
                onChange={e => setOverlap(parseInt(e.target.value))}
                className="w-full accent-blue-500 disabled:opacity-30"
                aria-label="Overlap percentage"
              />
              <p className="text-[9px] text-slate-600">
                ≈ {Math.floor(size * overlap / 100)} characters shared between adjacent chunks
              </p>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-xl p-3 space-y-1.5"
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
            <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Design tips</p>
            <ul className="space-y-1">
              {[
                '512–1024 tokens is the typical sweet spot for embedding models',
                '10–20% overlap prevents answer fragmentation at boundaries',
                'Use recursive for prose, paragraph for docs, sentence for Q&A',
              ].map(t => (
                <li key={t} className="flex items-start gap-1.5 text-[10px] text-slate-500 leading-snug">
                  <span className="text-blue-500 mt-0.5 shrink-0">·</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
