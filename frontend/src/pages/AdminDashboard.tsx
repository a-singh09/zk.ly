import { Settings, Plus, Network, Layers, Upload } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Spaces');

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
             <Settings className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">Creator Console</h1>
        </div>
        <button className="px-6 py-3 bg-[#0A0A0A] border border-white/20 text-white font-bold tracking-widest uppercase hover:border-bright-blue transition-colors text-sm flex items-center gap-3">
           <Plus size={18} /> New Space
        </button>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 mb-12">
          {['Spaces', 'Sprints', 'Quest Builder', 'Permissions'].map(t => (
             <button 
               key={t}
               onClick={() => setActiveTab(t)}
               className={`px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all border ${
                 activeTab === t ? 'bg-bright-blue border-bright-blue text-white' : 'bg-[#161616] border-white/10 text-white/50 hover:bg-[#232323] hover:text-white'
               }`}
             >
               {t}
             </button>
          ))}
        </div>

        {activeTab === 'Spaces' && (
          <div className="bg-[#161616] border border-white/10 p-10">
            <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-8 text-white flex items-center gap-3">
               <Layers className="text-bright-blue" /> Active Protocol Spaces
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-[#0A0A0A] border border-white/10 p-8 hover:border-bright-blue transition-colors cursor-pointer group">
                  <h3 className="text-2xl font-bold font-heading uppercase mb-2 group-hover:text-bright-blue transition-colors">Midnight Fellowship</h3>
                  <div className="flex items-center gap-4 text-sm font-mono text-white/50 mb-6 uppercase tracking-widest">
                     <span className="bg-[#161616] px-3 py-1 border border-white/5">Q2 SPRINT ACTIVE</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                     <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-2xl font-black text-white">34</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Quests</div>
                     </div>
                     <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-2xl font-black text-white">1.4K</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Members</div>
                     </div>
                     <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-2xl font-black text-white">32K</div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">XP Issued</div>
                     </div>
                  </div>
                  <button className="w-full py-4 text-center border-2 border-white/10 text-white font-bold tracking-widest uppercase hover:border-white transition-colors text-xs">
                     Manage Space
                  </button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'Quest Builder' && (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <div className="bg-[#161616] border border-white/10 p-10">
               <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-8 text-white">Configure New Quest</h2>
               <div className="space-y-8">
                 <div>
                   <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Quest Title</label>
                   <input type="text" className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white" placeholder="E.g. Submit a PR to docs/tutorials" />
                 </div>
                 <div className="grid md:grid-cols-2 gap-6">
                   <div>
                     <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">XP Bounty</label>
                     <input type="number" className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white text-xl" defaultValue="200" />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Frequency Gate</label>
                     <select className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white appearance-none">
                        <option>One-Time</option>
                        <option>Daily</option>
                        <option>Weekly</option>
                     </select>
                   </div>
                 </div>
                 
                 <div className="border-t border-white/10 pt-8">
                   <h3 className="text-sm font-bold font-heading uppercase tracking-widest mb-6 text-white">Private Acceptance Criteria</h3>
                   <p className="text-white/40 text-sm mb-6 max-w-xl">
                      Criteria bytes are sent directly to Midnight's private ledger state. Only the immutable commitment hash survives on-chain.
                   </p>
                   <div className="w-full border-2 border-dashed border-white/20 p-12 flex flex-col items-center justify-center bg-[#0A0A0A] hover:bg-[#121212] transition-colors cursor-pointer group">
                      <Upload size={32} className="text-white/30 group-hover:text-bright-blue mb-4 transition-colors" />
                      <div className="font-bold text-white uppercase tracking-widest mb-2">Upload Rubric File</div>
                      <div className="text-white/40 text-xs font-mono">Supported: .json, .md, .txt (Max 256 bytes)</div>
                   </div>
                 </div>

                 <button className="w-full py-5 bg-bright-blue text-white font-bold uppercase tracking-widest hover:bg-transparent border border-bright-blue transition-colors text-lg">
                    Build & Commit to Chain
                 </button>
               </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-10 h-fit">
               <h3 className="font-bold uppercase tracking-widest mb-6 pb-4 border-b border-white/10 flex items-center gap-3">
                  <Network className="text-bright-blue" size={20} /> Circuit Checks
               </h3>
               <ul className="space-y-6 text-sm text-white/50 font-mono">
                  <li><strong className="text-white block mb-1">CHECK 1:</strong> Criteria signature matches private persistence state</li>
                  <li><strong className="text-white block mb-1">CHECK 2:</strong> Provided evidence passes requested AI/Git Adapter</li>
                  <li><strong className="text-white block mb-1">CHECK 3:</strong> Evaluated score supersedes defined threshold boundary</li>
               </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
