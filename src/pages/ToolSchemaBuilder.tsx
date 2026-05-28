import { useState, useMemo, useCallback } from 'react';
import {
  Plus, Trash2, Copy, Check, Download,
  AlertCircle, Code2, FileJson, LayoutTemplate,
} from 'lucide-react';
import rawExamples from '../data/tool-schema-examples.json';

// ─── Types ────────────────────────────────────────────────────────────────────

const PARAM_TYPES = ['string', 'number', 'boolean', 'array', 'object'] as const;
type ParamType = typeof PARAM_TYPES[number];

interface SchemaParam {
  id: string;
  name: string;
  type: ParamType;
  description: string;
  required: boolean;
}

interface ExampleDef {
  id: string;
  label: string;
  description: string;
  parameters: { name: string; type: string; description: string; required: boolean }[];
}

const EXAMPLES = rawExamples as ExampleDef[];

type PreviewTab = 'json' | 'ts';
type CopyState  = 'idle' | 'copied' | 'error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId(): string {
  return crypto.randomUUID();
}

function makeParam(overrides?: Partial<SchemaParam>): SchemaParam {
  return {
    id:          genId(),
    name:        '',
    type:        'string',
    description: '',
    required:    false,
    ...overrides,
  };
}

function buildMcpSchema(
  name: string,
  description: string,
  params: SchemaParam[],
): Record<string, unknown> {
  const properties: Record<string, { type: string; description: string }> = {};
  const required: string[] = [];

  for (const p of params) {
    const key = p.name.trim();
    if (!key) continue;
    properties[key] = { type: p.type, description: p.description.trim() };
    if (p.required) required.push(key);
  }

  return {
    name: name.trim() || 'my_tool',
    description: description.trim(),
    input_schema: {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {}),
    },
  };
}

const TS_TYPE: Record<ParamType, string> = {
  string:  'string',
  number:  'number',
  boolean: 'boolean',
  array:   'unknown[]',
  object:  'Record<string, unknown>',
};

function buildTypeScript(name: string, params: SchemaParam[]): string {
  const valid = params.filter(p => p.name.trim());
  const safeName = (name.trim() || 'MyTool')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1');
  const ifaceName = `${safeName.charAt(0).toUpperCase()}${safeName.slice(1)}Input`;

  const fields = valid
    .map(p => {
      const opt     = p.required ? '' : '?';
      const comment = p.description.trim()
        ? `  /** ${p.description.trim()} */\n`
        : '';
      return `${comment}  ${p.name.trim()}${opt}: ${TS_TYPE[p.type]};`;
    })
    .join('\n');

  return `interface ${ifaceName} {\n${fields || '  // add parameters above'}\n}`;
}

