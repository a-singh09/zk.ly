import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getReviewerPolicies,
  createQuest,
  updateQuest,
  getQuest,
  type ReviewerPolicyRecord,
} from "../lib/api";

export default function QuestManagement() {
  const { spaceId, questId } = useParams<{
    spaceId: string;
    questId?: string;
  }>();
  const navigate = useNavigate();
  const isEditing = questId && questId !== "new";

  const [policies, setPolicies] = useState<ReviewerPolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<
    "blog" | "github" | "social" | "onchain" | "custom"
  >("blog");
  const [policyId, setPolicyId] = useState<string>("");
  const [reward, setReward] = useState(100);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const policiesResponse = await getReviewerPolicies();
        setPolicies(policiesResponse.items);

        if (isEditing && questId) {
          const questResponse = await getQuest(questId);
          setName(questResponse.name);
          setDescription(questResponse.description);
          setType(questResponse.type);
          setPolicyId(questResponse.policyId || "");
          setReward(questResponse.reward);
          setActive(questResponse.active);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load quest data",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [questId, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !description.trim() || !spaceId) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && questId) {
        await updateQuest(questId, {
          name: name.trim(),
          description: description.trim(),
          type,
          policyId: policyId || undefined,
          reward,
          active,
        });
        setSuccess("Quest updated successfully!");
        setTimeout(() => navigate(`/spaces/${spaceId}`), 1500);
      } else {
        await createQuest({
          spaceId,
          name: name.trim(),
          description: description.trim(),
          type,
          policyId: policyId || undefined,
          reward,
        });
        setSuccess("Quest created successfully!");
        setName("");
        setDescription("");
        setType("blog");
        setPolicyId("");
        setReward(100);
        setTimeout(() => navigate(`/spaces/${spaceId}`), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save quest");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <Loader2 className="animate-spin text-bright-blue" size={48} />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#0A0A0A]">
      <div className="p-6 lg:p-12 max-w-4xl mx-auto">
        <button
          onClick={() => navigate(`/spaces/${spaceId}`)}
          className="flex items-center gap-2 text-bright-blue hover:text-bright-blue/80 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Space
        </button>

        <div className="mb-12">
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white mb-2">
            {isEditing ? "Edit Quest" : "Create New Quest"}
          </h1>
          <p className="text-white/60">
            {isEditing
              ? "Update the quest details and policies below"
              : "Add a new quest to this space"}
          </p>
        </div>

        {error && (
          <div className="mb-6 flex gap-3 border border-red-500/30 bg-red-500/10 text-red-200 p-4 rounded">
            <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 flex gap-3 border border-green-500/30 bg-green-500/10 text-green-200 p-4 rounded">
            <CheckCircle2 size={20} className="flex-shrink-0 mt-0.5" />
            <p>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="border border-white/10 bg-[#161616] p-8">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                  Quest Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Write a Midnight Tutorial"
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white placeholder-white/40 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed description of the quest..."
                  rows={5}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white placeholder-white/40 transition-colors resize-none"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                    Quest Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                  >
                    <option value="blog">Blog/Tutorial</option>
                    <option value="github">GitHub</option>
                    <option value="social">Social</option>
                    <option value="onchain">On-Chain</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                    Reward (XP)
                  </label>
                  <input
                    type="number"
                    value={reward}
                    onChange={(e) =>
                      setReward(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min="0"
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                  Review Policy (Optional)
                </label>
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                >
                  <option value="">None - Manual Review</option>
                  {policies.map((policy) => (
                    <option key={policy.id} value={policy.id}>
                      {policy.agentId} ({policy.category})
                    </option>
                  ))}
                </select>
              </div>

              {isEditing && (
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <input
                    type="checkbox"
                    id="active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label
                    htmlFor="active"
                    className="text-sm font-bold uppercase tracking-widest text-white/80 cursor-pointer"
                  >
                    Quest is Active
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/spaces/${spaceId}`)}
              className="px-8 py-4 border border-white/20 text-white font-bold tracking-widest uppercase hover:border-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-bright-blue/90 transition-colors border border-bright-blue disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <Loader2 size={18} className="animate-spin" />}
              {isEditing ? "Update Quest" : "Create Quest"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
