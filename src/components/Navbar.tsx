import { NavLink } from 'react-router-dom';
import { BookOpen, Brain, Layers, BarChart2, Home } from 'lucide-react';

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/notes', label: 'Study Notes', icon: BookOpen },
  { to: '/scenarios', label: 'Scenarios', icon: Layers },
  { to: '/progress', label: 'Progress', icon: BarChart2 },
];

export default function Navbar() {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-violet-400 mr-4 text-sm tracking-wide select-none">
          CCA-F Prep
        </span>
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-violet-700 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <Icon size={15} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
