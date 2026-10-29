import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

/**
 * Hosts the SkillUp learning experience inside the AaryaAI layout (header, navigation, footer).
 * The experience is built from ajch_skillup content by scripts/skillup-site (`--embed`) into
 * /skillup-assets/ during the Cloudflare Pages deploy; this page loads it once and mounts it.
 * The URL follows the open exam (/skillup, /skillup/ai901) so Back and shared links work.
 */
const ASSETS = '/skillup-assets/';

interface SkillUpInstance {
  destroy(): void;
  openExam(id: string | null): void;
}
interface SkillUpRuntime {
  start(host: HTMLElement, opts: {
    embedded: boolean;
    scroller?: HTMLElement;
    exam?: string;
    onRoute?: (examId: string | null) => void;
  }): SkillUpInstance;
}
declare global {
  interface Window { SkillUpApp?: SkillUpRuntime }
}

let loading: Promise<void> | null = null;
function addScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(s);
  });
}
function loadSkillUp(): Promise<void> {
  if (window.SkillUpApp) return Promise.resolve();
  if (!loading) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = `${ASSETS}skillup.css`;
    document.head.appendChild(css);
    loading = addScript(`${ASSETS}skillup-data.js`).then(() => addScript(`${ASSETS}skillup-app.js`));
    loading.catch(() => { loading = null; });
  }
  return loading;
}

export default function SkillUpHost() {
  const params = useParams();
  const examId = (params['*'] || '').split('/')[0] || null;
  const navigate = useNavigate();
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<SkillUpInstance | null>(null);
  const initialExam = useRef(examId);
  const [failed, setFailed] = useState(false);

  // Load and mount once; the instance lives as long as the user stays in /skillup.
  useEffect(() => {
    let cancelled = false;
    loadSkillUp()
      .then(() => {
        if (cancelled || !hostRef.current || !window.SkillUpApp) return;
        appRef.current = window.SkillUpApp.start(hostRef.current, {
          embedded: true,
          scroller: document.getElementById('main') ?? undefined,
          exam: initialExam.current ?? undefined,
          onRoute: (id) => {
            const to = id ? `/skillup/${id}` : '/skillup';
            if (window.location.pathname.replace(/\/$/, '') !== to) navigate(to);
          },
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, [navigate]);

  // Back/forward or an in-site link changed the exam in the URL.
  useEffect(() => {
    appRef.current?.openExam(examId);
  }, [examId]);

  if (failed) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center text-slate-300">
        <h1 className="text-3xl font-semibold text-white mb-3">SkillUp is updating</h1>
        <p className="mb-6">The learning experience couldn't load. Please try again in a minute.</p>
        <Link to="/" className="text-violet-300 hover:text-white">Back to home</Link>
      </div>
    );
  }
  return <div ref={hostRef} className="skillup-host w-full" />;
}