function validateSchema(name: string, params: SchemaParam[]): string[] {
  const errors: string[] = [];
  if (!name.trim()) {
    errors.push('Tool name is required.');
  } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name.trim())) {
    errors.push('Tool name must start with a letter/underscore and use only letters, numbers, and underscores.');
  }

  const seen = new Set<string>();
  for (const p of params) {
    const key = p.name.trim();
    if (!key) {
      errors.push('All parameter rows must have a name.');
      break;
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      errors.push(`Parameter "${key}" must start with a letter/underscore and contain only letters, numbers, and underscores.`);
    }
    if (seen.has(key)) {
      errors.push(`Duplicate parameter name: "${key}".`);
    }
    seen.add(key);
  }
  return errors;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ToolSchemaBuilder() {
  const [toolName, setToolName]       = useState('');
  const [toolDesc, setToolDesc]       = useState('');
  const [params, setParams]           = useState<SchemaParam[]>([makeParam()]);
  const [previewTab, setPreviewTab]   = useState<PreviewTab>('json');
  const [copyState, setCopyState]     = useState<CopyState>('idle');

  // ── Derived ────────────────────────────────────────────────────────────────
  const schema      = useMemo(() => buildMcpSchema(toolName, toolDesc, params),   [toolName, toolDesc, params]);
  const tsInterface = useMemo(() => buildTypeScript(toolName, params),             [toolName, params]);
  const errors      = useMemo(() => validateSchema(toolName, params),             [toolName, params]);
  const isValid     = errors.length === 0;
  const schemaJson  = useMemo(() => JSON.stringify(schema, null, 2), [schema]);

  // ── Param helpers ──────────────────────────────────────────────────────────
  const addParam = useCallback(() => {
    setParams(prev => [...prev, makeParam()]);
  }, []);

  const removeParam = useCallback((id: string) => {
    setParams(prev => prev.filter(p => p.id !== id));
  }, []);

  const updateParam = useCallback((id: string, patch: Partial<SchemaParam>) => {
    setParams(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  // ── Load example ──────────────────────────────────────────────────────────
  const loadExample = useCallback((ex: ExampleDef) => {
    setToolName(ex.id);
    setToolDesc(ex.description);
    setParams(ex.parameters.map(p => ({
      id:          genId(),
      name:        p.name,
      type:        (PARAM_TYPES as readonly string[]).includes(p.type) ? p.type as ParamType : 'string',
      description: p.description,
      required:    p.required,
    })));
  }, []);

  // ── Copy ──────────────────────────────────────────────────────────────────
  const handleCopy = useCallback(async () => {
    const text = previewTab === 'json' ? schemaJson : tsInterface;
    try {
      await navigator.clipboard.writeText(text);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    } finally {
      setTimeout(() => setCopyState('idle'), 2000);
    }
  }, [previewTab, schemaJson, tsInterface]);

  // ── Download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    const content  = schemaJson;
    const filename = `${toolName.trim() || 'tool-schema'}.json`;
    const blob     = new Blob([content], { type: 'application/json' });
    const url      = URL.createObjectURL(blob);
    const a        = document.createElement('a');
    a.href         = url;
    a.download     = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [schemaJson, toolName]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <p className="page-eyebrow">AI Tools</p>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileJson size={22} className="text-violet-400" aria-hidden="true" />
          Tool Schema <span className="heading-gradient">Builder</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-xl">
          Generate valid MCP tool definitions visually. Live JSON preview with TypeScript interface export.
        </p>
      </div>

      {/* Quick-start examples */}
      <div className="glass-card glass-edge rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <LayoutTemplate size={14} className="text-slate-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Quick-start examples</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex.id}
              type="button"
              onClick={() => loadExample(ex)}
              className="px-3 py-1.5 text-xs rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:border-violet-500/50 hover:text-violet-300 transition-colors"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main layout: form + preview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* ── Left: Form ───────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">
          {/* Tool identity */}
          <div className="glass-card glass-edge rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tool identity</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="tool-name" className="text-xs font-semibold text-violet-400 uppercase tracking-wide">
                  Tool name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="tool-name"
                  type="text"
                  value={toolName}
                  onChange={e => setToolName(e.target.value)}
                  placeholder="file_reader"
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 font-mono placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  aria-required="true"
                  aria-describedby="tool-name-hint"
                />
                <p id="tool-name-hint" className="text-[10px] text-slate-600">snake_case, letters/numbers/underscores only</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="tool-desc" className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                  Description
                </label>
                <input
                  id="tool-desc"
                  type="text"
                  value={toolDesc}
                  onChange={e => setToolDesc(e.target.value)}
                  placeholder="Reads the contents of a file…"
                  className="w-full bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Parameters */}
          <div className="glass-card glass-edge rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Parameters <span className="text-slate-600 font-normal">({params.length})</span>
              </h2>
              <button
                type="button"
                onClick={addParam}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-400 hover:bg-violet-500/20 transition-colors"
              >
                <Plus size={12} aria-hidden="true" /> Add parameter
              </button>
            </div>

            {params.length === 0 && (
              <p className="text-center text-slate-600 text-xs py-4">No parameters yet — click "Add parameter".</p>
            )}

            <div className="space-y-3" role="list" aria-label="Parameter list">
              {params.map((p, idx) => (
                <div
                  key={p.id}
                  role="listitem"
                  className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto_auto] gap-2 items-start p-3 rounded-lg bg-slate-800/40 border border-slate-700/30"
                >
                  {/* Name */}
                  <div className="space-y-0.5">
                    <label htmlFor={`param-name-${p.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Name</label>
                    <input
                      id={`param-name-${p.id}`}
                      type="text"
                      value={p.name}
                      onChange={e => updateParam(p.id, { name: e.target.value })}
                      placeholder="param_name"
                      className="w-full bg-slate-900/60 border border-slate-700/40 rounded px-2 py-1.5 text-xs text-slate-300 font-mono placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-colors"
                      aria-label={`Parameter ${idx + 1} name`}
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-0.5">
                    <label htmlFor={`param-type-${p.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Type</label>
                    <select
                      id={`param-type-${p.id}`}
                      value={p.type}
                      onChange={e => updateParam(p.id, { type: e.target.value as ParamType })}
                      className="bg-slate-900/60 border border-slate-700/40 rounded px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors"
                      aria-label={`Parameter ${idx + 1} type`}
                    >
                      {PARAM_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="space-y-0.5 sm:col-span-1">
                    <label htmlFor={`param-desc-${p.id}`} className="text-[10px] text-slate-500 uppercase tracking-wide">Description</label>
                    <input
                      id={`param-desc-${p.id}`}
                      type="text"
                      value={p.description}
                      onChange={e => updateParam(p.id, { description: e.target.value })}
                      placeholder="What this parameter does…"
                      className="w-full bg-slate-900/60 border border-slate-700/40 rounded px-2 py-1.5 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-violet-500/50 transition-colors"
                      aria-label={`Parameter ${idx + 1} description`}
                    />
                  </div>

                  {/* Required toggle */}
                  <div className="space-y-0.5 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide">Req.</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.required}
                      aria-label={`Parameter ${idx + 1} required`}
                      onClick={() => updateParam(p.id, { required: !p.required })}
                      className={`mt-1 w-9 h-5 rounded-full border transition-colors relative ${
                        p.required
                          ? 'bg-violet-600 border-violet-500'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          p.required ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Remove */}
                  <div className="space-y-0.5 flex flex-col items-center">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wide sr-only">Remove</span>
                    <button
                      type="button"
                      onClick={() => removeParam(p.id)}
                      aria-label={`Remove parameter ${idx + 1}`}
                      className="mt-1 p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-1" role="alert">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wide mb-2">
                <AlertCircle size={13} aria-hidden="true" /> Validation errors
              </div>
              <ul className="list-disc list-inside space-y-0.5">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-amber-300/80">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Right: Preview ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {/* Tab bar */}
          <div className="glass-card glass-edge rounded-xl overflow-hidden">
            <div className="flex items-center border-b border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewTab('json')}
                aria-pressed={previewTab === 'json'}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                  previewTab === 'json'
                    ? 'text-violet-300 border-b-2 border-violet-500 -mb-px bg-violet-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <FileJson size={12} aria-hidden="true" /> JSON
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab('ts')}
                aria-pressed={previewTab === 'ts'}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                  previewTab === 'ts'
                    ? 'text-blue-300 border-b-2 border-blue-500 -mb-px bg-blue-500/5'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Code2 size={12} aria-hidden="true" /> TypeScript
              </button>

              {/* Action buttons */}
              <div className="ml-auto flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label="Copy to clipboard"
                  className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {copyState === 'copied'
                    ? <Check size={13} className="text-emerald-400" aria-hidden="true" />
                    : <Copy size={13} aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!isValid}
                  aria-label="Download JSON schema"
                  title={isValid ? 'Download tool-schema.json' : 'Fix validation errors before downloading'}
                  className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download size={13} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Code block */}
            <pre
              className="p-4 text-[11px] leading-relaxed font-mono text-slate-300 overflow-x-auto max-h-[520px] overflow-y-auto whitespace-pre"
              aria-label={previewTab === 'json' ? 'MCP tool JSON schema preview' : 'TypeScript interface preview'}
            >
              <code>{previewTab === 'json' ? schemaJson : tsInterface}</code>
            </pre>
          </div>

          {/* Valid badge */}
          {isValid && params.some(p => p.name.trim()) && (
            <p className="text-[10px] text-emerald-500 flex items-center gap-1.5 px-1">
              <Check size={10} aria-hidden="true" /> Schema is valid
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
