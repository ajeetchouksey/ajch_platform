import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FileText, GraduationCap, Wrench, ArrowRight, Briefcase } from 'lucide-react';
import { search, buildBlogDocs, buildExamDocs, buildToolDocs, buildInterviewDocs } from '@/lib/search';
import type { SearchDocument, SearchResult } from '@/lib/search';
import { loadBlogManifest, loadExamRegistry, loadInterviewBank } from '@/lib/content-loader';

// ── Icon by content type ───────────────────────────────────────────────────
const TYPE_ICON: Record<SearchDocument['type'], React.ElementType> = {
  blog: FileText,
  exam: GraduationCap,
  tool: Wrench,
  note: FileText,
  interview: Briefcase,
};
const TYPE_COLOR: Record<SearchDocument['type'], string> = {
  blog: '#a78bfa',
  exam: '#34d399',
  tool: '#60a5fa',
  note: '#fb923c',
  interview: '#f472b6',
};

// ── Component ──────────────────────────────────────────────────────────────

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [index, setIndex] = useState<SearchDocument[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Build index once on first open
  useEffect(() => {
    if (!open || index.length > 0) return;
    Promise.all([loadBlogManifest(), loadExamRegistry(), loadInterviewBank().catch(() => [])])
      .then(([blog, exams, interview]) => {
        setIndex([
          ...buildBlogDocs(blog.posts),
          ...buildExamDocs(exams.exams),
          ...buildToolDocs(),
          ...buildInterviewDocs(interview),
        ]);
      })
      .catch(() => {});
  }, [open, index.length]);

  // Focus input when opening — resetting state on prop change is intentional here
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery('');
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Run search on query change — derived state pattern, intentional
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResults(search(query, index));
    setActiveIdx(0);
  }, [query, index]);

  const navigate_to = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[activeIdx]) { navigate_to(results[activeIdx].doc.url); }
  }, [onClose, results, activeIdx, navigate_to]);

  if (!open) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {/* Panel */}
      <div
        className="w-full max-w-xl mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#0f1117', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input row */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts, exams, tools…"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-500 hover:text-slate-300 transition-colors">
              <X size={14} />
            </button>
          )}
          <kbd className="text-xs text-slate-600 border border-slate-700 rounded px-1.5 py-0.5 hidden sm:block">esc</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-1.5">
            {results.map((r, i) => {
              const Icon = TYPE_ICON[r.doc.type];
              const color = TYPE_COLOR[r.doc.type];
              const active = i === activeIdx;
              return (
                <li key={r.doc.id}>
                  <button
                    className="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: active ? 'rgba(167,139,250,0.1)' : 'transparent' }}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => navigate_to(r.doc.url)}
                  >
                    <Icon size={14} className="mt-0.5 shrink-0" style={{ color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 truncate">{r.doc.title}</p>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{r.doc.excerpt}</p>
                    </div>
                    <ArrowRight size={12} className="mt-1 shrink-0 text-slate-600" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && results.length === 0 && (
          <p className="px-4 py-5 text-sm text-slate-500 text-center">
            No results for <span className="text-slate-300">"{query}"</span>
          </p>
        )}

        {/* Hint footer */}
        {query.length < 2 && (
          <div className="flex gap-4 px-4 py-2.5 text-xs text-slate-600" style={{ borderTop: results.length > 0 ? '1px solid rgba(255,255,255,0.07)' : undefined }}>
            <span><kbd className="border border-slate-700 rounded px-1">↑↓</kbd> navigate</span>
            <span><kbd className="border border-slate-700 rounded px-1">↵</kbd> open</span>
            <span><kbd className="border border-slate-700 rounded px-1">esc</kbd> close</span>
          </div>
        )}
      </div>
    </div>
  );
}
