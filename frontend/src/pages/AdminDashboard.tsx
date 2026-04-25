import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Plus,
  Shield,
  Settings,
  Store,
} from "lucide-react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-json";
import {
  createReviewerPolicy,
  createSpace,
  decideRewardApproval,
  decideEscalation,
  getCommitment,
  getAdminDisclosures,
  getAdminEscalations,
  getAdminRewardApprovals,
  getReviewerPolicies,
  getSpaces,
  type DisclosureRecord,
  type EscalationRecord,
  type EscalationStatus,
  type RewardApprovalRecord,
  type ReviewerPolicyRecord,
  type SpaceRecord,
} from "../lib/api";
import { useMidnightWallet } from "../lib/MidnightWalletContext";
import { executeAdminRewardDecisionOnChain } from "../lib/midnightConnectorExecutor";

const CodeEditor =
  (Editor as typeof Editor & { default?: typeof Editor }).default ?? Editor;

const tabs = [
  "Overview",
  "Spaces",
  "Rewards",
  "Escalations",
  "AI Agents",
  "Disclosures",
] as const;

const modelOptions = [
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-5.5-medium",
  "claude-4.6-sonnet-medium-thinking",
] as const;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

function highlightJson(code: string) {
  return Prism.highlight(code, Prism.languages.json, "json");
}

