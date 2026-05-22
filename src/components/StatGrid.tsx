import { Calendar, GitCommit, FolderGit, Award } from 'lucide-react';

const iconMap: Record<string, typeof Calendar> = {
  'calendar': Calendar,
  'git-commit': GitCommit,
  'folder-git': FolderGit,
  'award': Award,
};

interface Stat {
  label: string;
  value: string;
  icon: string;
}

interface Props {
  stats: Stat[];
}

export function StatGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon] || Calendar;
        return (
          <div
            key={stat.label}
            className="glass-stats rounded-xl p-4 text-center"
          >
            <Icon size={18} className="mx-auto text-violet-400 mb-2" />
            <div className="text-xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{stat.label}</div>
          </div>
        );
      })}
    </div>
  );
}
