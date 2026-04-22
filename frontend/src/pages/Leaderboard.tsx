import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, Loader2 } from "lucide-react";
import { getLeaderboard } from "../lib/api";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<
    Array<{
      rank: number;
      wallet: string;
      tier: string;
      quests: number;
      spaces: number;
      xpPublic: number;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getLeaderboard();
        if (!cancelled) {
          setLeaders(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load leaderboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadLeaderboard();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
            <Trophy className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">
            Network Leaderboard
          </h1>
        </div>
      </div>

      <div className="p-12 max-w-7xl mx-auto">
        {loading ? (
          <div className="border border-white/10 bg-[#161616] p-8 flex items-center justify-center gap-3 text-white/60 text-sm uppercase tracking-widest">
            <Loader2 size={16} className="animate-spin" /> Loading
            leaderboard...
          </div>
        ) : error ? (
          <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
            {error}
          </div>
        ) : leaders.length === 0 ? (
          <div className="border border-white/10 bg-[#161616] p-8 text-white/60 text-sm">
            No leaderboard data yet.
          </div>
        ) : (
          <div className="bg-[#161616] border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0A0A0A]">
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Rank
                    </th>
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Completer Identity
                    </th>
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Verified Tier
                    </th>
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Total Quests
                    </th>
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Spaces
                    </th>
                    <th className="px-10 py-6 text-xs font-bold text-white/40 uppercase tracking-[0.2em] whitespace-nowrap">
                      Public XP
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaders.map((leader) => (
                    <tr
                      key={`${leader.rank}-${leader.wallet}`}
                      className="hover:bg-[#232323] transition-colors"
                    >
                      <td className="px-10 py-8">
                        <span
                          className={`font-black font-heading text-2xl ${leader.rank <= 3 ? "text-bright-blue" : "text-white/40"}`}
                        >
                          {leader.rank.toString().padStart(2, "0")}
                        </span>
                      </td>
                      <td className="px-10 py-8 font-mono text-lg">
                        <Link
                          to={`/profile/${encodeURIComponent(leader.wallet)}`}
                          className="hover:text-bright-blue transition-colors"
                        >
                          {leader.wallet}
                        </Link>
                      </td>
                      <td className="px-10 py-8">
                        <span
                          className={`inline-flex px-4 py-2 text-xs font-bold tracking-[0.2em] uppercase border ${
                            leader.tier === "LEGEND"
                              ? "bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/50"
                              : leader.tier === "ARCHITECT"
                                ? "bg-[#C0C0C0]/10 text-[#C0C0C0] border-[#C0C0C0]/50"
                                : "bg-[#0A0A0A] text-white/80 border-white/20"
                          }`}
                        >
                          {leader.tier}
                        </span>
                      </td>
                      <td className="px-10 py-8 text-xl font-bold">
                        {leader.quests}
                      </td>
                      <td className="px-10 py-8 text-white/50">
                        {leader.spaces} Active
                      </td>
                      <td className="px-10 py-8 text-white/90 font-mono">
                        {leader.xpPublic}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