export default function AdminDashboard() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Overview");
  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureRecord[]>([]);
  const [escalations, setEscalations] = useState<EscalationRecord[]>([]);
  const [rewardApprovals, setRewardApprovals] = useState<RewardApprovalRecord[]>(
    [],
  );
  const [policies, setPolicies] = useState<ReviewerPolicyRecord[]>([]);
  const [expandedThinking, setExpandedThinking] = useState<string | null>(null);

  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [savingSpace, setSavingSpace] = useState(false);

  const [policyAgentId, setPolicyAgentId] = useState("zkquest-custom-v1");
  const [policyModel, setPolicyModel] = useState("gpt-4.1-mini");
  const [policyCategory, setPolicyCategory] = useState("technical");
  const [policyScoreThreshold, setPolicyScoreThreshold] = useState("70");
  const [policyConfigJson, setPolicyConfigJson] = useState(
    JSON.stringify(
      {
        dimensions: {
          technicalDepth: 0.4,
          factualAccuracy: 0.3,
          clarity: 0.2,
          originality: 0.1,
        },
        steps: [
          "It should explain shielded transactions clearly",
          "It should be clearly documented with working examples",
          "It should demonstrate understanding of ZK proof generation",
        ],
      },
      null,
      2,
    ),
  );
  const [policyMaxTokens, setPolicyMaxTokens] = useState("8000");
  const [policyTimeoutMs, setPolicyTimeoutMs] = useState("12000");
  const [policyRetryLimit, setPolicyRetryLimit] = useState("1");
  const [savingPolicy, setSavingPolicy] = useState(false);

  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);

  const { walletAddress, signWalletAuthorization, connectedWalletApi } =
    useMidnightWallet();

  const pendingEscalations = useMemo(
    () => escalations.filter((item) => item.status === "pending-admin"),
    [escalations],
  );
  const pendingRewardApprovals = useMemo(
    () =>
      rewardApprovals.filter(
        (item) => item.verificationStatus === "pending-admin",
      ),
    [rewardApprovals],
  );

  const loadAdminData = async () => {
    try {
      setAdminError(null);
      const [
        spaceResponse,
        disclosureResponse,
        escalationResponse,
        rewardApprovalResponse,
        policyResponse,
      ] = await Promise.all([
        getSpaces(),
        getAdminDisclosures(),
        getAdminEscalations(),
        getAdminRewardApprovals(),
        getReviewerPolicies(),
      ]);

      setSpaces(spaceResponse.items);
      setDisclosures(disclosureResponse.items);
      setEscalations(escalationResponse.items);
      setRewardApprovals(rewardApprovalResponse.items);
      setPolicies(policyResponse.items);
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Could not load admin dashboard data",
      );
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  useEffect(() => {
    const state = (location.state ?? {}) as {
      activeTab?: (typeof tabs)[number];
      aiAgentTemplate?: {
        agentId?: string;
        model?: string;
        category?: string;
        scoreThreshold?: string;
        maxTokens?: string;
        timeoutMs?: string;
        retryLimit?: string;
        configJson?: string;
      };
    };

    if (state.activeTab) {
      setActiveTab(state.activeTab);
    }
    if (state.aiAgentTemplate) {
      const t = state.aiAgentTemplate;
      if (typeof t.agentId === "string") setPolicyAgentId(t.agentId);
      if (typeof t.model === "string") setPolicyModel(t.model);
      if (typeof t.category === "string") setPolicyCategory(t.category);
      if (typeof t.scoreThreshold === "string")
        setPolicyScoreThreshold(t.scoreThreshold);
      if (typeof t.maxTokens === "string") setPolicyMaxTokens(t.maxTokens);
      if (typeof t.timeoutMs === "string") setPolicyTimeoutMs(t.timeoutMs);
      if (typeof t.retryLimit === "string") setPolicyRetryLimit(t.retryLimit);
      if (typeof t.configJson === "string") setPolicyConfigJson(t.configJson);

      setAdminMessage("Template imported. Review and click Create AI Agent.");
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateSpace = async () => {
    setAdminError(null);
    setAdminMessage(null);

    if (!spaceName.trim() || !spaceDesc.trim()) {
      setAdminError("Space name and description are required.");
      return;
    }

    setSavingSpace(true);
    try {
      const created = await createSpace({
        name: spaceName.trim(),
        desc: spaceDesc.trim(),
        creatorWallet: walletAddress ?? undefined,
      });
      setSpaces((previous) => [created, ...previous]);
      setSpaceName("");
      setSpaceDesc("");
      setAdminMessage("Space created successfully.");
      setActiveTab("Spaces");
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Could not create space",
      );
    } finally {
      setSavingSpace(false);
    }
  };

  const handleEscalationDecision = async (
    escalationId: string,
    status: EscalationStatus,
  ) => {
    setAdminError(null);
    setAdminMessage(null);

    try {
      const updated = await decideEscalation(escalationId, {
        status,
        adminNotes:
          status === "approved"
            ? "Approved after manual admin verification."
            : "Rejected after manual admin verification.",
        resolutionSummary:
          status === "approved"
            ? "Submission accepted via human escalation path."
            : "Submission remains below acceptance threshold.",
        decidedBy: walletAddress ?? "admin-console",
      });

      setEscalations((previous) =>
        previous.map((item) =>
          item.escalationId === updated.escalationId ? updated : item,
        ),
      );
      setAdminMessage(`Escalation ${status}.`);
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Could not apply escalation decision",
      );
    }
  };

  const handleRewardDecision = async (
    item: RewardApprovalRecord,
    status: "approved" | "rejected",
  ) => {
    setAdminError(null);
    setAdminMessage(null);

    try {
      const commitment = await getCommitment(item.commitmentId);
      const approvalPayload = JSON.stringify({
        action: "admin-reward-decision",
        commitmentId: item.commitmentId,
        status,
        decidedBy: walletAddress ?? "admin-console",
        issuedAt: new Date().toISOString(),
      });

      let walletApprovalSignature: string | undefined;
      let walletApprovalData: string | undefined;
      let walletApprovalVerifyingKey: string | undefined;

      try {
        const signed = await signWalletAuthorization(approvalPayload);
        walletApprovalSignature = signed.signature;
        walletApprovalData = signed.data;
        walletApprovalVerifyingKey = signed.verifyingKey;
      } catch {
        // Keep wallet authorization optional while connector builds vary by capability.
      }

      const onChainResult = await executeAdminRewardDecisionOnChain({
        connectedApi: connectedWalletApi,
        walletAddress,
        commitment,
        status,
      });

      const updated = await decideRewardApproval(item.commitmentId, {
        status,
        decidedBy: walletAddress ?? "admin-console",
        adminNotes:
          status === "approved"
            ? "Approved from the admin reward queue."
            : "Rejected from the admin reward queue.",
        walletApprovalSignature,
        walletApprovalData,
        walletApprovalVerifyingKey,
        completionDecisionTxId: onChainResult.completionDecisionTxId,
        escrowDecisionTxId: onChainResult.escrowDecisionTxId,
      });

      setRewardApprovals((previous) =>
        previous.map((entry) =>
          entry.commitmentId === updated.commitmentId
            ? {
                ...entry,
                verificationStatus: updated.verificationStatus,
                rewardStatus: updated.rewardStatus,
                approvedAt: updated.approvedAt,
                approvedBy: updated.approvedBy,
                claimedAt: updated.claimedAt,
                claimedBy: updated.claimedBy,
              }
            : entry,
        ),
      );
      setAdminMessage(
        status === "approved"
          ? "Reward approved."
          : "Reward rejected.",
      );
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Could not apply reward decision",
      );
    }
  };

  const handleCreatePolicy = async () => {
    setAdminError(null);
    setAdminMessage(null);

    let parsedConfig: {
      dimensions?: Record<string, number>;
      steps?: string[];
    };
    try {
      parsedConfig = JSON.parse(policyConfigJson) as {
        dimensions?: Record<string, number>;
        steps?: string[];
      };
    } catch {
      setAdminError("AI agents JSON must be valid JSON.");
      return;
    }

    const dimensions = parsedConfig.dimensions;
    if (
      !dimensions ||
      typeof dimensions !== "object" ||
      Array.isArray(dimensions)
    ) {
      setAdminError("AI agents JSON must include a 'dimensions' object.");
      return;
    }

    const steps = Array.isArray(parsedConfig.steps)
      ? parsedConfig.steps
          .filter((step) => typeof step === "string")
          .map((step) => step.trim())
          .filter((step) => step.length > 0)
      : [];

    if (steps.length === 0) {
      setAdminError(
        "AI agents JSON must include a non-empty 'steps' array with review steps.",
      );
      return;
    }

    setSavingPolicy(true);
    try {
      const created = await createReviewerPolicy({
        agentId: policyAgentId.trim(),
        model: policyModel.trim(),
        category: policyCategory.trim(),
        scoreThreshold: Number(policyScoreThreshold),
        dimensions,
        steps,
        maxTokens: Number(policyMaxTokens),
        timeoutMs: Number(policyTimeoutMs),
        retryLimit: Number(policyRetryLimit),
      });
      setPolicies((previous) => [created, ...previous]);
      setAdminMessage("AI agent created.");
      setActiveTab("AI Agents");
    } catch (error) {
      setAdminError(
        error instanceof Error
          ? error.message
          : "Could not create AI agent",
      );
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
            <Shield className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">
            Admin Control Center
          </h1>
        </div>
        <button
          onClick={() => void loadAdminData()}
          className="px-6 py-3 bg-[#0A0A0A] border border-white/20 text-white font-bold tracking-widest uppercase hover:border-bright-blue transition-colors text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Spaces
            </div>
            <div className="text-3xl font-black">{spaces.length}</div>
          </div>
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Pending Rewards
            </div>
            <div className="text-3xl font-black text-amber-300">
              {pendingRewardApprovals.length}
            </div>
          </div>
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Pending Escalations
            </div>
            <div className="text-3xl font-black text-amber-300">
              {pendingEscalations.length}
            </div>
          </div>
          <div className="border border-white/10 bg-[#161616] p-5">
            <div className="text-white/40 text-xs uppercase tracking-widest mb-2">
              Disclosures
            </div>
            <div className="text-3xl font-black">{disclosures.length}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-all border ${
                activeTab === t
                  ? "bg-bright-blue border-bright-blue text-white"
                  : "bg-[#161616] border-white/10 text-white/50 hover:bg-[#232323] hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {adminError && (
          <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
            {adminError}
          </div>
        )}

        {adminMessage && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-5 py-4 text-sm">
            {adminMessage}
          </div>
        )}

        {activeTab === "Overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="border border-white/10 bg-[#161616] p-8">
              <h2 className="font-heading text-xl uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={18} className="text-bright-blue" />
                System Status
              </h2>
              <ul className="space-y-3 text-sm text-white/70">
                <li>
                  AI review endpoint supports agent-aware scoring.
                </li>
                <li>
                  Reward queue now separates proof verification from escrow
                  approval and user claim.
                </li>
                <li>
                  Escalation queue supports manual approve/reject workflow.
                </li>
                <li>
                  AI agents parameters and `steps` JSON are editable from this
                  admin panel.
                </li>
                <li>
                  Wallet-linked admin identity can be attached to decisions,
                  with on-chain runtime status exposed via API health.
                </li>
              </ul>
            </div>
            <div className="border border-white/10 bg-[#161616] p-8">
              <h2 className="font-heading text-xl uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-300" />
                Attention Queue
              </h2>
              {pendingRewardApprovals.length === 0 &&
              pendingEscalations.length === 0 ? (
                <p className="text-sm text-white/60">No pending admin work right now.</p>
              ) : (
                <div className="space-y-3">
                  {pendingRewardApprovals.slice(0, 2).map((item) => (
                    <div
                      key={item.commitmentId}
                      className="border border-white/10 bg-[#0A0A0A] p-4"
                    >
                      <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
                        Reward Approval
                      </div>
                      <div className="text-sm text-white/80 min-w-0">
                        <span>
                          {item.rewardAmount}{" "}
                          {item.rewardMode === "escrow-auto" ? "escrow units" : "XP"}{" "}
                          for{" "}
                        </span>
                        <span className="font-mono text-xs text-white/70 break-all">
                          {item.walletAddress}
                        </span>
                      </div>
                    </div>
                  ))}
                  {pendingEscalations.slice(0, 4).map((item) => (
                    <div
                      key={item.escalationId}
                      className="border border-white/10 bg-[#0A0A0A] p-4"
                    >
                      <div className="text-xs uppercase tracking-widest text-white/40 mb-2">
                        {item.escalationId}
                      </div>
                      <div className="text-sm text-white/80">{item.reason}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "Spaces" && (
          <div className="space-y-6">
            <div className="bg-[#161616] border border-white/10 p-8">
              <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-6 text-white flex items-center gap-3">
                <Plus className="text-bright-blue" /> Create New Space
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  value={spaceName}
                  onChange={(event) => setSpaceName(event.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white"
                  placeholder="Space name"
                />
                <input
                  value={walletAddress ?? ""}
                  readOnly
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 font-mono text-white/70"
                  placeholder="Connect wallet to attach creator"
                />
              </div>
              <textarea
                value={spaceDesc}
                onChange={(event) => setSpaceDesc(event.target.value)}
                rows={3}
                className="mt-4 w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white resize-none"
                placeholder="Space description"
              />
              <button
                onClick={handleCreateSpace}
                disabled={savingSpace}
                className="mt-4 px-8 py-3 bg-bright-blue text-white font-bold tracking-widest uppercase border border-bright-blue disabled:opacity-70"
              >
                {savingSpace ? "Creating..." : "Create Space"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {spaces.map((space) => (
                <div
                  key={space.id}
                  className="border border-white/10 bg-[#161616] p-6 hover:bg-[#1a1a1a] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{space.name}</h3>
                      <p className="text-sm text-white/60 mb-3">{space.desc}</p>
                    </div>
                    <Link
                      to={`/spaces/${space.id}/manage`}
                      className="p-2 border border-white/10 bg-[#0A0A0A] text-white/80 hover:text-bright-blue hover:border-bright-blue transition-colors flex-shrink-0"
                      title="Manage space and quests"
                    >
                      <Settings size={18} />
                    </Link>
                  </div>
                  <div className="flex gap-3 text-xs text-white/50 mb-4">
                    <span>{space.members} members</span>
                    <span>•</span>
                    <span>{space.quests} quests</span>
                  </div>
                  <div className="text-xs text-white/40 uppercase tracking-widest border-t border-white/10 pt-3">
                    Space ID: {space.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Rewards" && (
          <div className="space-y-4">
            {rewardApprovals.length === 0 ? (
              <div className="border border-white/10 bg-midnight-light p-6 text-white/60 text-sm">
                No reward approvals yet.
              </div>
            ) : (
              rewardApprovals.map((item) => (
                <div
                  key={item.commitmentId}
                  className="border border-white/10 bg-midnight-light p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/40">
                        {item.commitmentId}
                      </div>
                      <div className="font-mono text-xs text-white/60 mt-1">
                        Wallet: {item.walletAddress}
                      </div>
                    </div>
                    <div className="flex gap-2 text-[10px] uppercase tracking-widest">
                      <span className="px-3 py-1 border border-white/20">
                        {item.verificationStatus}
                      </span>
                      <span className="px-3 py-1 border border-bright-blue/30 text-bright-blue">
                        {item.rewardMode}
                      </span>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <div className="text-white/40 uppercase tracking-widest text-[10px] mb-1">
                        Review
                      </div>
                      <div className="text-white/80">
                        Score {item.reviewScore} · {item.reviewPassed ? "passed" : "failed"}
                      </div>
                      <div className="font-mono text-xs text-white/50 break-all mt-1">
                        {item.artifactUrl}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/40 uppercase tracking-widest text-[10px] mb-1">
                        Reward
                      </div>
                      <div className="text-white/80">
                        {item.rewardAmount}{" "}
                        {item.rewardMode === "escrow-auto" ? "escrow units" : "XP"}
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {item.rewardStatus}
                      </div>
                    </div>
                  </div>

                  {item.reviewThinking && (
                    <div className="mb-4">
                      <button
                        onClick={() =>
                          setExpandedThinking(
                            expandedThinking === item.commitmentId
                              ? null
                              : item.commitmentId,
                          )
                        }
                        className="text-[10px] uppercase tracking-[0.15em] text-bright-blue font-bold hover:text-bright-blue/80 transition-colors flex items-center gap-1.5"
                      >
                        {expandedThinking === item.commitmentId
                          ? "Hide AI reasoning"
                          : "View AI reasoning steps"}
                        <Activity size={10} />
                      </button>
                      {expandedThinking === item.commitmentId && (
                        <div className="mt-2 p-4 bg-[#0A0A0A] border border-white/5 text-sm text-white/70 leading-relaxed italic border-l-2 border-l-bright-blue">
                          {item.reviewThinking}
                        </div>
                      )}
                    </div>
                  )}

                  {item.verificationStatus === "pending-admin" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => void handleRewardDecision(item, "approved")}
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2"
                      >
                        <Coins size={14} />
                        Approve Reward
                      </button>
                      <button
                        onClick={() => void handleRewardDecision(item, "rejected")}
                        className="px-4 py-2 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold uppercase tracking-widest"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-white/60">
                      {item.claimedAt
                        ? `Claimed at ${formatDate(item.claimedAt)}`
                        : item.approvedAt
                          ? `Approved at ${formatDate(item.approvedAt)}`
                          : "Decision recorded"}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "Escalations" && (
          <div className="space-y-4">
            {escalations.length === 0 ? (
              <div className="border border-white/10 bg-midnight-light p-6 text-white/60 text-sm">
                No escalations found yet.
              </div>
            ) : (
              escalations.map((item) => (
                <div
                  key={item.escalationId}
                  className="border border-white/10 bg-midnight-light p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/40">
                        {item.escalationId}
                      </div>
                      <div className="font-mono text-xs text-white/60 mt-1">
                        Review: {item.reviewId}
                      </div>
                    </div>
                    <div className="text-xs uppercase tracking-widest px-3 py-1 border border-white/20">
                      {item.status}
                    </div>
                  </div>

                  <p className="text-sm text-white/80 mb-2">{item.reason}</p>
                  <p className="font-mono text-xs text-white/60 break-all mb-4">
                    {item.artifactUrl}
                  </p>

                  {item.reviewThinking && (
                    <div className="mb-4">
                      <button
                        onClick={() =>
                          setExpandedThinking(
                            expandedThinking === item.escalationId
                              ? null
                              : item.escalationId,
                          )
                        }
                        className="text-[10px] uppercase tracking-[0.15em] text-bright-blue font-bold hover:text-bright-blue/80 transition-colors flex items-center gap-1.5"
                      >
                        {expandedThinking === item.escalationId
                          ? "Hide original AI reasoning"
                          : "View original AI reasoning steps"}
                        <Activity size={10} />
                      </button>
                      {expandedThinking === item.escalationId && (
                        <div className="mt-2 p-4 bg-[#0A0A0A] border border-white/5 text-sm text-white/70 leading-relaxed italic border-l-2 border-l-bright-blue">
                          {item.reviewThinking}
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === "pending-admin" ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() =>
                          void handleEscalationDecision(
                            item.escalationId,
                            "approved",
                          )
                        }
                        className="px-4 py-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-widest"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          void handleEscalationDecision(
                            item.escalationId,
                            "rejected",
                          )
                        }
                        className="px-4 py-2 bg-red-500/20 border border-red-400/40 text-red-300 text-xs font-bold uppercase tracking-widest"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="text-xs text-white/60">
                      {item.resolutionSummary || "Escalation resolved"}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "AI Agents" && (
          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-6">
            <div className="border border-white/10 bg-midnight-light p-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                  <Plus size={16} className="text-bright-blue" />
                  Create AI Agent
                </h2>
                <Link
                  to="/admin/ai-agents/marketplace"
                  className="px-4 py-2 border border-white/20 text-white/70 text-xs font-bold uppercase tracking-widest hover:border-bright-blue hover:text-bright-blue transition-colors flex items-center gap-2"
                >
                  <Store size={14} />
                  Marketplace
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  value={policyAgentId}
                  onChange={(event) => setPolicyAgentId(event.target.value)}
                  className="bg-midnight border border-white/10 p-3 font-mono text-sm"
                  placeholder="Agent ID"
                />
                <select
                  value={policyModel}
                  onChange={(event) => setPolicyModel(event.target.value)}
                  className="bg-midnight border border-white/10 p-3 font-mono text-sm"
                >
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <input
                  value={policyCategory}
                  onChange={(event) => setPolicyCategory(event.target.value)}
                  className="bg-[#0A0A0A] border border-white/10 p-3 font-mono text-sm"
                  placeholder="Category"
                />
                <input
                  value={policyScoreThreshold}
                  onChange={(event) =>
                    setPolicyScoreThreshold(event.target.value)
                  }
                  className="bg-[#0A0A0A] border border-white/10 p-3 font-mono text-sm"
                  placeholder="Score threshold"
                />
                <input
                  value={policyMaxTokens}
                  onChange={(event) => setPolicyMaxTokens(event.target.value)}
                  className="bg-[#0A0A0A] border border-white/10 p-3 font-mono text-sm"
                  placeholder="Max tokens"
                />
                <input
                  value={policyTimeoutMs}
                  onChange={(event) => setPolicyTimeoutMs(event.target.value)}
                  className="bg-[#0A0A0A] border border-white/10 p-3 font-mono text-sm"
                  placeholder="Timeout ms"
                />
              </div>
              <input
                value={policyRetryLimit}
                onChange={(event) => setPolicyRetryLimit(event.target.value)}
                className="mt-4 w-full bg-[#0A0A0A] border border-white/10 p-3 font-mono text-sm"
                placeholder="Retry limit"
              />
              <div className="mt-4 border border-white/10 bg-[#0A0A0A]">
                <div className="px-3 py-2 border-b border-white/10 text-[11px] uppercase tracking-widest text-white/50 flex items-center justify-between">
                  <span>AI agents JSON (dimensions + steps)</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPolicyConfigJson(
                        JSON.stringify(
                          {
                            dimensions: {
                              technicalDepth: 0.4,
                              factualAccuracy: 0.3,
                              clarity: 0.2,
                              originality: 0.1,
                            },
                            steps: [
                              "It should explain shielded transactions clearly",
                              "It should be clearly documented with working examples",
                              "It should demonstrate understanding of ZK proof generation",
                            ],
                          },
                          null,
                          2,
                        ),
                      )
                    }
                    className="text-[10px] px-2 py-1 border border-white/20 hover:border-bright-blue hover:text-bright-blue transition-colors"
                  >
                    Reset Template
                  </button>
                </div>
                <CodeEditor
                  value={policyConfigJson}
                  onValueChange={(code) => setPolicyConfigJson(code)}
                  highlight={highlightJson}
                  padding={12}
                  textareaClassName="admin-json-editor-textarea"
                  className="admin-json-editor min-h-60 text-xs font-mono"
                />
                <div className="px-3 py-2 border-t border-white/10 text-[10px] text-white/30">
                  <strong className="text-white/50">dimensions</strong>:
                  weighted scoring rubric (must sum to 1.0) ·
                  <strong className="text-white/50"> steps</strong>: array of
                  string review requirements
                </div>
              </div>
              <button
                onClick={handleCreatePolicy}
                disabled={savingPolicy}
                className="mt-4 px-8 py-3 bg-bright-blue text-white font-bold tracking-widest uppercase border border-bright-blue disabled:opacity-70"
              >
                {savingPolicy ? "Saving..." : "Create AI Agent"}
              </button>
            </div>

            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-white/10 bg-[#161616] p-5"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm uppercase tracking-widest">
                      {policy.agentId}
                    </h3>
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2 py-1 border ${policy.active ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-white/50"}`}
                    >
                      {policy.active ? "active" : "inactive"}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 space-y-1">
                    <p>Model: {policy.model}</p>
                    <p>Category: {policy.category}</p>
                    <p>Threshold: {policy.scoreThreshold}</p>
                    <p>Steps: {policy.steps.length}</p>
                    <p>Retry: {policy.retryLimit}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "Disclosures" && (
          <div className="space-y-4">
            {disclosures.length === 0 ? (
              <div className="border border-white/10 bg-[#161616] p-6 text-white/60 text-sm">
                No disclosures yet.
              </div>
            ) : (
              disclosures.map((item) => (
                <div
                  key={item.certificateId}
                  className="border border-white/10 bg-[#161616] p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="font-mono text-xs text-white/60">
                      {item.certificateId}
                    </div>
                    <div
                      className={
                        item.disclosed.passed
                          ? "text-emerald-300 text-xs uppercase tracking-widest"
                          : "text-amber-300 text-xs uppercase tracking-widest"
                      }
                    >
                      {item.disclosed.passed ? "passed" : "needs-revision"}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 gap-4 text-xs">
                    <div className="bg-[#0A0A0A] border border-white/10 p-3">
                      <div className="text-white/40 uppercase tracking-widest mb-2">
                        Space
                      </div>
                      <div className="font-mono text-white/80">
                        {item.spaceId}
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 p-3">
                      <div className="text-white/40 uppercase tracking-widest mb-2">
                        Quest
                      </div>
                      <div className="font-mono text-white/80">
                        {item.questId}
                      </div>
                    </div>
                    <div className="bg-[#0A0A0A] border border-white/10 p-3">
                      <div className="text-white/40 uppercase tracking-widest mb-2">
                        Reviewed At
                      </div>
                      <div className="font-mono text-white/80">
                        {formatDate(item.disclosed.reviewedAt)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="border border-white/10 bg-[#161616] p-5 text-xs text-white/50 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-emerald-300" />
          Admin actions are available from this panel.
        </div>
      </div>
    </div>
  );
}
