import { MapPin, Building2, ExternalLink } from 'lucide-react';

interface ProfileLink {
  label: string;
  url: string;
  icon: string;
}

interface Props {
  name: string;
  title: string;
  tagline: string;
  avatar: string;
  company?: string;
  location: string;
  bio: string;
  links: ProfileLink[];
}

export function ProfileCard({ name, title, tagline, avatar, company, location, bio, links }: Props) {
  return (
    <div className="glass-card glass-edge rounded-2xl p-6 md:p-8">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={avatar}
            alt={name}
            className="w-24 h-24 md:w-32 md:h-32 rounded-2xl ring-2 ring-violet-500/30 shadow-lg shadow-violet-500/10"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 ring-3 ring-slate-900" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{name}</h1>
          <p className="text-violet-400 font-medium mt-1">{title}</p>
          <p className="text-slate-400 text-sm italic mt-1">{tagline}</p>

          <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-400">
            {company && (
              <span className="flex items-center gap-1">
                <Building2 size={14} className="text-slate-500" />
                {company}
              </span>
            )}
            <span className="flex items-center gap-1">
              <MapPin size={14} className="text-slate-500" />
              {location}
            </span>
          </div>

          <p className="text-slate-300 text-sm leading-relaxed mt-4 max-w-2xl">{bio}</p>

          {/* Links */}
          <div className="flex flex-wrap gap-3 mt-4">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 text-sm text-slate-300 hover:text-white hover:border-violet-500/50 hover:bg-slate-800 transition-all duration-200"
              >
                <ExternalLink size={12} />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
