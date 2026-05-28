import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { maintainer } from '../data/maintainer';
import { ProfileCard } from '../components/ProfileCard';
import { StatGrid } from '../components/StatGrid';
import { SkillBadges } from '../components/SkillBadges';
import { TimelineSection } from '../components/TimelineSection';
import { ExternalLink, Rocket, Target, LayoutDashboard, Users } from 'lucide-react';

const OWNER_LOGIN = 'ajeetchouksey';

export default function Maintainer() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div className={`space-y-8 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      {/* Hero */}
      <ProfileCard
        name={maintainer.name}
        title={maintainer.title}
        tagline={maintainer.tagline}
        avatar={maintainer.avatar}
        location={maintainer.location}
        bio={maintainer.bio}
        links={maintainer.links}
      />

      {/* Stats */}
      <StatGrid stats={maintainer.stats} />

      {/* Owner-only links */}
      {user?.login === OWNER_LOGIN && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/maintainer/dashboard"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 hover:bg-violet-500/20 transition-colors text-sm font-medium flex-1"
          >
            <LayoutDashboard size={16} />
            Analytics Dashboard
          </Link>
          <Link
            to="/team"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 hover:bg-blue-500/20 transition-colors text-sm font-medium flex-1"
          >
            <Users size={16} />
            My AI Team
          </Link>
        </div>
      )}

      {/* Tech Stack */}
      <section className="glass-card rounded-xl p-6">
        <h2 className="section-heading mb-4 flex items-center gap-2">
          <Target size={18} className="text-violet-400" />
          Tech Stack & Expertise
        </h2>
        <SkillBadges categories={maintainer.techStack} />
      </section>

      {/* Focus Areas */}
      <section className="glass-card rounded-xl p-6">
        <h2 className="section-heading mb-4 flex items-center gap-2">
          <Rocket size={18} className="text-violet-400" />
          Current Focus
        </h2>
        <ul className="space-y-2">
          {maintainer.focusAreas.map((area, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-violet-400 mt-0.5">▸</span>
              {area}
            </li>
          ))}
        </ul>
      </section>

      {/* Featured Projects */}
      <section>
        <h2 className="section-heading mb-4">Featured Projects</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {maintainer.featuredProjects.map((proj) => (
            <a
              key={proj.name}
              href={proj.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card glass-sheen rounded-xl p-5 group hover:border-violet-500/30 transition-all"
            >
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition-colors flex items-center gap-2">
                {proj.name}
                <ExternalLink size={13} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </h3>
              <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{proj.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {proj.tech.map((t) => (
                  <span key={t} className="px-2 py-0.5 text-xs rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                    {t}
                  </span>
                ))}
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="glass-card rounded-xl p-6">
        <TimelineSection items={maintainer.certifications} />
      </section>
    </div>
  );
}
