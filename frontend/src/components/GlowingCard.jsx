import React from 'react';

export default function GlowingCard({ children, className = '', hoverGlow = 'emerald' }) {
  const glowColors = {
    emerald: 'hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:border-emerald-500/30',
    indigo: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:border-indigo-500/30',
    blue: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:border-blue-500/30',
    rose: 'hover:shadow-[0_0_20px_rgba(244,63,94,0.2)] hover:border-rose-500/30',
  };

  const activeGlow = glowColors[hoverGlow] || glowColors.emerald;

  return (
    <div className={`glass-panel rounded-2xl p-6 transition-all duration-300 border border-slate-800/40 hover:-translate-y-1.5 ${activeGlow} ${className}`}>
      {children}
    </div>
  );
}
