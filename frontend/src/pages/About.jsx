import React from 'react';
import { ShieldCheck, HeartHandshake, Compass, Users } from 'lucide-react';

export default function About() {
  const values = [
    {
      title: 'Collaboration First',
      desc: 'Coding is a team sport. We emphasize group peer review, team hackathons, and shared workspace contributions.',
      icon: <Users className="text-emerald-400" size={24} />
    },
    {
      title: 'Continuous Learning',
      desc: 'Technology shifts fast. We hold regular workshops and coding labs to stay ahead in web, cloud, and AI engineering.',
      icon: <Compass className="text-indigo-400" size={24} />
    },
    {
      title: 'Ethical Engineering',
      desc: 'We advocate for building secure, inclusive, and privacy-first digital solutions that serve the wider student body.',
      icon: <ShieldCheck className="text-blue-400" size={24} />
    },
    {
      title: 'Community Mentoring',
      desc: 'Seniors help juniors. We cultivate a pay-it-forward coding hierarchy where everyone shares materials, guides, and sheets.',
      icon: <HeartHandshake className="text-amber-400" size={24} />
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24 pb-20">
      
      {/* 1. BRAND STORY / MISSION */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 text-left">
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            // WHO_WE_ARE
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight">
            About <span className="text-emerald-400">GFGCOE Coding Club</span>
          </h1>
          <p className="text-slate-400 leading-relaxed">
            Established in 2023, the GeeksforGeeks Student Chapter of GFG College of Engineering (GFGCOE) was founded with a singular aim: to bridge the gap between academic theory and active software industry requirements. 
          </p>
          <p className="text-slate-400 leading-relaxed">
            What started as a modest group of 15 computer science students holding DSA sessions has blossomed into Pune's premier programming cohort. We connect software engineers, web architects, algorithmic puzzle solvers, and system designers into a cohesive unit that builds beautiful open-source software and represents our college in national-level contests.
          </p>
        </div>

        {/* Dynamic Image or Mock Frame */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-indigo-500/10 rounded-2xl blur-xl pointer-events-none"></div>
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=600"
            alt="Students collaborating on code"
            className="rounded-2xl border border-slate-800 shadow-2xl relative z-10 w-full object-cover max-h-[380px]"
          />
        </div>
      </section>

      {/* 2. THE FOCUS PILLARS */}
      <section className="space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">
            Our Key <span className="text-emerald-400">Focus Areas</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            We structure our calendar around four key pillars to deliver comprehensive technical growth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-800/40 hover:border-emerald-500/10 transition-all duration-300">
              <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/30 w-fit mb-4">
                {val.icon}
              </div>
              <h3 className="text-lg font-bold text-slate-100">{val.title}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                {val.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. FACULTY MESSAGES */}
      <section className="glass-panel p-8 md:p-12 rounded-3xl border border-slate-800/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/5 blur-[80px] pointer-events-none"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center text-left">
          
          <div className="md:col-span-3 flex justify-center">
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
              alt="Faculty Sponsor"
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-2 border-emerald-400/20"
            />
          </div>

          <div className="md:col-span-9 space-y-4">
            <span className="text-[11px] font-mono tracking-widest text-emerald-400 uppercase">
              // ADVISOR_CORNER
            </span>
            <blockquote className="text-base md:text-lg text-slate-300 italic font-medium leading-relaxed">
              "Technology is moving at a blistering pace. Our goal with this coding chapter is to cultivate raw logic, nurture architectural curiosity, and inspire students to build applications that solve real community challenges. The energy in this club is truly remarkable."
            </blockquote>
            <div>
              <h4 className="font-bold text-slate-100">Prof. Rajesh K. Sharma</h4>
              <p className="text-xs text-slate-500 font-mono">FACULTY ADVISOR, DEPT. OF COMPUTER ENGINEERING</p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
