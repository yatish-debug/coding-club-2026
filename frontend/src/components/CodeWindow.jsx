import React, { useState, useEffect } from 'react';

export default function CodeWindow() {
  const codeSnippets = [
    {
      lang: 'JavaScript',
      code: `// Welcome to GFGCOE Coding Club!
const club = {
  name: "GFGCOE Coding Club",
  mission: "Empower future developers",
  activities: ["Hackathons", "DSA", "WebDev", "OpenSource"],
  status: "ACTIVE_AND_READY"
};

function runClub() {
  console.log(\`Initializing \${club.name}...\`);
  club.activities.forEach(act => {
    console.log(\`🚀 Launching \${act} session!\`);
  });
  return "SUCCESS";
}

runClub();`
    },
    {
      lang: 'Python',
      code: `# GFGCOE Coding Club - Event Planner
import datetime

class CodingClub:
    def __init__(self):
        self.members = 500
        self.status = "Innovating"

    def schedule_hackathon(self):
        date = datetime.date(2026, 6, 15)
        print(f"ByteCraft Hackathon slated for {date}!")
        return "Register Now!"

gfgcoe = CodingClub()
gfgcoe.schedule_hackathon()`
    }
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setTypedText('');
    setIndex(0);
  }, [activeTab]);

  useEffect(() => {
    const fullText = codeSnippets[activeTab].code;
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setTypedText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 15); // Fast typing speed
      return () => clearTimeout(timeout);
    }
  }, [index, activeTab]);

  return (
    <div className="terminal-window glass-panel text-left w-full max-w-xl mx-auto overflow-hidden transition-all duration-300">
      {/* Header controls bar */}
      <div className="terminal-header flex items-center justify-between">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
        </div>
        <div className="flex gap-1 bg-slate-900/50 rounded-lg p-0.5 border border-slate-800/40">
          {codeSnippets.map((snippet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === idx
                  ? 'bg-emerald-500/10 text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {snippet.lang}
            </button>
          ))}
        </div>
        <div className="w-12"></div>
      </div>
      
      {/* Code window block body */}
      <div className="terminal-body p-6 overflow-y-auto h-72 text-sm leading-relaxed text-slate-300">
        <pre className="font-mono whitespace-pre-wrap">
          <code>
            {typedText}
            <span className="animate-pulse font-bold text-emerald-400">|</span>
          </code>
        </pre>
      </div>
    </div>
  );
}
