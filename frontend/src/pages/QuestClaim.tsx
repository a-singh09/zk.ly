import { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useNotification } from "../lib/NotificationContext";
import { useMidnightWallet } from "../lib/MidnightWalletContext";
import {
  authorizeReviewCommitment,
  fetchDevToArticle,
  runAiReview,
  type AiReviewResponse,
  type CommitmentResponse,
  type DevToArticle,
} from "../lib/api";

export default function QuestClaim() {
  const { id, questId } = useParams();
  const navigate = useNavigate();
  const { notifyComplete } = useNotification();
  const { isConnected, walletAddress, connectWallet } = useMidnightWallet();

  const [artifactUrl, setArtifactUrl] = useState(
    "https://dev.to/midnight/demo-blog-post",
  );
  const [artifactText, setArtifactText] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isFetchingArticle, setIsFetchingArticle] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [article, setArticle] = useState<DevToArticle | null>(null);
  const [reviewResult, setReviewResult] = useState<AiReviewResponse | null>(
    null,
  );
  const [commitmentResult, setCommitmentResult] =
    useState<CommitmentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        "AI review completed. Wallet authorization is now available.",
      );
    } catch (reviewError) {
      setError(
        reviewError instanceof Error ? reviewError.message : "Review failed",
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleAuthorizeCommitment = async () => {
    if (!reviewResult) return;
    setError(null);
    setIsAuthorizing(true);
    try {
      const currentAddress =
        isConnected && walletAddress ? walletAddress : await connectWallet();
      const commitment = await authorizeReviewCommitment({
        reviewId: reviewResult.reviewId,
        walletAddress: currentAddress,
        authorizationMode: "dapp-connector",
      });

      setCommitmentResult(commitment);
      notifyComplete(
        "Wallet authorization captured. Commitment is ready for on-chain submission.",
      );
      setTimeout(() => {
        navigate(`/proof/${commitment.commitmentId}`);
      }, 1600);
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
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8">
        <Link
          to={`/spaces/${id}`}
          className="flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> BACK TO SPRINT
        </Link>
      </div>

      <div className="p-8 max-w-5xl mx-auto mt-12">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="bg-[#161616] border border-white/10 p-10">
            <div className="w-20 h-20 bg-[#0A0A0A] border border-white/10 flex items-center justify-center mb-10">
              <Sparkles className="text-bright-blue" size={38} />
            </div>

            <p className="text-xs uppercase tracking-[0.3em] text-white/40 mb-4">
              Quest {questId ?? "blog-quest-demo"}
            </p>
            <h1 className="text-4xl font-bold font-heading mb-6 uppercase tracking-tight">
              AI Review, then Wallet Authorization
            </h1>
            <p className="text-white/60 mb-8 text-lg max-w-2xl">
              Submit your dev.to artifact through the live fetch step, then run
              the mock AI service. Once the review result is ready, authorize
              the commitment with a Midnight Lace wallet connection so the
              platform can prepare the on-chain proof path.
            </p>

            <div className="space-y-5 mb-10">
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
                  <div className="text-white/40 uppercase tracking-widest text-[11px] mb-2">
                    Live dev.to article
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
              <div className="mb-8 border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleReview}
                disabled={isReviewing || isFetchingArticle}
                className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-[#0000FE]/90 transition-colors border border-bright-blue disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isReviewing ? "Running AI Review..." : "Run AI Review"}
              </button>

              <button
                onClick={handleAuthorizeCommitment}
                disabled={!reviewResult || isAuthorizing}
                className="px-8 py-4 border border-white/20 text-white font-bold tracking-widest uppercase hover:border-bright-blue hover:text-bright-blue transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Wallet size={16} />
                {isAuthorizing
                  ? "Authorizing..."
                  : isConnected
                    ? "Authorize Commitment"
                    : "Connect + Authorize"}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-[#161616] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-5 text-bright-blue">
                <ShieldCheck size={22} />
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  Wallet Status
                </h2>
              </div>
              <p className="text-white/60 text-sm leading-7">
                The DApp Connector flow follows Midnight Lace authorization from
                the docs: the app requests a wallet connection, reads the
                shielded address, and uses that authorization to prepare the
                commitment payload.
              </p>
              <div className="mt-5 border border-white/10 bg-[#0A0A0A] p-4 text-sm font-mono text-white/80 break-all">
                {isConnected ? walletAddress : "Wallet not connected yet"}
              </div>
            </div>

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
                      Status
                    </div>
                    <div
                      className={
                        reviewResult.passed
                          ? "text-emerald-400 font-bold"
                          : "text-amber-400 font-bold"
                      }
                    >
                      {reviewResult.passed ? "Passed" : "Needs revision"}
                    </div>
                    <p className="mt-3 text-white/60 leading-7">
                      {reviewResult.summary}
                    </p>
                    {reviewResult.reviewerNotes && (
                      <p className="mt-2 text-white/50 leading-7 text-xs italic">
                        {reviewResult.reviewerNotes}
                      </p>
                    )}
                  </div>

                  <div className="border border-white/10 bg-[#0A0A0A] p-4 font-mono text-xs text-white/70 break-all">
                    <div className="mb-2 text-white/40 uppercase tracking-widest">
                      Evidence Hash
                    </div>
                    {reviewResult.evidenceHash}
                  </div>
                </div>
              ) : (
                <p className="text-white/50 text-sm leading-7">
                  No AI review has been run yet. The result will be stored here
                  after processing.
                </p>
              )}
            </div>

            <div className="bg-[#161616] border border-white/10 p-8">
              <div className="flex items-center gap-3 mb-5 text-bright-blue">
                <Wallet size={22} />
                <h2 className="text-lg font-bold uppercase tracking-widest">
                  Commitment
                </h2>
              </div>

              {commitmentResult ? (
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
                  <p className="text-white/60 leading-7">
                    {commitmentResult.chainNote}
                  </p>
                </div>
              ) : (
                <p className="text-white/50 text-sm leading-7">
                  Once the AI review passes, authorize the commitment with your
                  wallet. The mock API will create the commitment artifact until
                  the on-chain contract is deployed.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
