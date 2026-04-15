import { Trophy } from 'lucide-react';

export default function Leaderboard() {
  const leaders = [
    { rank: 1, key: "0x7f3...a9b2", tier: "LEGEND", quests: 89, spaces: 4 },
    { rank: 2, key: "0x2a1...4f3e", tier: "ARCHITECT", quests: 71, spaces: 3 },
    { rank: 3, key: "0xb9c...7d1a", tier: "ARCHITECT", quests: 64, spaces: 4 },
    { rank: 4, key: "0xc8f...2e9f", tier: "BUILDER", quests: 45, spaces: 2 },
    { rank: 5, key: "0x1d4...8c5b", tier: "BUILDER", quests: 42, spaces: 3 },
  ];

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
             <Trophy className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">Network Leaderboard</h1>
        </div>
      </div>

      <div className="p-12 max-w-7xl mx-auto">
        <div className="bg-[#161616] border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#0A0A0A]">
                  <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Rank</th>
                  <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Completer Identity</th>
                  <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Verified Tier</th>
                  <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Total Quests</th>
                  <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">Spaces</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaders.map((l) => (
                  <tr key={l.rank} className="hover:bg-[#232323] transition-colors">
                    <td className="px-10 py-8">
                      <span className={`font-black font-heading text-2xl ${l.rank <= 3 ? 'text-bright-blue' : 'text-white/40'}`}>
                         0{l.rank}
                      </span>
                    </td>
                    <td className="px-10 py-8 font-mono text-lg">{l.key}</td>
                    <td className="px-10 py-8">
                      <span className={`inline-flex px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase border ${
                        l.tier === 'LEGEND' ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/50' : 
                        l.tier === 'ARCHITECT' ? 'bg-[#C0C0C0]/10 text-[#C0C0C0] border-[#C0C0C0]/50' : 
                        'bg-[#0A0A0A] text-white/80 border-white/20'
                      }`}>
                        {l.tier}
                      </span>
                    </td>
                    <td className="px-10 py-8 text-xl font-bold">{l.quests}</td>
                    <td className="px-10 py-8 text-white/50">{l.spaces} Active</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
