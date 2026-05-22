interface Props {
  categories: { category: string; items: string[] }[];
}

const categoryColors: Record<string, string> = {
  'Cloud Platforms': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'DevOps & Infrastructure': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'AI & Programming': 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  'Security & Monitoring': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
};

const defaultColor = 'bg-slate-700/40 text-slate-300 border-slate-600/50';

export function SkillBadges({ categories }: Props) {
  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.category}>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            {cat.category}
          </h4>
          <div className="flex flex-wrap gap-2">
            {cat.items.map((item) => (
              <span
                key={item}
                className={`px-2.5 py-1 rounded-md text-xs font-medium border ${categoryColors[cat.category] || defaultColor}`}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
