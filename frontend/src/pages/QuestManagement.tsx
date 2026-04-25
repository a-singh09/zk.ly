import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  getReviewerPolicies,
  createQuest,
  updateQuest,
  getQuest,
  type QuestTrack,
  type RewardMode,
  type ReviewerPolicyRecord,
} from "../lib/api";
import { useMidnightWallet } from "../lib/MidnightWalletContext";
import {
  QUEST_REGISTRY_ADDRESS,
  type QuestRewardMode,
} from "../lib/questContractApi";
import { createQuestOnChain } from "../lib/midnightConnectorExecutor";

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
  const [track, setTrack] = useState<QuestTrack>("builder");
  const [policyId, setPolicyId] = useState<string>("");
  const [reward, setReward] = useState(100);
  const [rewardMode, setRewardMode] = useState<RewardMode>("xp-only");
  const [escrowContractAddress, setEscrowContractAddress] = useState("");
  const [escrowAmount, setEscrowAmount] = useState(0);
  const [criteriaJson, setCriteriaJson] = useState(
    JSON.stringify(
      {
        technicalDepth: 0.4,
        factualAccuracy: 0.3,
        clarity: 0.2,
        originality: 0.1,
        steps: [
          "It should explain shielded transactions clearly",
          "It should be clearly documented with working examples",
        ],
      },
      null,
      2,
    ),
  );
  const [active, setActive] = useState(true);
  const { isConnected, walletAddress, connectWallet, connectedWalletApi } = useMidnightWallet();

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
          setTrack(questResponse.track);
          setPolicyId(questResponse.policyId || "");
          setReward(questResponse.reward);
          setRewardMode(questResponse.rewardMode);
          setEscrowContractAddress(questResponse.escrowContractAddress || "");
          setEscrowAmount(questResponse.escrowAmount || 0);
          setCriteriaJson(
            JSON.stringify(
              questResponse.criteriaJson ?? {
                technicalDepth: 0.4,
                factualAccuracy: 0.3,
                clarity: 0.2,
                originality: 0.1,
              },
              null,
              2,
            ),
          );
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

    if (rewardMode === "escrow-auto") {
      if (!escrowContractAddress.trim()) {
        setError("Escrow contract address is required for escrow-auto mode.");
        return;
      }
      if (escrowAmount <= 0) {
        setError("Escrow amount must be greater than 0 for escrow-auto mode.");
        return;
      }
    }

    setSaving(true);
    try {
      console.info("[quest:create-ui] submitting quest payload", {
        isEditing,
        spaceId,
        rewardMode,
      });

      const parsedCriteria = JSON.parse(criteriaJson) as Record<
        string,
        unknown
      >;

      if (isEditing && questId) {
        // ---- Update existing quest (backend-only, no re-registration needed) ----
        await updateQuest(questId, {
          name: name.trim(),
          description: description.trim(),
          type,
          track,
          policyId: policyId || undefined,
          reward,
          rewardMode,
          escrowContractAddress:
            rewardMode === "escrow-auto"
              ? escrowContractAddress.trim()
              : undefined,
          escrowAmount: rewardMode === "escrow-auto" ? escrowAmount : undefined,
          criteriaJson: parsedCriteria,
          active,
        });
        setSuccess("Quest updated successfully!");
        setTimeout(() => navigate(`/spaces/${spaceId}`), 1500);
      } else {
        // ---- Create new quest ----
        // Step 1: Ensure wallet is connected
        const currentAddress =
          isConnected && walletAddress ? walletAddress : await connectWallet();

        // Step 2: Register quest on Midnight via DApp connector
        let onChainQuestId: string | undefined;
        let onChainTxId: string | undefined;
        let onChainMode: "midnight" | "mock" | "wallet-popup" = "mock";
        let onChainReason = "Not published on-chain. Wallet not connected or signing declined.";

        if (connectedWalletApi) {
          try {
            console.info(
              "[quest:create-chain] Submitting create_quest to Midnight via DApp connector",
              { contractAddress: QUEST_REGISTRY_ADDRESS, spaceId },
            );

            const onChainRewardMode: QuestRewardMode =
              rewardMode === "escrow-auto" ? "ESCROW_AUTOMATIC" : "XP_ONLY";

            const result = await createQuestOnChain({
              connectedApi: connectedWalletApi,
              spaceId,
              sprintId: spaceId, // use spaceId as sprint scope for now
              creatorWalletAddress: currentAddress,
              questType: type.slice(0, 8),
              trackTag: track.slice(0, 8),
              criteriaJson: parsedCriteria,
              xpValue: Math.min(reward, 65535),
              rewardMode: onChainRewardMode,
              escrowContract:
                rewardMode === "escrow-auto"
                  ? escrowContractAddress.trim()
                  : undefined,
              escrowAmount:
                rewardMode === "escrow-auto" ? escrowAmount : undefined,
            });

            onChainQuestId = result.onChainQuestId;
            onChainTxId = result.txId;
            onChainMode = "midnight";
            onChainReason =
              `Quest registered on Midnight quest-registry contract (${QUEST_REGISTRY_ADDRESS}). ` +
              `ZK proof generated and transaction submitted on-chain. Tx: ${result.txId.slice(0, 16)}…`;

            console.info(
              "[quest:create-chain] Quest registered on-chain",
              result,
            );
          } catch (chainErr) {
            console.error(
              "[quest:create-chain] Full error object:",
              chainErr,
              (chainErr as Error)?.stack,
            );
            const chainMsg =
              chainErr instanceof Error
                ? chainErr.message
                : "Unknown on-chain error";
            console.warn(
              "[quest:create-chain] On-chain registration failed, falling back to off-chain",
              chainMsg,
            );
            // Non-fatal: store as mock with failure note
            onChainReason = `On-chain registration failed: ${chainMsg}. Quest saved off-chain only.`;
          }
        } else {
          onChainReason =
            "Midnight Lace wallet not connected. Quest saved off-chain. Connect wallet and use Publish action to register on-chain.";
          console.warn(
            "[quest:create-chain] No DApp connector available — skipping on-chain registration",
          );
        }

        // Step 3: Persist metadata to backend
        await createQuest({
          spaceId,
          name: name.trim(),
          description: description.trim(),
          type,
          track,
          policyId: policyId || undefined,
          reward,
          rewardMode,
          escrowContractAddress:
            rewardMode === "escrow-auto"
              ? escrowContractAddress.trim()
              : undefined,
          escrowAmount: rewardMode === "escrow-auto" ? escrowAmount : undefined,
          criteriaJson: parsedCriteria,
          creatorWallet: currentAddress,
          // Pass the on-chain data from the DApp connector flow
          onChainQuestId,
          onChainTxId,
          onChainMode,
          onChainReason,
          publishOnChain: false, // Already handled above via DApp connector
        });

        setSuccess(
          onChainQuestId
            ? `Quest created (ID: ${onChainQuestId.slice(0, 12)}…).`
            : "Quest created.",
        );

        setName("");
        setDescription("");
        setType("blog");
        setTrack("builder");
        setPolicyId("");
        setReward(100);
        setRewardMode("xp-only");
        setEscrowContractAddress("");
        setEscrowAmount(0);
        setCriteriaJson(
          JSON.stringify(
            {
              technicalDepth: 0.4,
              factualAccuracy: 0.3,
              clarity: 0.2,
              originality: 0.1,
              steps: [
                "It should explain shielded transactions clearly",
                "It should be clearly documented with working examples",
              ],
            },
            null,
            2,
          ),
        );
        setTimeout(() => navigate(`/spaces/${spaceId}`), 1500);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save quest. Ensure criteria JSON is valid.",
      );
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
              ? "Update the quest details and AI agents below"
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

        {/* Intentionally keep UI minimal here; no extra infra details */}

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
                    Category Track
                  </label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as QuestTrack)}
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                  >
                    <option value="builder">Builder Track</option>
                    <option value="educator">Educator Track</option>
                    <option value="advocate">Advocate Track</option>
                    <option value="community-leadership">
                      Community Leadership Track
                    </option>
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

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                    Reward Mechanism
                  </label>
                  <select
                    value={rewardMode}
                    onChange={(e) =>
                      setRewardMode(e.target.value as RewardMode)
                    }
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                  >
                    <option value="xp-only">XP Only</option>
                    <option value="escrow-auto">
                      Automatic Reward via Escrow Contract
                    </option>
                  </select>
                </div>
              </div>

              {rewardMode === "escrow-auto" && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                      Escrow Contract Address
                    </label>
                    <input
                      type="text"
                      value={escrowContractAddress}
                      onChange={(e) => setEscrowContractAddress(e.target.value)}
                      placeholder="0x... or contract address"
                      className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white placeholder-white/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-white/80 mb-3">
                      Escrow Amount
                    </label>
                    <input
                      type="number"
                      value={escrowAmount}
                      onChange={(e) =>
                        setEscrowAmount(
                          Math.max(0, parseInt(e.target.value) || 0),
                        )
                      }
                      min="0"
                      className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-4 mb-3">
                  <label className="block text-sm font-bold uppercase tracking-widest text-white/80">
                    AI Agents (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={() => navigate("/admin/ai-agents/marketplace")}
                    className="px-3 py-1.5 border border-white/20 text-white/70 text-[10px] font-bold uppercase tracking-widest hover:border-bright-blue hover:text-bright-blue transition-colors"
                  >
                    Marketplace
                  </button>
                </div>
                <select
                  value={policyId}
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue text-white transition-colors"
                >
                  <option value="">None</option>
                  {policies.map((aiAgent) => (
                    <option key={aiAgent.id} value={aiAgent.id}>
                      {aiAgent.agentId} ({aiAgent.category})
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
