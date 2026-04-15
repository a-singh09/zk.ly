import { useParams, Link } from 'react-router-dom';
import { Network, GitMerge, Settings, MessageSquare, Code, MonitorPlay } from 'lucide-react';
import { useState } from 'react';

export default function SprintDashboard() {
  const { id } = useParams();
  const [activeTrack, setActiveTrack] = useState('Builder Track');
  
  const tracks = ['Builder Track', 'Educator Track', 'Advocate Track', 'Community Leadership Track'];
  
  const quests = [
    { id: "pr-merge", title: "Submit a PR to docs/tutorials", xp: 200, freq: "Daily", icon: <GitMerge size={20} /> },
    { id: "tech-pr", title: "Submit a Technical PR (Protocol/SDK/Examples)", xp: 400, freq: "One-Time", icon: <Code size={20} /> },
    { id: "bug", title: "Submit a Meaningful Bug Report", xp: 200, freq: "Daily", icon: <Settings size={20} /> },
    { id: "review", title: "Review Someone Else's PR or Code", xp: 120, freq: "Daily", icon: <Network size={20} /> },
    { id: "translate", title: "Translate or Localize Technical Documentation", xp: 100, freq: "Daily", icon: <MessageSquare size={20} /> },
    { id: "video", title: "Publish an Explainer Video", xp: 200, freq: "Daily", icon: <MonitorPlay size={20} /> }
  ];

  return (
    <div className="w-full">
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8 justify-between">
        <h1 className="font-heading font-bold text-xl uppercase tracking-widest">{id?.replace('-', ' ')}</h1>
        <div className="text-sm font-mono text-bright-blue font-bold tracking-widest">Q2 SPRINT · 47 DAYS LEFT</div>
      </div>

      <div className="p-8">
        
        <div className="flex flex-wrap gap-2 mb-8">
          {tracks.map(t => (
            <button 
              key={t}
              onClick={() => setActiveTrack(t)}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider border transition-colors ${activeTrack === t ? 'bg-white text-midnight border-white' : 'bg-[#161616] text-white/70 border-white/10 hover:border-white/30 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="h-48 border border-white/10 mb-8 relative overflow-hidden bg-gradient-to-r from-[#0000FE] to-[#121212] flex items-center px-12">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold font-heading text-white mb-4 uppercase">{activeTrack}</h2>
            <div className="text-white/80 font-mono mt-4 py-2 px-4 bg-black/40 border border-white/20 inline-block font-bold">14 Active Quests</div>
          </div>
          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20" style={{ backgroundImage: "radial-gradient(circle at center, white 2px, transparent 2px)", backgroundSize: "20px 20px" }}></div>
        </div>

        <div className="bg-[#161616] border border-white/10 p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quests.map((q, i) => (
              <Link 
                key={i} 
                to={`/spaces/${id}/claim/${q.id}`} 
                className="bg-[#232323] border border-white/5 hover:border-bright-blue transition-all flex flex-col justify-between h-48 p-6 group focus:outline-none focus:ring-2 focus:ring-bright-blue"
              >
                <div className="flex justify-between items-start gap-4">
                  <h3 className="font-bold text-lg leading-tight group-hover:text-bright-blue transition-colors line-clamp-3">
                    {q.title}
                  </h3>
                  <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-[#161616] to-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="text-[10px] uppercase font-bold text-white/50 tracking-widest relative z-10">XP</div>
                    <div className="text-xl font-heading font-black text-white relative z-10">{q.xp}</div>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <div className="bg-[#121212] flex items-center justify-center w-8 h-8 text-white/50 border border-white/5">
                    {q.icon}
                  </div>
                  <div className="bg-[#121212] px-3 py-1 flex items-center border border-white/5 text-xs font-mono text-white/60">
                    <div className="w-2 h-2 bg-bright-blue mr-2 shrink-0"></div>
                    {q.freq}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
