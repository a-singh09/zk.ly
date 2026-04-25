import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Wallet,
  Lock,
  Circle,
  CheckCircle,
  Server,
} from "lucide-react";
import { useNotification } from "../lib/NotificationContext";
import { useMidnightWallet } from "../lib/MidnightWalletContext";
import {
  COMPLETION_REGISTRY_ADDRESS,
} from "../lib/questContractApi";
import { commitCompletionOnChain } from "../lib/midnightConnectorExecutor";
import {
  authorizeReviewCommitment,
  createEscalation,
  fetchDevToArticle,
  getMidnightHealth,
  runAiReview,
  type AiReviewResponse,
  type CommitmentResponse,
  type DevToArticle,
  type EscalationRecord,
  type MidnightHealthStatus,
} from "../lib/api";

// ─── ZK Proof Mode Badge ────────────────────────────────────────────────────

function ProofModeBadge({
  mode,
  reason,
}: {
  mode: "midnight" | "mock" | null;
  reason?: string;
}) {
  if (!mode) return null;
  return (
    <div
      className="border px-4 py-3 text-sm flex items-start gap-3 border-white/10 bg-white/5 text-white/70"
    >
      <div className="mt-0.5">
        <CheckCircle size={16} className="text-emerald-400" />
      </div>
      <div>
        <div className="font-bold uppercase tracking-widest text-[11px] mb-1">
          Status
        </div>
        <div className="text-white/70 text-xs leading-5">
          {reason || "Commitment submitted."}
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Split Panel ─────────────────────────────────────────────────────

function PrivacyBreakdown({
  commitment: _commitment,
}: {
  commitment: CommitmentResponse;
}) {
  return (
    <div className="border border-white/10 bg-[#0A0A0A] mt-4">
      <div className="px-4 py-2 border-b border-white/10 text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-2">
        <Lock size={12} />
        Details
      </div>
      <div className="divide-y divide-white/5">
        <div className="px-4 py-3 text-xs text-white/60 leading-6">
          This section intentionally hides infrastructure details. You can still
          view your commitment ID and status below.
        </div>
      </div>
    </div>
  );
}

// ─── Midnight Health Banner ───────────────────────────────────────────────────

function MidnightStatusBanner({
  health,
}: {
  health: MidnightHealthStatus | null;
}) {
  if (!health) return null;
  return (
    <div className="border-b text-xs px-8 py-2 flex items-center gap-3 font-mono border-white/10 bg-[#161616] text-white/40">
      <Server size={12} />
      <span className="font-bold uppercase tracking-widest">Status:</span>
      <span className="text-white/60">Online</span>
    </div>
  );
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({
  step,
  label,
  status,
}: {
  step: number;
  label: string;
  status: "pending" | "active" | "done";
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 flex items-center justify-center text-xs font-bold border ${
          status === "done"
            ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
            : status === "active"
              ? "bg-bright-blue/20 border-bright-blue/40 text-bright-blue"
              : "bg-white/5 border-white/10 text-white/30"
        }`}
      >
        {status === "done" ? "✓" : step}
      </div>
      <span
        className={`text-xs uppercase tracking-widest font-bold ${
          status === "done"
            ? "text-emerald-300"
            : status === "active"
              ? "text-bright-blue"
              : "text-white/30"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestClaim() {
  const { id, questId } = useParams();
  const navigate = useNavigate();
  const { notifyComplete } = useNotification();
  const { isConnected, walletAddress, connectWallet, connectedWalletApi } =
    useMidnightWallet();

  const [artifactUrl, setArtifactUrl] = useState(
    "https://dev.to/midnight/demo-blog-post",
  );
  const [artifactText, setArtifactText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isFetchingArticle, setIsFetchingArticle] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [article, setArticle] = useState<DevToArticle | null>(null);
  const [reviewResult, setReviewResult] = useState<AiReviewResponse | null>(
    null,
  );
  const [commitmentResult, setCommitmentResult] =
    useState<CommitmentResponse | null>(null);
  const [escalationResult, setEscalationResult] =
    useState<EscalationRecord | null>(null);
  const [escalationReason, setEscalationReason] = useState(
    "AI missed contextual evidence. Please review manually.",
  );
  const [error, setError] = useState<string | null>(null);
  const [midnightHealth, setMidnightHealth] =
    useState<MidnightHealthStatus | null>(null);

  // Determine current step
  const currentStep = commitmentResult ? 3 : reviewResult ? 2 : article ? 1 : 0;

  useEffect(() => {
    getMidnightHealth()
      .then(setMidnightHealth)
      .catch(() => {
        /* silently ignore if server is down */
      });
  }, []);

  const handleFetchArticle = async () => {
    setError(null);
    setIsFetchingArticle(true);
    try {
      const articleResponse = await fetchDevToArticle(artifactUrl);
      setArticle(articleResponse);
      if (!artifactText) {
        setArtifactText((articleResponse.body_markdown ?? "").slice(0, 4000));
      }
      notifyComplete("Fetched live dev.to article details.");
    } catch (fetchError) {
      setArticle(null);
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Could not fetch dev.to article",
      );
    } finally {
      setIsFetchingArticle(false);
    }
  };

  const handleReview = async () => {
    setError(null);
    setCommitmentResult(null);
    setEscalationResult(null);
    setIsReviewing(true);
    try {
      const review = await runAiReview({
        spaceId: id,
        questId: questId ?? "blog-quest-demo",
        artifactUrl,
        artifactText: artifactText || undefined,
      });
      setReviewResult(review);
      notifyComplete(
        "AI review completed.",
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error ? reviewError.message : "Review failed",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleEscalateToAdmin = async () => {
    if (!reviewResult) return;
    setError(null);
    setIsEscalating(true);

    try {
      const escalation = await createEscalation({
        reviewId: reviewResult.reviewId,
        reason: escalationReason,
        artifactUrl,
        requestedByWallet: walletAddress ?? undefined,
        notes: `Quest ${questId ?? "blog-quest-demo"} escalation requested from claim flow.`,
      });
      setEscalationResult(escalation);
      notifyComplete(
        "Escalation submitted. Admin reviewers can now approve or reject manually.",
      );
    } catch (escalationError) {
      setError(
        escalationError instanceof Error
          ? escalationError.message
          : "Could not submit escalation",
      );
    } finally {
      setIsEscalating(false);
    }
  };

  const handleAuthorizeCommitment = async () => {
    if (!reviewResult) return;
    setError(null);
    setIsAuthorizing(true);
    try {
      const currentAddress =
        isConnected && walletAddress ? walletAddress : await connectWallet();

      // ── Step 1: DApp connector — execute verify_completion on-chain ──
      let onChainCertId: string | undefined;
      let onChainCommitmentHash: string | undefined;
      let onChainReviewCommitmentHash: string | undefined;
      let onChainTxId: string | undefined;
      let onChainMode: "midnight" | "mock" | "wallet-popup" = "mock";
      let chainNote =
        "Commitment saved off-chain.";

      if (connectedWalletApi) {
        try {
          console.info(
            "[commitment] Submitting verify_completion intent via DApp connector",
            { contractAddress: COMPLETION_REGISTRY_ADDRESS },
          );

          // Determine score band from AI review score
          const score = reviewResult.score ?? 0;
          const scoreBand: 0 | 1 | 2 | 3 =
            score >= 85 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0;

          const onChainResult = await commitCompletionOnChain({
            connectedApi: connectedWalletApi,
            questId: questId ?? "blog-quest-demo",
            sprintId: id ?? "midnight",
            spaceId: id ?? "midnight",
            reviewId: reviewResult.reviewId,
            score,
            passed: reviewResult.passed,
            scoreBand,
            evidenceClass: "AI_SCORE",
            xpValue: 100,
            evidenceHash: reviewResult.evidenceHash,
            walletAddress: currentAddress,
          });

          onChainCertId = onChainResult.certId;
          onChainCommitmentHash = onChainResult.commitmentHash;
          onChainReviewCommitmentHash = onChainResult.reviewCommitmentHash;
          onChainTxId = onChainResult.txId;
          onChainMode = "midnight";
          chainNote =
            `verify_completion() submitted on-chain via Midnight DApp connector (Lace). ` +
            `ZK proof generated and transaction balanced + submitted to Completion Registry ` +
            `(${COMPLETION_REGISTRY_ADDRESS}). Awaiting admin approval before claim.`;

          console.info(
            "[commitment] verify_completion intent authorized on-chain",
            onChainResult,
          );
        } catch (chainErr) {
          const chainMsg =
            chainErr instanceof Error ? chainErr.message : String(chainErr);
          console.warn(
            "[commitment] DApp connector signing failed, falling back to off-chain",
            chainMsg,
          );
          chainNote = `DApp connector signing failed: ${chainMsg}. Commitment saved off-chain.`;
        }
      } else {
        console.warn(
          "[commitment] No DApp connector available — skipping on-chain commitment",
        );
      }

      // ── Step 2: Build backend authorization payload ──
      // (approvalPayload logic removed)

      // ── Step 3: Persist to backend ──
      const commitment = await authorizeReviewCommitment({
        reviewId: reviewResult.reviewId,
        walletAddress: currentAddress,
        authorizationMode: connectedWalletApi ? "dapp-connector" : "mock",
        // Pass on-chain data for the backend to store
        onChainCertId,
        onChainCommitmentHash,
        onChainReviewCommitmentHash,
        onChainTxId,
        onChainMode,
        chainNote,
      });

      setCommitmentResult(commitment);
      notifyComplete(
        onChainCertId
          ? `Completion submitted. Admin approval is now required before reward claim.`
          : "Commitment saved.",
      );
      setTimeout(() => {
        navigate(`/proof/${commitment.commitmentId}`);
      }, 2000);
    } catch (commitError) {
      setError(
        commitError instanceof Error
          ? commitError.message
          : "Authorization failed",
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  return (
    <div className="w-full">
      {/* Top bar */}
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8">
        <Link
          to={`/spaces/${id}`}
          className="flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> BACK TO SPRINT
        </Link>
      </div>

      {/* Midnight status banner */}
      <MidnightStatusBanner health={midnightHealth} />

      <div className="p-8 max-w-5xl mx-auto mt-8">
        {/* Step indicator */}
        <div className="flex items-center gap-6 mb-10 flex-wrap">
          <StepIndicator
            step={1}
            label="Fetch Artifact"
            status={
              currentStep >= 1
                ? "done"
                : currentStep === 0
                  ? "active"
                  : "pending"
            }
          />
          <div className="w-8 h-px bg-white/10" />
          <StepIndicator
            step={2}
            label="AI Review"
            status={
              currentStep >= 2
                ? "done"
                : currentStep === 1
                  ? "active"
                  : "pending"
            }
          />
          <div className="w-8 h-px bg-white/10" />
          <StepIndicator
            step={3}
            label="Commitment"
            status={
              currentStep >= 3
                ? "done"
                : currentStep === 2
                  ? "active"
                  : "pending"
            }
          />
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          {/* ── Left: Submission Panel ── */}
          <div className="bg-[#161616] border border-white/10 p-10">
            <div className="w-20 h-20 bg-[#0A0A0A] border border-white/10 flex items-center justify-center mb-10">
              <Sparkles className="text-bright-blue" size={38} />
            </div>

            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">
              Quest {questId ?? "blog-quest-demo"}
            </p>
            <h1 className="text-4xl font-bold font-heading mb-6 uppercase tracking-tight">
              Submit for Review
            </h1>
            <p className="text-white/60 mb-8 text-lg max-w-2xl">
              Submit your artifact, run the AI agents review, then confirm the
              commitment step.
            </p>

            {/* Artifact URL */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-bold tracking-widest uppercase text-white/50 mb-4">
                  Artifact URL
                </label>
                <input
                  value={artifactUrl}
                  onChange={(event) => setArtifactUrl(event.target.value)}
                  type="text"
                  placeholder="https://dev.to/user/my-post"
                  className="w-full bg-[#0A0A0A] border border-white/20 px-6 py-4 outline-none focus:border-bright-blue focus:ring-1 focus:ring-bright-blue transition-all font-mono text-white"
                />
                <div className="mt-4">
                  <button
                    onClick={handleFetchArticle}
                    disabled={isFetchingArticle}
                    className="px-5 py-3 border border-white/20 text-xs font-bold uppercase tracking-widest hover:border-bright-blue hover:text-bright-blue transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isFetchingArticle
                      ? "Fetching dev.to article..."
                      : "Fetch dev.to details"}
                  </button>
                </div>
              </div>

              {article && (
                <div className="border border-white/10 bg-[#0A0A0A] p-5 text-sm">
                  <div className="text-white/40 uppercase tracking-widest text-[11px] mb-2 flex items-center gap-2">
                    <CheckCircle size={12} className="text-emerald-400" />
                    Live dev.to article — verified
                  </div>
                  <h3 className="text-white font-bold text-base mb-2">
                    {article.title}
                  </h3>
                  <p className="text-white/60 mb-3 leading-6">
                    {article.description || "No description available."}
                  </p>
                  <div className="text-white/50 font-mono text-xs break-all">
                    @{article.user.username} · {article.readable_publish_date}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold tracking-widest uppercase text-white/50 mb-4">
                  Optional Artifact Text
                </label>
                <textarea
                  value={artifactText}
                  onChange={(event) => setArtifactText(event.target.value)}
                  rows={6}
                  placeholder="Paste the blog excerpt, transcript, or supporting notes used by the AI reviewer."
                  className="w-full bg-[#0A0A0A] border border-white/20 px-6 py-4 outline-none focus:border-bright-blue focus:ring-1 focus:ring-bright-blue transition-all font-mono text-white resize-none"
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReview}
                disabled={isReviewing || isFetchingArticle}
                className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-[#0000FE]/90 transition-colors border border-bright-blue disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isReviewing ? "Running AI Review…" : "Run AI Review"}
              </button>

              <button
                onClick={handleAuthorizeCommitment}
                disabled={!reviewResult || isAuthorizing}
                className="px-8 py-4 border border-white/20 text-white font-bold tracking-widest uppercase hover:border-bright-blue hover:text-bright-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wallet size={16} />
                {isAuthorizing
                  ? "Generating ZK Proof…"
                  : isConnected
                    ? "Make Commitment"
                    : "Connect + Commit"}
              </button>

              {reviewResult && !reviewResult.passed && (
                <button
                  onClick={handleEscalateToAdmin}
                  disabled={isEscalating || !escalationReason.trim()}
                  className="px-8 py-4 border border-amber-400/40 text-amber-300 font-bold tracking-widest uppercase hover:border-amber-300 hover:text-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEscalating ? "Escalating…" : "Escalate to Admin"}
                </button>
              )}
            </div>

            {/* Escalation reason input */}
            {reviewResult && !reviewResult.passed && (
              <div className="mt-6 border border-amber-400/20 bg-amber-500/5 p-5">
                <label className="block text-sm font-bold tracking-widest uppercase text-amber-200 mb-3">
                  Escalation Reason
                </label>
                <textarea
                  value={escalationReason}
                  onChange={(event) => setEscalationReason(event.target.value)}
                  rows={3}
                  className="w-full bg-[#0A0A0A] border border-amber-400/30 px-4 py-3 outline-none focus:border-amber-300 font-mono text-amber-100 resize-none"
                  placeholder="Why should this submission be accepted despite AI score?"
                />
              </div>
            )}

            {escalationResult && (
              <div className="mt-6 border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-5 py-4 text-sm">
                Escalation submitted: {escalationResult.escalationId}. Status:{" "}
                {escalationResult.status}
              </div>
            )}
          </div>

          {/* ── Right: Status Panels ── */}
          <div className="space-y-6">
            {/* Wallet Status */}
            <div className="bg-[#161616] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-5 text-bright-blue">
                <ShieldCheck size={22} />
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  Wallet Status
                </h2>
              </div>
              <p className="text-white/60 text-sm leading-7">
                Your wallet can be used to authorize the commitment step. Your
                signing key never leaves your device.
              </p>
              <div className="mt-5 border border-white/10 bg-[#0A0A0A] p-4 text-sm font-mono text-white/80 break-all">
                {isConnected ? walletAddress : "Wallet not connected yet"}
              </div>
            </div>

            {/* Review Result */}
            <div className="bg-[#161616] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-5 text-bright-blue">
                <FileCheck size={22} />
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  Review Result
                </h2>
              </div>

              {reviewResult ? (
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border border-white/10 bg-[#0A0A0A] p-4">
                      <div className="text-white/40 uppercase tracking-widest text-[11px] mb-2">
                        Score
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {reviewResult.score}
                        <span className="text-sm text-white/40 font-normal ml-1">
                          / 100
                        </span>
                      </div>
                    </div>
                    <div className="border border-white/10 bg-[#0A0A0A] p-4">
                      <div className="text-white/40 uppercase tracking-widest text-[11px] mb-2">
                        Threshold
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {reviewResult.threshold}
                      </div>
                    </div>
                  </div>

                  <div className="border border-white/10 bg-[#0A0A0A] p-4">
                    <div className="text-white/40 uppercase tracking-widest text-[11px] mb-2">
                      Verdict
                    </div>
                    <div
                      className={
                        reviewResult.passed
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400 font-bold"
                      }
                    >
                      {reviewResult.passed
                        ? "✓ Passed — eligible to continue"
                        : "✗ Below threshold"}
                    </div>
                    <p className="mt-3 text-white/60 leading-7">
                      {reviewResult.summary}
                    </p>
                    <p className="mt-2 text-white/70 leading-7 text-xs">
                      {reviewResult.analysisMessage}
                    </p>
                  </div>

                  {/* Score breakdown */}
                  {reviewResult.breakdown && (
                    <div className="border border-white/10 bg-[#0A0A0A] p-4">
                      <div className="text-white/40 uppercase tracking-widest text-[11px] mb-3">
                        Score Breakdown
                      </div>
                      <div className="space-y-2">
                        {Object.entries(reviewResult.breakdown).map(
                          ([key, val]) => (
                            <div
                              key={key}
                              className="flex items-center justify-between"
                            >
                              <span className="text-xs text-white/60 capitalize">
                                {key}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-1 bg-white/5 overflow-hidden">
                                  <div
                                    className="h-full bg-bright-blue/60"
                                    style={{
                                      width: `${Math.min(100, (val as number) * 100)}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs font-mono text-white/50">
                                  {((val as number) * 100).toFixed(0)}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs text-white/70 break-all">
                    <div className="mb-2 text-white/40 uppercase tracking-widest">
                      Evidence Hash
                    </div>
                    {reviewResult.evidenceHash}
                  </div>

                  <div className="text-[10px] uppercase tracking-widest text-white/30 flex items-center gap-1 mt-1">
                    <Circle size={8} />
                    Mode: {reviewResult.reviewMode}
                  </div>
                </div>
              ) : (
                <p className="text-white/50 text-sm leading-7">
                  No AI review has been run yet. The result will be stored here
                  after processing. The score details are private — only the
                  pass/fail verdict is committed on-chain.
                </p>
              )}
            </div>

            {/* Commitment Panel */}
            <div className="bg-[#161616] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-5 text-bright-blue">
                <Wallet size={22} />
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  ZK Commitment
                </h2>
              </div>

              {commitmentResult ? (
                <div className="space-y-4">
                  {/* ZK Proof mode badge */}
                  <ProofModeBadge
                    mode={commitmentResult.proofMode}
                    reason={commitmentResult.chainNote}
                  />

                  <div className="space-y-3 text-sm">
                    <div className="border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs text-white/70 break-all">
                      <div className="mb-2 text-white/40 uppercase tracking-widest">
                        Commitment ID
                      </div>
                      {commitmentResult.commitmentId}
                    </div>
                    <div className="border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs text-white/70 break-all">
                      <div className="mb-2 text-white/40 uppercase tracking-widest">
                        Commitment Hash
                      </div>
                      {commitmentResult.commitmentHash}
                    </div>
                    {commitmentResult.onChainTxId && (
                      <div className="border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs text-white/70 break-all">
                        <div className="mb-2 text-white/40 uppercase tracking-widest">
                          On-Chain Tx ID
                        </div>
                        {commitmentResult.onChainTxId}
                      </div>
                    )}
                    <p className="text-white/60 leading-7 text-xs">
                      {commitmentResult.chainNote}
                    </p>
                  </div>

                  {/* Privacy breakdown */}
                  <PrivacyBreakdown commitment={commitmentResult} />
                </div>
              ) : (
                <div>
                  <p className="text-white/50 text-sm leading-7 mb-4">
                    Once the AI review passes, authorize the commitment with
                    your wallet popup.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
