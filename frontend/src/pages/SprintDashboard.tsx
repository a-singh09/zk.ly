import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Network,
  GitMerge,
  Settings,
  MessageSquare,
  Code,
  MonitorPlay,
  Loader2,
} from "lucide-react";
import {
  getQuestsBySpace,
  getSpaces,
  type QuestRecord,
  type QuestTrack,
  type SpaceRecord,
} from "../lib/api";

export default function SprintDashboard() {
  const { id } = useParams();
  const [space, setSpace] = useState<SpaceRecord | null>(null);
  const [quests, setQuests] = useState<QuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTrack, setActiveTrack] = useState<QuestTrack>("builder");

  const tracks: Array<{ value: QuestTrack; label: string }> = [
    { value: "builder", label: "Builder Track" },
    { value: "educator", label: "Educator Track" },
    { value: "advocate", label: "Advocate Track" },
    {
      value: "community-leadership",
      label: "Community Leadership Track",
    },
  ];

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    const loadSprint = async () => {
      setLoading(true);
      setError(null);
      try {
        const [spaceResponse, questResponse] = await Promise.all([
          getSpaces(),
          getQuestsBySpace(id),
        ]);
        if (cancelled) return;

        const matchedSpace =
          spaceResponse.items.find((item) => item.id === id) ?? null;
        setSpace(matchedSpace);
        setQuests(questResponse.items.filter((item) => item.active));
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load sprint data.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSprint();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const filteredQuests = useMemo(
    () => quests.filter((quest) => quest.track === activeTrack),
    [quests, activeTrack],
  );

  const questIcon = (quest: QuestRecord) => {
    switch (quest.type) {
      case "github":
        return <GitMerge size={20} />;
      case "custom":
        return <Code size={20} />;
      case "onchain":
        return <Network size={20} />;
      case "social":
        return <MessageSquare size={20} />;
      case "blog":
        return <MonitorPlay size={20} />;
      default:
        return <Settings size={20} />;
    }
  };

  const heading = space?.name ?? id?.replace("-", " ") ?? "Sprint";
  const activeTrackLabel =
    tracks.find((item) => item.value === activeTrack)?.label ?? "Builder Track";

  return (
    <div className="w-full">
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8 justify-between">
        <h1 className="font-heading font-bold text-xl uppercase tracking-widest">
          {heading}
        </h1>
        <div className="text-sm font-mono text-bright-blue font-bold tracking-widest">
          LIVE QUESTS · {quests.length}
        </div>
      </div>

      <div className="p-8">
        <div className="flex flex-wrap gap-2 mb-8">
          {tracks.map((track) => (
            <button
              key={track.value}
              onClick={() => setActiveTrack(track.value)}
              className={`px-5 py-2.5 text-sm font-bold uppercase tracking-wider border transition-colors ${
                activeTrack === track.value
                  ? "bg-white text-midnight border-white"
                  : "bg-[#161616] text-white/70 border-white/10 hover:border-white/30 hover:text-white"
              }`}
            >
              {track.label}
            </button>
          ))}
        </div>

        <div className="h-48 border border-white/10 mb-8 relative overflow-hidden bg-gradient-to-r from-[#0000FE] to-[#121212] flex items-center px-12">
          <div className="relative z-10">
            <h2 className="text-4xl font-bold font-heading text-white mb-4 uppercase">
              {activeTrackLabel}
            </h2>
            <div className="text-white/80 font-mono mt-4 py-2 px-4 bg-black/40 border border-white/20 inline-block font-bold">
              {filteredQuests.length} Active Quests
            </div>
          </div>
          <div
            className="absolute right-0 top-0 h-full w-1/2 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at center, white 2px, transparent 2px)",
              backgroundSize: "20px 20px",
            }}
          ></div>
        </div>

        <div className="bg-[#161616] border border-white/10 p-6 md:p-10">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-white/60 text-sm uppercase tracking-widest gap-3">
              <Loader2 size={16} className="animate-spin" /> Loading quests...
            </div>
          ) : error ? (
            <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
              {error}
            </div>
          ) : filteredQuests.length === 0 ? (
            <div className="border border-white/10 bg-[#0A0A0A] p-6 text-sm text-white/60">
              No active quests found for this track.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredQuests.map((quest) => (
                <Link
                  key={quest.id}
                  to={`/spaces/${id}/claim/${quest.id}`}
                  className="bg-[#232323] border border-white/5 hover:border-bright-blue transition-all flex flex-col justify-between min-h-[220px] p-6 group focus:outline-none focus:ring-2 focus:ring-bright-blue"
                >
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="font-bold text-lg leading-tight group-hover:text-bright-blue transition-colors line-clamp-3">
                      {quest.name}
                    </h3>
                    <div className="w-16 h-16 shrink-0 bg-gradient-to-br from-[#161616] to-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="text-[10px] uppercase font-bold text-white/50 tracking-widest relative z-10">
                        XP
                      </div>
                      <div className="text-xl font-heading font-black text-white relative z-10">
                        {quest.reward}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-white/60 mt-4 line-clamp-3">
                    {quest.description}
                  </p>

                  <div className="flex gap-2 mt-4 flex-wrap">
                    <div className="bg-[#121212] flex items-center justify-center w-8 h-8 text-white/50 border border-white/5">
                      {questIcon(quest)}
                    </div>
                    <div className="bg-[#121212] px-3 py-1 flex items-center border border-white/5 text-xs font-mono text-white/60">
                      <div className="w-2 h-2 bg-bright-blue mr-2 shrink-0"></div>
                      {quest.type.toUpperCase()}
                    </div>
                    <div className="bg-[#121212] px-3 py-1 border border-white/5 text-xs font-mono text-white/60">
                      {quest.rewardMode === "escrow-auto"
                        ? "ESCROW AUTO"
                        : "XP ONLY"}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
