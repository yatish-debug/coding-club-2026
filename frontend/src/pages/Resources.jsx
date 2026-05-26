import React, { useState, useEffect } from 'react';
import { 
  Download, ExternalLink, RefreshCw, BookOpen, Search, FileText, 
  Code, BookOpenCheck, Eye, ArrowLeft, ArrowUpRight, Award, User
} from 'lucide-react';
import GlowingCard from '../components/GlowingCard';
import { getResources, trackDownload } from '../utils/api';

const parseMarkdown = (md) => {
  if (!md) return "";
  let html = md;
  // Parse headings
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-slate-200 mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-emerald-450 mt-5 mb-2.5">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-xl font-extrabold text-emerald-400 mt-6 mb-3">$1</h2>');
  // Parse bold
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-100 font-bold">$1</strong>');
  // Parse code blocks
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[11px] text-slate-400 my-4 overflow-x-auto leading-relaxed">$1</pre>');
  // Parse single-line code
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-950 px-1.5 py-0.5 border border-slate-900 text-emerald-400 font-mono text-xs rounded">$1</code>');
  // Parse lists
  html = html.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc text-slate-350 my-1 leading-normal">$1</li>');
  // Parse paragraphs
  return html;
};

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedType, setSelectedType] = useState('All'); // 'All', 'notes', 'sheet', 'pdf', 'blog'
  
  // Blog Reader Viewport modal states
  const [readingBlog, setReadingBlog] = useState(null);

  useEffect(() => {
    fetchResourcesList();
  }, []);

  const fetchResourcesList = async () => {
    try {
      const data = await getResources();
      setResources(data);
    } catch (err) {
      console.error('Failed to load resources', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadClick = async (resId) => {
    try {
      // 1. Report click to backend download count tracker
      await trackDownload(resId);
      
      // 2. Increment download count locally to update UI instantly!
      setResources(prev => prev.map(res => {
        if (res.id === resId) {
          return { ...res, download_count: (res.download_count || 0) + 1 };
        }
        return res;
      }));
    } catch (err) {
      console.error('Download track error:', err);
    }
  };

  const topics = ['All', 'DSA', 'Web Dev', 'AI/ML', 'Competitive Programming'];
  const resourceTypes = [
    { value: 'All', label: 'All Resources', icon: <BookOpen size={13} /> },
    { value: 'notes', label: 'Lecture Notes', icon: <FileText size={13} /> },
    { value: 'sheet', label: 'Coding Sheets', icon: <Code size={13} /> },
    { value: 'pdf', label: 'PDF Documents', icon: <BookOpenCheck size={13} /> },
    { value: 'blog', label: 'Blogs & Tutorials', icon: <User size={13} /> }
  ];

  // Filtering search pipeline
  const filteredResources = resources.filter(res => {
    const matchesSearch = 
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (res.tags && res.tags.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTopic = 
      selectedTopic === 'All' || 
      res.category.toLowerCase() === selectedTopic.toLowerCase();

    const matchesType = 
      selectedType === 'All' || 
      (res.type || 'resource').toLowerCase() === selectedType.toLowerCase();

    return matchesSearch && matchesTopic && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 pb-20 text-left">
      
      {/* 1. Immersive Blog Reader Modal Viewport */}
      {readingBlog && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-3xl rounded-3xl border border-slate-900 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-in text-left">
            <div className="p-6 border-b border-slate-900 flex justify-between items-start gap-4 shrink-0">
              <div className="space-y-1.5 text-left">
                <div className="flex gap-2 items-center">
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    {readingBlog.category} TUTORIAL
                  </span>
                  {readingBlog.author && (
                    <span className="text-[10px] text-slate-500 font-mono">Published by: {readingBlog.author}</span>
                  )}
                </div>
                <h3 className="text-xl font-extrabold text-slate-100">{readingBlog.title}</h3>
              </div>
              <button 
                onClick={() => setReadingBlog(null)} 
                className="px-3.5 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={13} /> CLOSE_READER_
              </button>
            </div>

            {/* Read Content Area */}
            <div className="p-6 md:p-8 overflow-y-auto flex-grow prose prose-invert max-w-none text-slate-300 space-y-4">
              {readingBlog.content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(readingBlog.content) }}
                  className="space-y-3 leading-relaxed text-sm md:text-base font-sans"
                />
              ) : (
                <p className="text-slate-500 italic font-mono text-center py-12">NO_CONTENT_BODY_PROVIDED_FOR_THIS_BLOG</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Title tags */}
      <div className="space-y-4">
        <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
          // EDUCATION_REPOSITORY
        </span>
        <h1 className="text-4xl font-extrabold tracking-tight">
          Club <span className="text-gradient">Resources & Blogs</span>
        </h1>
        <p className="text-slate-400 max-w-xl">
          Curated notes, practice coding sheets, reference PDF templates, and interactive development blogs written by senior lead chapters.
        </p>
      </div>

      {/* Subtype tabs togglers */}
      <div className="flex border-b border-slate-900/60 pb-3 flex-wrap gap-2">
        {resourceTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setSelectedType(t.value)}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedType === t.value
                ? 'bg-emerald-500/10 border border-emerald-400 text-emerald-400 font-bold'
                : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900/40'
            }`}
          >
            {t.icon} {t.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Toolbar inputs */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search bar input */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 pointer-events-none">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search resources, tags, blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Categories toggler list */}
        <div className="flex gap-2 flex-wrap items-center justify-start w-full md:w-auto">
          {topics.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedTopic(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                selectedTopic === cat
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-semibold'
                  : 'bg-slate-900/40 border-slate-800/40 text-slate-400 hover:text-slate-250'
              }`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Grid catalog layout */}
      {loading ? (
        <div className="flex justify-center py-24">
          <RefreshCw className="animate-spin text-emerald-400" size={32} />
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-3xl border border-slate-800/40">
          <p className="text-slate-400 font-mono">NO_RESOURCES_FOUND_MATCHING_THE_QUERY</p>
          <p className="text-xs text-slate-500 mt-1">Please explore alternate keywords or filter topics.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          {filteredResources.map((res) => {
            const isBlog = res.type === 'blog';
            
            return (
              <GlowingCard 
                key={res.id} 
                hoverGlow={isBlog ? "amber" : "emerald"} 
                className="flex flex-col justify-between h-full min-h-[240px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wide uppercase ${
                      isBlog ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}>
                      {res.category} :: {res.type || 'resource'}
                    </span>
                    <span className="text-slate-500" title={res.type}>
                      <BookOpen size={16} />
                    </span>
                  </div>
                  
                  <div className="space-y-2 text-left">
                    <h3 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5">
                      {res.title}
                    </h3>
                    
                    {res.author && (
                      <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                        <User size={10} /> Published by {res.author}
                      </div>
                    )}
                    
                    <p className="text-sm text-slate-400 leading-relaxed pt-1">
                      {res.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-4 mt-6">
                  {res.tags && (
                    <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-900/60">
                      {res.tags.split(',').map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-mono text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10"
                        >
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      {isBlog ? (
                        "✓ READS UNLOCKED"
                      ) : (
                        `📥 ${res.download_count || 0} Downloads`
                      )}
                    </span>
                    
                    {isBlog ? (
                      <button
                        onClick={() => setReadingBlog(res)}
                        className="px-4 py-2 bg-amber-450 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1 font-mono cursor-pointer shadow-md shadow-amber-500/5"
                      >
                        READ_ARTICLE_ <Eye size={11} />
                      </button>
                    ) : (
                      <a
                        href={res.link || '#'}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => handleDownloadClick(res.id)}
                        className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-900 text-xs font-bold rounded-lg transition-all flex items-center gap-1 font-mono cursor-pointer shadow-md"
                      >
                        ACCESS_ <ArrowUpRight size={11} />
                      </a>
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
