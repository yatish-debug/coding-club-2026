import React, { useState, useEffect } from 'react';
import { RefreshCw, Mail, Search, Shield, Award, Terminal, Code, Calendar, Users, ChevronDown } from 'lucide-react';
import { Github, Linkedin } from '../components/Icons';
import GlowingCard from '../components/GlowingCard';
import { getCommittee } from '../utils/api';

export default function Committee() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('hierarchy'); // 'hierarchy', 'faculty', 'exec', 'tech', 'event', 'core'

  useEffect(() => {
    async function fetchCommittee() {
      try {
        const data = await getCommittee();
        setMembers(data);
      } catch (err) {
        console.error('Failed to load committee', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCommittee();
  }, []);

  // Classify a member into a designated category tier
  const getMemberTier = (member) => {
    const roleLower = member.role.toLowerCase();
    if (roleLower.includes('faculty') || roleLower.includes('advisor')) {
      return { id: 'faculty', label: 'Faculty Coordinator', color: 'emerald', icon: <Shield size={16} className="text-emerald-400" /> };
    }
    if (roleLower === 'president' || roleLower.includes('vice president')) {
      return { id: 'exec', label: 'Executive Board', color: 'indigo', icon: <Award size={16} className="text-indigo-400" /> };
    }
    if (roleLower.includes('technical lead') || roleLower.includes('tech lead') || roleLower.includes('web architect')) {
      return { id: 'tech', label: 'Technical Lead', color: 'blue', icon: <Code size={16} className="text-blue-400" /> };
    }
    if (roleLower.includes('event coordinator') || roleLower.includes('event')) {
      return { id: 'event', label: 'Event Coordinator', color: 'rose', icon: <Calendar size={16} className="text-rose-400" /> };
    }
    return { id: 'core', label: 'Core Team Member', color: 'amber', icon: <Users size={16} className="text-amber-400" /> };
  };

  const getFilteredMembers = () => {
    return members.filter((member) => {
      // 1. Search filter
      const matchesSearch = 
        member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        member.role.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      // 2. Category tab filter
      if (selectedFilter === 'hierarchy') return true;
      const tier = getMemberTier(member);
      return tier.id === selectedFilter;
    });
  };

  const filteredMembers = getFilteredMembers();

  // Render a single member profile card
  const renderMemberCard = (member, glowColor = 'blue') => {
    const tierInfo = getMemberTier(member);
    return (
      <GlowingCard 
        key={member.id} 
        hoverGlow={glowColor} 
        className="flex flex-col items-center justify-between text-center p-6 h-full min-h-[320px] transition-all duration-300 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-20 h-20 rounded-full bg-slate-900/10 blur-[25px] pointer-events-none"></div>
        
        {/* Core Member Detail */}
        <div className="flex flex-col items-center space-y-4 w-full">
          {/* Circular Glowing photo container */}
          <div className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-800 hover:scale-105 transition-transform duration-300 shadow-lg shrink-0 group`}>
            <img
              src={member.image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 tracking-tight">{member.name}</h3>
            
            {/* Custom styled badge indicating tier and specific role */}
            <div className="flex flex-col items-center gap-1.5 pt-1">
              <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase bg-${tierInfo.color}-500/10 border border-${tierInfo.color}-500/20 text-${tierInfo.color}-400 inline-flex items-center gap-1`}>
                {tierInfo.icon}
                {tierInfo.label}
              </span>
              <p className="text-xs text-slate-400 font-medium font-sans mt-0.5 px-2 line-clamp-1">{member.role}</p>
            </div>
          </div>
        </div>

        {/* Social Link Hooks */}
        <div className="flex items-center gap-3 pt-6 border-t border-slate-900/60 w-full justify-center mt-6">
          {member.linkedin_url ? (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/20 rounded-lg hover:bg-slate-900 transition-all duration-200 cursor-pointer"
              title="LinkedIn Profile"
            >
              <Linkedin size={14} />
            </a>
          ) : (
            <span className="p-2 text-slate-700 border border-slate-900/40 rounded-lg" title="No LinkedIn"><Linkedin size={14} /></span>
          )}

          {member.github_url ? (
            <a
              href={member.github_url}
              target="_blank"
              rel="noreferrer"
              className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/20 rounded-lg hover:bg-slate-900 transition-all duration-200 cursor-pointer"
              title="GitHub Profile"
            >
              <Github size={14} />
            </a>
          ) : (
            <span className="p-2 text-slate-700 border border-slate-900/40 rounded-lg" title="No GitHub"><Github size={14} /></span>
          )}

          <a
            href="mailto:codingclub@gfgcoe.org"
            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900/60 border border-slate-800 hover:border-emerald-500/20 rounded-lg hover:bg-slate-900 transition-all duration-200 cursor-pointer"
            title="Contact Member"
          >
            <Mail size={14} />
          </a>
        </div>
      </GlowingCard>
    );
  };

  // Render Clustered Tiers in Hierarchy
  const renderHierarchyView = () => {
    const faculty = filteredMembers.filter(m => getMemberTier(m).id === 'faculty');
    const exec = filteredMembers.filter(m => getMemberTier(m).id === 'exec');
    const tech = filteredMembers.filter(m => getMemberTier(m).id === 'tech');
    const event = filteredMembers.filter(m => getMemberTier(m).id === 'event');
    const core = filteredMembers.filter(m => getMemberTier(m).id === 'core');

    const sections = [
      { id: 'faculty', title: 'Faculty Coordinators & Advisors', data: faculty, color: 'emerald', gridCols: 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' },
      { id: 'exec', title: 'Executive Board Officers', data: exec, color: 'indigo', gridCols: 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' },
      { id: 'tech', title: 'Technical Operations Leads', data: tech, color: 'blue', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' },
      { id: 'event', title: 'Event Coordinators', data: event, color: 'rose', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' },
      { id: 'core', title: 'Core Chapter Members', data: core, color: 'amber', gridCols: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' },
    ];

    const hasData = sections.some(s => s.data.length > 0);
    if (!hasData) {
      return (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800/40">
          <p className="text-slate-400 font-mono">NO_HIERARCHY_MEMBERS_MATCHED</p>
        </div>
      );
    }

    return (
      <div className="space-y-20 relative">
        {sections.map((section, idx) => {
          if (section.data.length === 0) return null;
          return (
            <div key={section.id} className="space-y-8 text-center relative">
              {/* Hierarchy Clustered Title */}
              <div className="flex flex-col items-center space-y-2">
                <h3 className="text-lg sm:text-xl font-bold font-sans tracking-wide text-slate-200 uppercase relative w-fit">
                  {section.title}
                  <span className={`absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-12 h-[2.5px] bg-${section.color}-500 rounded-full`} />
                </h3>
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">// TIER_{idx + 1}</span>
              </div>

              {/* Grid cluster */}
              <div className={`grid gap-8 ${section.gridCols}`}>
                {section.data.map(m => renderMemberCard(m, section.color))}
              </div>

              {/* Connecting visual tree connector lines */}
              {idx < sections.filter(s => s.data.length > 0).length - 1 && (
                <div className="hidden lg:flex flex-col items-center pt-8 pointer-events-none">
                  <div className="w-[1px] h-10 bg-slate-900/60" />
                  <ChevronDown size={14} className="text-slate-650 -mt-1" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const filterTabs = [
    { id: 'hierarchy', label: 'Hierarchy view', icon: <Terminal size={12} /> },
    { id: 'faculty', label: 'Faculty coordinators', icon: <Shield size={12} /> },
    { id: 'exec', label: 'Executive Board', icon: <Award size={12} /> },
    { id: 'tech', label: 'Technical Leads', icon: <Code size={12} /> },
    { id: 'event', label: 'Event Coordinators', icon: <Calendar size={12} /> },
    { id: 'core', label: 'Core Team Members', icon: <Users size={12} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20 text-left relative">
      
      {/* Title Tagline */}
      <div className="space-y-4">
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
          // CHAPTER_OFFICERS
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Club <span className="text-emerald-400">Committee & Team</span>
        </h1>
        <p className="text-slate-400 max-w-xl">
          Meet the dedicated group of coordinators, leads, and organizers working behind the scenes to guide code campaigns and events at GFGCOE.
        </p>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between border-b border-slate-900/60 pb-6">
        
        {/* Search bar input */}
        <div className="relative w-full lg:max-w-xs shrink-0">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search by name or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Filter Tab buttons */}
        <div className="flex gap-2 flex-wrap items-center justify-start w-full lg:w-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border flex items-center gap-1.5 uppercase ${
                selectedFilter === tab.id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                  : 'bg-slate-900/40 border-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800/40">
          <p className="text-slate-400 font-mono">NO_COMMITTEE_MEMBERS_FOUND</p>
          <p className="text-xs text-slate-500 mt-1">Please try modifying your search filters.</p>
        </div>
      ) : selectedFilter === 'hierarchy' && !searchQuery ? (
        // Hierarchical cluster layout
        renderHierarchyView()
      ) : (
        // Standard matching grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredMembers.map((member) => {
            const tier = getMemberTier(member);
            return renderMemberCard(member, tier.color);
          })}
        </div>
      )}

    </div>
  );
}
