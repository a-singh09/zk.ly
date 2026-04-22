import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import {
  getSpaces,
  getQuestsBySpace,
  deleteQuest,
  publishQuestOnChain,
  type SpaceRecord,
  type QuestRecord,
} from "../lib/api";

export default function SpaceDetail() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();

  const [space, setSpace] = useState<SpaceRecord | null>(null);
  const [quests, setQuests] = useState<QuestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!spaceId) return;
      setLoading(true);
      setError(null);
      try {
        const spacesResponse = await getSpaces();
        const foundSpace = spacesResponse.items.find((s) => s.id === spaceId);
        if (!foundSpace) {
          setError("Space not found");
          return;
        }
        setSpace(foundSpace);

        const questsResponse = await getQuestsBySpace(spaceId);
        setQuests(questsResponse.items);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load space details",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [spaceId]);

  const handleDeleteQuest = async (questId: string) => {
    if (!confirm("Are you sure you want to delete this quest?")) return;

    setDeleting(questId);
    try {
      await deleteQuest(questId);
      setQuests((prev) => prev.filter((q) => q.id !== questId));
      if (space) {
        setSpace({ ...space, quests: Math.max(0, space.quests - 1) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete quest");
    } finally {
      setDeleting(null);
    }
  };

  const handlePublishQuest = async (questId: string) => {
    setError(null);
    setPublishing(questId);
    try {
      const updated = await publishQuestOnChain(questId);
      setQuests((prev) => prev.map((q) => (q.id === questId ? updated : q)));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to publish quest on-chain",
      );
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="animate-spin text-bright-blue" size={48} />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="w-full min-h-screen bg-[#0A0A0A] p-6 lg:p-12">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2 text-bright-blue hover:text-bright-blue/80 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Admin
          </button>
          <div className="border border-red-500/30 bg-red-500/10 text-red-200 p-6 rounded">
            {error || "Space not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A]">
      <div className="p-6 lg:p-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2 text-bright-blue hover:text-bright-blue/80 mb-4"
            >
              <ArrowLeft size={20} />
              Back to Admin
            </button>
            <h1 className="font-heading font-black text-4xl uppercase tracking-widest text-white">
              {space.name}
            </h1>
            <p className="text-white/60 mt-2 text-lg">{space.desc}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Members
            </div>
            <div className="text-3xl font-black">{space.members}</div>
          </div>
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Total Quests
            </div>
            <div className="text-3xl font-black">{space.quests}</div>
          </div>
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Created
            </div>
            <div className="text-sm font-mono text-white/80">
              {new Date(space.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-heading font-black text-2xl uppercase tracking-widest text-white">
            Quests
          </h2>
          <Link
            to={`/spaces/${spaceId}/quests/new`}
            className="flex items-center gap-2 px-6 py-3 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-bright-blue/90 transition-colors border border-bright-blue"
          >
            <Plus size={18} />
            Add Quest
          </Link>
        </div>

        {error && (
          <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-200 p-4 rounded text-sm">
            {error}
          </div>
        )}

        {quests.length === 0 ? (
          <div className="border border-white/10 bg-[#161616] p-12 text-center">
            <p className="text-white/60 text-lg mb-4">No quests yet</p>
            <Link
              to={`/spaces/${spaceId}/quests/new`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-bright-blue/90 transition-colors border border-bright-blue"
            >
              <Plus size={18} />
              Create First Quest
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {quests.map((quest) => (
              <div
                key={quest.id}
                className="border border-white/10 bg-[#161616] p-6 hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">
                      {quest.name}
                    </h3>
                    <p className="text-white/60 mb-4 text-sm">
                      {quest.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-xs">
                      <span className="border border-white/10 px-3 py-1 bg-[#0A0A0A] text-white/80">
                        Type: <span className="font-mono">{quest.type}</span>
                      </span>
                      <span className="border border-white/10 px-3 py-1 bg-[#0A0A0A] text-white/80">
                        Track: <span className="font-mono">{quest.track}</span>
                      </span>
                      <span className="border border-white/10 px-3 py-1 bg-[#0A0A0A] text-white/80">
                        Reward:{" "}
                        <span className="font-mono">{quest.reward}</span> XP
                      </span>
                      <span className="border border-white/10 px-3 py-1 bg-[#0A0A0A] text-white/80">
                        Reward Mode:{" "}
                        <span className="font-mono">{quest.rewardMode}</span>
                      </span>
                      {quest.onChainQuestId && (
                        <span className="border border-white/10 px-3 py-1 bg-[#0A0A0A] text-white/80">
                          On-Chain ID:{" "}
                          <span className="font-mono">
                            {quest.onChainQuestId}
                          </span>
                        </span>
                      )}
                      <span
                        className={`border px-3 py-1 ${
                          quest.onChainMode === "midnight"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        Chain:{" "}
                        {quest.onChainMode === "midnight"
                          ? "Midnight"
                          : "Local Fallback"}
                      </span>
                      {quest.onChainMode !== "midnight" &&
                        quest.onChainReason && (
                          <span className="border border-amber-400/20 px-3 py-1 bg-amber-500/5 text-amber-200 max-w-full break-all">
                            {quest.onChainReason}
                          </span>
                        )}
                      {quest.policyId && (
                        <span className="border border-bright-blue/30 px-3 py-1 bg-bright-blue/10 text-bright-blue">
                          Policy:{" "}
                          <span className="font-mono">{quest.policyId}</span>
                        </span>
                      )}
                      <span
                        className={`border px-3 py-1 ${
                          quest.active
                            ? "border-green-500/30 bg-green-500/10 text-green-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                        }`}
                      >
                        {quest.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {quest.onChainMode !== "midnight" && (
                      <button
                        onClick={() => handlePublishQuest(quest.id)}
                        disabled={publishing === quest.id}
                        className="px-3 border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold uppercase tracking-widest"
                        title="Publish quest to Midnight"
                      >
                        {publishing === quest.id ? "Publishing..." : "Publish"}
                      </button>
                    )}
                    <Link
                      to={`/spaces/${spaceId}/quests/${quest.id}/edit`}
                      className="p-3 border border-white/10 bg-[#0A0A0A] text-white/80 hover:text-bright-blue hover:border-bright-blue transition-colors"
                      title="Edit quest"
                    >
                      <Edit2 size={18} />
                    </Link>
                    <button
                      onClick={() => handleDeleteQuest(quest.id)}
                      disabled={deleting === quest.id}
                      className="p-3 border border-white/10 bg-[#0A0A0A] text-white/80 hover:text-red-400 hover:border-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete quest"
                    >
                      {deleting === quest.id ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Trash2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
