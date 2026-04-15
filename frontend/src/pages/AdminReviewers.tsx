import { Bot, Shield, TerminalSquare } from 'lucide-react';

export default function AdminReviewers() {

  const agents = [
    { id: "zkquest-builder-v1", model: "claude-3-opus", category: "TECHNICAL", evals: 412, status: "ACTIVE" },
    { id: "zkquest-educator-v1", model: "gpt-4-turbo", category: "CONTENT", evals: 809, status: "ACTIVE" },
    { id: "zkquest-advocate-v2", model: "claude-3-sonnet", category: "COMMUNITY", evals: 112, status: "ACTIVE" },
  ];

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
             <Bot className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">AI Registry</h1>
        </div>
        <div className="text-sm font-mono text-bright-blue tracking-widest uppercase font-bold">Reviewer Subsystem Admin</div>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-12">
        
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#161616] border border-white/10">
            <div className="flex items-center justify-between p-8 border-b border-white/10 bg-[#0A0A0A]">
              <h2 className="text-xl font-heading font-bold uppercase tracking-widest">Active Reviewer Nodes</h2>
              <button className="px-6 py-2 bg-bright-blue text-xs font-bold uppercase tracking-widest text-white hover:bg-transparent border border-bright-blue transition-colors">
                 Register Node
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-8 py-5 text-xs text-white/40 uppercase tracking-widest">Agent Signature (ID)</th>
                    <th className="px-8 py-5 text-xs text-white/40 uppercase tracking-widest">Model Binding</th>
                    <th className="px-8 py-5 text-xs text-white/40 uppercase tracking-widest">Category</th>
                    <th className="px-8 py-5 text-xs text-white/40 uppercase tracking-widest">Evaluations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                   {agents.map((agent, i) => (
                      <tr key={i} className="hover:bg-[#232323] transition-colors">
                        <td className="px-8 py-6 font-bold text-white">{agent.id}</td>
                        <td className="px-8 py-6 text-white/60 text-sm">{agent.model}</td>
                        <td className="px-8 py-6">
                           <span className="bg-[#0A0A0A] border border-white/20 px-3 py-1 text-xs">{agent.category}</span>
                        </td>
                        <td className="px-8 py-6 text-bright-blue font-bold">{agent.evals}</td>
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-bright-blue/30 p-8 h-fit">
             <h3 className="flex items-center gap-3 text-lg font-bold font-heading uppercase tracking-widest mb-6 text-white">
                <Shield className="text-bright-blue" size={24} /> Immutable Audit
             </h3>
             <p className="text-white/50 text-sm leading-relaxed mb-6">
                Evaluations executed by registered AI agents issue an on-chain audit certificate. AI review limits and parameters are inherently locked by the policy deployed below.
             </p>
             <div className="bg-[#161616] p-4 font-mono text-[10px] text-bright-blue/80 border border-white/10 break-all">
                Registry Contract: <br/> 0xab9c...2f09 <br/>
                Policy Contract: <br/> 0x1fca...d011
             </div>
          </div>
        </div>

        <div className="bg-[#161616] border border-white/10 p-10">
           <h2 className="text-xl font-heading font-bold uppercase tracking-widest mb-8 border-b border-white/10 pb-6 flex items-center gap-3">
              <TerminalSquare className="text-bright-blue" /> Deploy New Evaluation Policy
           </h2>
           <form className="max-w-3xl space-y-8">
              <div>
                 <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Policy Target Space</label>
                 <select className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white appearance-none cursor-pointer">
                    <option>Midnight Fellowship</option>
                    <option>Oblivion Protocol</option>
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Base Score Threshold (0-10000)</label>
                 <input type="number" defaultValue="7000" className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white text-xl" />
              </div>
              <div>
                 <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">Rubric / Policy Dimension Payload</label>
                 <textarea rows={6} className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white/60 text-sm leading-relaxed" defaultValue={`{
  "accuracy": 0.4,
  "technical_depth": 0.4,
  "readability": 0.2
}`}></textarea>
              </div>
              <button type="button" className="px-10 py-5 bg-bright-blue text-white font-bold uppercase tracking-[0.2em] hover:bg-[#0000FE]/80 transition-colors">
                 Commit Policy to Ledger
              </button>
           </form>
        </div>

      </div>
    </div>
  );
}
