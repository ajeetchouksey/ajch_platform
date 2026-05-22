import { Award } from 'lucide-react';

interface TimelineItem {
  title: string;
  issuer: string;
  year: string;
}

interface Props {
  items: TimelineItem[];
  heading?: string;
}

export function TimelineSection({ items, heading = 'Certifications' }: Props) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-4">{heading}</h3>
      <div className="relative pl-6 border-l border-slate-700/50">
        {items.map((item, i) => (
          <div key={i} className="relative mb-4 last:mb-0">
            <div className="absolute -left-[calc(1.5rem+5px)] top-1 w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-slate-900" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-white flex items-center gap-1.5">
                  <Award size={13} className="text-violet-400" />
                  {item.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{item.issuer}</p>
              </div>
              <span className="text-xs text-slate-500 shrink-0">{item.year}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
