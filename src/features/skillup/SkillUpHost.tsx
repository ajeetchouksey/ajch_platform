import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SignInChoices } from '@/components/LoginWidget';
import { getUiFlag, setUiFlag } from '@/lib/storage';
import { useProgressSync } from '@/lib/useProgressSync';
import { recordSkillUpLearner, fetchSkillUpLearnerCounts } from '@/lib/skillup-learners';

/**
 * Hosts the SkillUp learning experience inside the AaryaAI layout (header, navigation, footer).
 * The experience is built from ajch_skillup content by scripts/skillup-site (`--embed`) into
 * /skillup-assets/ during the Cloudflare Pages deploy; this page loads it once and mounts it.
 * The URL follows the open exam (/skillup, /skillup/ai901) so Back and shared links work.
 * The catalog is public; opening an exam needs an account, so a signed-out visitor who picks an
 * exam (or follows a /skillup/:id link) gets a sign-in panel for it instead, and lands in the
 * exam once signed in.
 */
const ASSETS = '/skillup-assets/';
const TOUR_FLAG = 'skillup.tour';

interface SkillUpInstance {
  destroy(): void;
  openExam(id: string | null): void;
  setLearners(counts: Record<string, number>): void;
}
interface SkillUpRuntime {
  start(host: HTMLElement, opts: {
    embedded: boolean;
    scroller?: HTMLElement;
    exam?: string;
    onRoute?: (examId: string | null) => void;
    canOpen?: (examId: string) => boolean;
    tour?: { seen(): boolean; done(): void };
  }): SkillUpInstance;
}
interface CatalogExam { id: string; code: string; title: string; provider: string; description?: string; topics: number; questions: number }
declare global {
  interface Window {
    SkillUpApp?: SkillUpRuntime;
    SKILLUP?: { catalog?: { exams?: CatalogExam[] } };
  }
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
  const { user, token, isLoading: authLoading } = useAuth();
  const signedIn = useRef(!!user);
  const { syncToGist } = useProgressSync();
  const sync = useRef(syncToGist);
  const hostRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<SkillUpInstance | null>(null);
  const initialExam = useRef(examId);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const gated = !!examId && !authLoading && !user;

  // canOpen runs inside the SkillUp runtime, outside React, so it reads sign-in state from a ref.
  // Declared first so it's current before the effects below run in the same commit.
  useEffect(() => {
    signedIn.current = !!user;
    sync.current = syncToGist;
  }, [user, syncToGist]);

  // Load and mount once auth has settled (so a deep link isn't gated while the session is
  // still being restored); the instance lives as long as the user stays in /skillup.
  useEffect(() => {
    if (authLoading) return;
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
          // Signed out: keep the catalog, move the URL to the exam and let the gate below ask
          // for sign-in. OAuth returns to this URL, so the exam opens right after.
          canOpen: (id) => {
            if (signedIn.current) return true;
            const to = `/skillup/${id}`;
            if (window.location.pathname.replace(/\/$/, '') !== to) navigate(to);
            return false;
          },
          // The first-run tour shows once per account: the flag syncs with the rest of the progress.
          tour: {
            seen: () => !!getUiFlag(TOUR_FLAG),
            done: () => { setUiFlag(TOUR_FLAG); void sync.current(); },
          },
        });
        setReady(true);
        // Public learner counts for the catalog cards; best-effort, the catalog doesn't wait for them.
        void fetchSkillUpLearnerCounts().then((counts) => { if (!cancelled) appRef.current?.setLearners(counts); });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => {
      cancelled = true;
      appRef.current?.destroy();
      appRef.current = null;
    };
  }, [navigate, authLoading]);

  // Back/forward or an in-site link changed the exam in the URL, or the visitor just signed in
  // on a gated exam.
  useEffect(() => {
    appRef.current?.openExam(examId);
  }, [examId, user]);

  // Count a signed-in learner once per exam (the Worker dedupes; this sends at most once per tab).
  useEffect(() => {
    if (ready && examId && token) recordSkillUpLearner(examId, token);
  }, [ready, examId, token]);

  if (failed) {
    return (
      <div className="max-w-xl mx-auto px-6 py-24 text-center text-slate-300">
        <h1 className="text-3xl font-semibold text-white mb-3">SkillUp is updating</h1>
        <p className="mb-6">The learning experience couldn't load. Please try again in a minute.</p>
        <Link to="/" className="text-violet-300 hover:text-white">Back to home</Link>
      </div>
    );
  }
  return (
    <>
      {gated ? <SignInGate examId={examId} onBack={() => navigate('/skillup')} /> : !ready && <LoadingShimmer />}
      <div ref={hostRef} className="skillup-host w-full" hidden={gated} />
    </>
  );
}

/** Shown instead of an exam to signed-out visitors: what the exam is, and the sign-in choices. */
function SignInGate({ examId, onBack }: { examId: string; onBack: () => void }) {
  const exam = window.SKILLUP?.catalog?.exams?.find((e) => e.id === examId);
  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <button onClick={onBack} className="text-sm text-violet-300 hover:text-white transition-colors mb-6">
        ← All exams
      </button>
      <div className="rounded-2xl border border-slate-700/80 bg-slate-900/80 p-5 sm:p-6 space-y-5">
        <div className="space-y-2">
          {exam && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {[exam.provider, exam.code].filter(Boolean).join(' · ')}
            </p>
          )}
          <h1 className="text-2xl font-semibold text-white text-balance">
            Sign in to start {exam ? exam.title : 'this exam'}
          </h1>
          {exam && (
            <p className="text-sm text-slate-400">
              {exam.topics} topics · {exam.questions} practice questions
            </p>
          )}
          <p className="text-sm text-slate-300 leading-relaxed">
            SkillUp is free. Signing in keeps your progress, review pile and streak with your account.
          </p>
        </div>
        <SignInChoices />
      </div>
    </div>
  );
}

/** Placeholder shaped like the catalog while the SkillUp assets load, so the page never sits blank. */
function LoadingShimmer() {
  const bar = 'rounded-lg bg-slate-700/40 animate-pulse motion-reduce:animate-none';
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6" role="status" aria-label="Loading SkillUp">
      <div className={`${bar} h-4 w-32`} />
      <div className={`${bar} h-12 w-2/3`} />
      <div className={`${bar} h-4 w-1/2`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-4">
        {[0, 1, 2].map((i) => <div key={i} className={`${bar} h-48 rounded-2xl`} />)}
      </div>
    </div>
  );
}
