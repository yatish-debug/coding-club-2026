import React, { useState, useEffect } from 'react';
import { ExternalLink, Search, RefreshCw, Layers } from 'lucide-react';
import { Github } from '../components/Icons';
import GlowingCard from '../components/GlowingCard';
import { getProjects } from '../utils/api';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');

  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await getProjects();
        setProjects(data);
      } catch (err) {
        console.error('Failed to load projects', err);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  // Compute unique tags from tech stack strings
  const getUniqueTags = () => {
    const tags = new Set();
    projects.forEach(p => {
      p.tech_stack.split(',').forEach(tag => {
        tags.add(tag.trim());
      });
    });
    return ['All', ...Array.from(tags)];
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === 'All' || 
                       p.tech_stack.split(',').map(t => t.trim()).includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20 text-left">
      
      {/* Header tags */}
      <div className="space-y-4">
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
          // PORTFOLIO_SHOWCASE
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Club <span className="text-emerald-400">Projects & Builds</span>
        </h1>
        <p className="text-slate-400 max-w-xl">
          A showcase of products and systems designed and deployed by members of GFGCOE Coding Club. 100% open source.
        </p>
      </div>

      {/* Search and filter toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search bar inputs */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter tags list */}
        {!loading && projects.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center justify-start w-full md:w-auto">
            <Layers size={14} className="text-slate-500 mr-1 hidden sm:inline" />
            {getUniqueTags().slice(0, 7).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
                  selectedTag === tag
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                    : 'bg-slate-900/40 border-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800/40">
          <p className="text-slate-400 font-mono">NO_PROJECTS_MATCH_THE_CRITERIA</p>
          <p className="text-xs text-slate-500 mt-1">Please edit search query or choose All tags.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project) => {
            const getStatusColor = (st) => {
              const s = st ? st.toLowerCase() : "completed";
              if (s === "planning") return "bg-blue-500/10 border-blue-500/20 text-blue-400";
              if (s === "development") return "bg-amber-500/10 border-amber-500/20 text-amber-400";
              if (s === "testing") return "bg-purple-500/10 border-purple-500/20 text-purple-400";
              if (s === "review") return "bg-pink-500/10 border-pink-500/20 text-pink-400";
              if (s === "deployed") return "bg-teal-500/10 border-teal-500/20 text-teal-450";
              return "bg-emerald-500/10 border-emerald-500/20 text-emerald-450";
            };

            return (
              <GlowingCard key={project.id} hoverGlow="indigo" className="flex flex-col justify-between h-full min-h-[420px] relative">
                <div className="space-y-4">
                  {project.image_url && (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-800/40 shrink-0 relative">
                      <img
                        src={project.image_url}
                        alt={project.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border shadow-md ${getStatusColor(project.status)}`}>
                        {project.status || "Completed"}
                      </span>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold tracking-tight text-slate-100 line-clamp-1">
                        {project.title}
                      </h3>
                      {!project.image_url && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase border ${getStatusColor(project.status)}`}>
                          {project.status || "Completed"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                      {project.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {/* Completion percentage slider/indicator */}
                  {project.completion_percentage !== undefined && (
                    <div className="space-y-1 text-left">
                      <div className="flex justify-between text-[10px] font-mono text-slate-500">
                        <span>STAGE_COMPLETION_</span>
                        <span className="text-indigo-400 font-bold">{project.completion_percentage}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${project.completion_percentage}%` }}></div>
                      </div>
                    </div>
                  )}

                  {/* Team Members credit */}
                  {project.team_members && (
                    <div className="text-[11px] font-mono text-slate-450 text-left truncate" title={project.team_members}>
                      <span className="text-slate-500">ROSTER:</span> {project.team_members}
                    </div>
                  )}

                  {/* Start/End Timelines */}
                  {project.start_date && (
                    <div className="text-[9px] font-mono text-slate-500 text-left">
                      TIMELINE: {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Active'}
                    </div>
                  )}

                  {/* Tech stack splitted badges */}
                  <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-900/60">
                    {project.tech_stack.split(',').map((tech, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-450 text-[10px] font-mono"
                      >
                        {tech.trim()}
                      </span>
                    ))}
                  </div>

                  {/* External repository link hooks */}
                  <div className="flex justify-between items-center text-xs font-mono">
                    {project.github_link ? (
                      <a
                        href={project.github_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-400 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                      >
                        <Github size={14} /> REPOSITORY_
                      </a>
                    ) : (
                      <span className="text-slate-650">NO_REPO_LINK</span>
                    )}

                    {project.live_link ? (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                      >
                        LIVE_DEPLOY_ <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-slate-650">STAGING_ONLY</span>
                    )}
                  </div>
                </div>
              </GlowingCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
