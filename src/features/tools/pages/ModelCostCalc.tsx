import { useState, useMemo } from 'react';
import { DollarSign, TrendingDown, ExternalLink } from 'lucide-react';
import rawPricing from '@/data/model-pricing.json';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModelPricing {
  id: string;
  label: string;
  provider: string;
  contextWindow: number;
  inputPer1M: number;
  outputPer1M: number;
}

interface PricingFile {
  lastUpdated: string;
  sources: Record<string, string>;
  models: ModelPricing[];
}

const PRICING = rawPricing as PricingFile;

const PROVIDER_BADGE: Record<string, string> = {
  Anthropic: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  OpenAI:    'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Google:    'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtUSD(n: number): string {
  if (n === 0) return '$0.00';
  if (n < 0.001) return `$${n.toFixed(5)}`;
  if (n < 0.01)  return `$${n.toFixed(4)}`;
  if (n < 1)     return `$${n.toFixed(3)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtCtx(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  return `${Math.round(n / 1000)}K`;
}

// ─── Number input ─────────────────────────────────────────────────────────────

function NumInput({
  id, label, color, value, onChange, max = 1_000_000, sliderMax,
}: {
  id: string; label: string; color: string;
  value: number; onChange: (n: number) => void; max?: number; sliderMax?: number;
}) {
  const sMax = sliderMax ?? Math.min(max, 100_000);
  return (
    <div className="space-y-2">
      <label htmlFor={id} className={`text-xs font-semibold uppercase tracking-wide ${color}`}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={e => onChange(Math.max(0, Math.min(max, parseInt(e.target.value) || 0)))}
        className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors"
      />
      <input
        type="range"
        min={0}
        max={sMax}
        step={Math.max(1, Math.round(sMax / 200))}
        value={Math.min(value, sMax)}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-violet-500"
        aria-label={`${label} slider`}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ModelCostCalc() {
  const [inputTokens, setInputTokens]   = useState(1_000);
  const [outputTokens, setOutputTokens] = useState(500);
  const [requests, setRequests]         = useState(1_000);

  const rows = useMemo(() => {
    return PRICING.models
      .map(m => {
        const costPerRequest =
          (inputTokens  * m.inputPer1M  + outputTokens * m.outputPer1M) / 1_000_000;
        const monthlyCost = costPerRequest * requests;
        return { ...m, costPerRequest, monthlyCost };
      })
      .sort((a, b) => a.costPerRequest - b.costPerRequest);
  }, [inputTokens, outputTokens, requests]);

  const cheapestCost = rows[0]?.costPerRequest ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="page-eyebrow">AI Tools</p>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign size={22} className="text-violet-400" aria-hidden="true" />
            Model Cost <span className="heading-gradient">Calculator</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Compare token pricing across Claude, GPT, and Gemini in real time. 100% client-side — no API key required.
          </p>
        </div>
        <span className="text-[10px] px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500 uppercase tracking-wide shrink-0">
          Updated {PRICING.lastUpdated}
        </span>
      </div>

      {/* Inputs */}
      <div className="glass-card glass-edge rounded-xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Request parameters</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <NumInput
            id="input-tokens" label="Input tokens" color="text-violet-400"
            value={inputTokens} onChange={setInputTokens} max={2_000_000} sliderMax={100_000}
          />
          <NumInput
            id="output-tokens" label="Output tokens" color="text-blue-400"
            value={outputTokens} onChange={setOutputTokens} max={200_000} sliderMax={50_000}
          />
          <NumInput
            id="requests-month" label="Requests / month" color="text-emerald-400"
            value={requests} onChange={setRequests} max={10_000_000} sliderMax={100_000}
          />
        </div>
      </div>

      {/* Comparison table */}
      <div className="glass-card glass-edge rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Model cost comparison table">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wide text-slate-500">
                <th scope="col" className="text-left px-4 py-3 font-semibold">Model</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold">Input / 1M</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold">Output / 1M</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold">Per request</th>
                <th scope="col" className="text-right px-4 py-3 font-semibold">Monthly est.</th>
                <th scope="col" className="text-left px-4 py-3 font-semibold">Context</th>
                <th scope="col" className="px-4 py-3 font-semibold sr-only">Pricing link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rows.map(m => {
                const isCheapest = m.costPerRequest === cheapestCost && cheapestCost > 0;
                const ratio = cheapestCost > 0 && m.costPerRequest > cheapestCost
                  ? m.costPerRequest / cheapestCost
                  : null;
                return (
                  <tr
                    key={m.id}
                    className={`transition-colors ${isCheapest ? 'bg-emerald-500/5' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isCheapest && (
                          <TrendingDown size={12} className="text-emerald-400 shrink-0" aria-label="Cheapest option" />
                        )}
                        <span className="text-slate-200 font-medium text-xs">{m.label}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${PROVIDER_BADGE[m.provider] ?? 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                          {m.provider}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">{fmtUSD(m.inputPer1M)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-400">{fmtUSD(m.outputPer1M)}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs">
                      <span className={isCheapest ? 'text-emerald-400 font-semibold' : 'text-slate-300'}>
                        {fmtUSD(m.costPerRequest)}
                      </span>
                      {ratio !== null && (
                        <span className="text-slate-600 text-[9px] ml-1">×{ratio.toFixed(1)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-slate-300">{fmtUSD(m.monthlyCost)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{fmtCtx(m.contextWindow)}</td>
                    <td className="px-4 py-3">
                      <a
                        href={PRICING.sources[m.provider] ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.label} official pricing page`}
                        className="text-slate-600 hover:text-violet-400 transition-colors"
                      >
                        <ExternalLink size={11} />
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-800/60 text-[10px] text-slate-600 flex flex-wrap gap-x-2 gap-y-1">
          <span>Published list prices as of {PRICING.lastUpdated}. Batch, cached-token, and free-tier discounts not included.</span>
          <span>
            Sources:{' '}
            {Object.entries(PRICING.sources).map(([name, url], i) => (
              <span key={name}>
                {i > 0 && ' · '}
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-violet-400 transition-colors">
                  {name}
                </a>
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
