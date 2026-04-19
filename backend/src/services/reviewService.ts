import { createHash } from "node:crypto";
import type {
  CommitmentRecord,
  CommitmentRequest,
  DisclosureRecord,
  ReviewRecord,
  ReviewRequest,
} from "../domain/models.js";
import { createId } from "../domain/store.js";

function scoreFromInput(input: ReviewRequest) {
  const basis = `${input.artifactUrl ?? ""}|${input.artifactText ?? ""}`;
  const digest = createHash("sha256")
    .update(basis || "midnight")
    .digest();

  const accuracy = 55 + (digest[0] % 31);
  const completeness = 45 + (digest[1] % 31);
  const originality = 35 + (digest[2] % 31);
  const relevance = 45 + (digest[3] % 31);

  const score = Math.min(
    100,
    Math.round((accuracy + completeness + originality + relevance) / 4),
  );

  return {
    score,
    breakdown: { accuracy, completeness, originality, relevance },
  };
}

function toScoreBand(score: number) {
  if (score >= 85) return "A";
  if (score >= 75) return "B";
  if (score >= 70) return "C";
  return "D";
}

function walletHint(address: string) {
  if (address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function createReview(input: ReviewRequest): ReviewRecord {
  const reviewId = createId("review");
  const spaceId = input.spaceId?.trim() || "midnight";
  const questId = input.questId?.trim() || "blog-quest-demo";
  const artifactUrl =
    input.artifactUrl?.trim() || "https://dev.to/midnight/demo";
  const artifactText = input.artifactText?.trim();
  const { score, breakdown } = scoreFromInput({ artifactUrl, artifactText });
  const threshold = 70;
  const passed = score >= threshold;
  const evidenceHash = createHash("sha256")
    .update(`${questId}|${artifactUrl}|${artifactText ?? ""}|${score}`)
    .digest("hex");

  const analysisMessage = passed
    ? "Mock AI analysis: structure, technical consistency, and rubric alignment passed for demo-mode verification."
    : "Mock AI analysis: submission missed rubric threshold on completeness and relevance. Escalate to admin review if evidence should still qualify.";

  return {
    reviewId,
    reviewMode: "mock",
    analysisMessage,
    spaceId,
    questId,
    artifactUrl,
    artifactText,
    score,
    threshold,
    passed,
    evidenceHash: `0x${evidenceHash}`,
    summary: passed
      ? "AI review passed the rubric and is ready for wallet authorization."
      : "AI review completed in demo mode but did not clear the threshold.",
    breakdown,
    reviewedAt: new Date().toISOString(),
  };
}

export function createCommitment(
  review: ReviewRecord,
  input: CommitmentRequest,
): CommitmentRecord {
  const walletAddress =
    input.walletAddress?.trim() || "pending-wallet-authorization";
  const authorizationMode = input.authorizationMode?.trim() || "dapp-connector";
  const commitmentId = createId("commit");
  const commitmentHash = createHash("sha256")
    .update(
      `${review.reviewId}|${review.evidenceHash}|${walletAddress}|${authorizationMode}`,
    )
    .digest("hex");

  return {
    commitmentId,
    reviewId: review.reviewId,
    walletAddress,
    authorizationMode,
    commitmentHash: `0x${commitmentHash}`,
    status: "pending-chain",
    createdAt: new Date().toISOString(),
  };
}

export function toDisclosureRecord(
  review: ReviewRecord,
  commitment: CommitmentRecord,
): DisclosureRecord {
  return {
    certificateId: commitment.commitmentId,
    spaceId: review.spaceId,
    questId: review.questId,
    reviewId: review.reviewId,
    commitmentId: commitment.commitmentId,
    artifactUrl: review.artifactUrl,
    evidenceHash: review.evidenceHash,
    commitmentHash: commitment.commitmentHash,
    disclosed: {
      passed: review.passed,
      scoreBand: toScoreBand(review.score),
      walletHint: walletHint(commitment.walletAddress),
      reviewedAt: review.reviewedAt,
    },
  };
}
