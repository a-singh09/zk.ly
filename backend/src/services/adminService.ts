import type {
  CommitmentRecord,
  EscalationDecisionRequest,
  EscalationRecord,
  EscalationRequest,
  QuestRecord,
  RewardClaimRequest,
  RewardDecisionRequest,
  ReviewerPolicyCreateRequest,
  ReviewerPolicyRecord,
  ReviewerPolicyUpdateRequest,
  ReviewRecord,
} from "../domain/models.js";
import { createId } from "../domain/store.js";

export function createEscalation(
  request: EscalationRequest,
  review: ReviewRecord,
): EscalationRecord {
  const reason = request.reason?.trim();

  if (!reason) {
    throw new Error("reason is required");
  }

  return {
    escalationId: createId("esc"),
    reviewId: review.reviewId,
    artifactUrl: request.artifactUrl?.trim() || review.artifactUrl,
    reason,
    notes: request.notes?.trim() || undefined,
    reviewThinking: review.thinking,
    requestedByWallet:
      request.requestedByWallet?.trim() || "anonymous-requester",
    status: "pending-admin",
    requestedAt: new Date().toISOString(),
  };
}

export function applyEscalationDecision(
  escalation: EscalationRecord,
  payload: EscalationDecisionRequest,
): EscalationRecord {
  if (!payload.status) {
    throw new Error("status is required");
  }

  return {
    ...escalation,
    status: payload.status,
    adminNotes: payload.adminNotes?.trim() || escalation.adminNotes,
    resolutionSummary:
      payload.resolutionSummary?.trim() || escalation.resolutionSummary,
    decidedBy: payload.decidedBy?.trim() || escalation.decidedBy,
    resolvedAt: new Date().toISOString(),
  };
}

export function applyRewardDecision(
  commitment: CommitmentRecord,
  quest: QuestRecord,
  payload: RewardDecisionRequest,
): CommitmentRecord {
  if (payload.status !== "approved" && payload.status !== "rejected") {
    throw new Error("status must be approved or rejected");
  }

  if (payload.status === "approved") {
    return {
      ...commitment,
      verificationStatus:
        quest.rewardMode === "escrow-auto" ? "approved" : "approved",
      rewardStatus:
        quest.rewardMode === "escrow-auto" ? "claimable" : commitment.rewardStatus,
      adminApprovalSignature:
        payload.walletApprovalSignature?.trim() ||
        commitment.adminApprovalSignature,
      adminApprovalData:
        payload.walletApprovalData?.trim() || commitment.adminApprovalData,
      adminApprovalVerifyingKey:
        payload.walletApprovalVerifyingKey?.trim() ||
        commitment.adminApprovalVerifyingKey,
      completionDecisionTxId:
        payload.completionDecisionTxId?.trim() ||
        commitment.completionDecisionTxId,
      escrowDecisionTxId:
        payload.escrowDecisionTxId?.trim() || commitment.escrowDecisionTxId,
      approvedBy: payload.decidedBy?.trim() || commitment.approvedBy,
      approvedAt: new Date().toISOString(),
      chainNote:
        quest.rewardMode === "escrow-auto"
          ? `Admin approved the completion on-chain${payload.escrowDecisionTxId ? " and reserved escrow funds" : ""}. Reward is now claimable from escrow through the user's wallet.`
          : "Admin approved the completion on-chain. XP-only quest is finalized with no escrow claim required.",
    };
  }

  return {
    ...commitment,
    verificationStatus: "rejected",
    rewardStatus:
      quest.rewardMode === "escrow-auto" ? "rejected" : commitment.rewardStatus,
    rejectedBy: payload.decidedBy?.trim() || commitment.rejectedBy,
    rejectedAt: new Date().toISOString(),
    chainNote:
      "Admin rejected the completion after review. No escrow reward can be claimed.",
  };
}

export function applyRewardClaim(
  commitment: CommitmentRecord,
  payload: RewardClaimRequest,
): CommitmentRecord {
  if (commitment.rewardStatus !== "claimable") {
    throw new Error("reward is not claimable");
  }

  const walletAddress = payload.walletAddress?.trim();
  if (!walletAddress) {
    throw new Error("walletAddress is required");
  }

  if (walletAddress !== commitment.walletAddress) {
    throw new Error("reward claim must be submitted by the original wallet");
  }

  return {
    ...commitment,
    verificationStatus: "claimed",
    rewardStatus: "claimed",
    claimSignature:
      payload.walletApprovalSignature?.trim() || commitment.claimSignature,
    claimData: payload.walletApprovalData?.trim() || commitment.claimData,
    claimVerifyingKey:
      payload.walletApprovalVerifyingKey?.trim() || commitment.claimVerifyingKey,
    escrowClaimTxId:
      payload.escrowClaimTxId?.trim() || commitment.escrowClaimTxId,
    completionClaimTxId:
      payload.completionClaimTxId?.trim() || commitment.completionClaimTxId,
    claimedBy: walletAddress,
    claimedAt: new Date().toISOString(),
    chainNote:
      "User claimed an admin-approved escrow reward with connector-submitted on-chain transactions.",
  };
}

function normalizeDimensions(dimensions: Record<string, number>) {
  const pairs = Object.entries(dimensions).filter(
    ([key, value]) => key.trim().length > 0 && Number.isFinite(value),
  );

  if (pairs.length === 0) {
    throw new Error("dimensions must include at least one weighted dimension");
  }

  return Object.fromEntries(pairs);
}

function normalizeSteps(steps: string[] | undefined) {
  const normalized = (steps ?? [])
    .map((step) => step.trim())
    .filter((step) => step.length > 0);

  if (normalized.length === 0) {
    return [
      "it should explain shielded transactions",
      "it should be clearly documented",
    ];
  }

  return normalized;
}

export function createReviewerPolicy(
  payload: ReviewerPolicyCreateRequest,
): ReviewerPolicyRecord {
  if (!payload.agentId?.trim()) {
    throw new Error("agentId is required");
  }

  if (!payload.model?.trim()) {
    throw new Error("model is required");
  }

  if (!payload.category?.trim()) {
    throw new Error("category is required");
  }

  const now = new Date().toISOString();

  return {
    id: createId("policy"),
    agentId: payload.agentId.trim(),
    model: payload.model.trim(),
    category: payload.category.trim(),
    scoreThreshold: Number(payload.scoreThreshold ?? 70),
    dimensions: normalizeDimensions(
      payload.dimensions ?? {
        technicalDepth: 0.4,
        factualAccuracy: 0.3,
        clarity: 0.2,
        originality: 0.1,
      },
    ),
    steps: normalizeSteps(payload.steps),
    maxTokens: Number(payload.maxTokens ?? 8000),
    timeoutMs: Number(payload.timeoutMs ?? 12000),
    retryLimit: Number(payload.retryLimit ?? 1),
    active: payload.active ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateReviewerPolicy(
  existing: ReviewerPolicyRecord,
  payload: ReviewerPolicyUpdateRequest,
): ReviewerPolicyRecord {
  const nextDimensions = payload.dimensions
    ? normalizeDimensions(payload.dimensions)
    : existing.dimensions;

  return {
    ...existing,
    agentId: payload.agentId?.trim() || existing.agentId,
    model: payload.model?.trim() || existing.model,
    category: payload.category?.trim() || existing.category,
    scoreThreshold: Number(payload.scoreThreshold ?? existing.scoreThreshold),
    dimensions: nextDimensions,
    steps: payload.steps ? normalizeSteps(payload.steps) : existing.steps,
    maxTokens: Number(payload.maxTokens ?? existing.maxTokens),
    timeoutMs: Number(payload.timeoutMs ?? existing.timeoutMs),
    retryLimit: Number(payload.retryLimit ?? existing.retryLimit),
    active: payload.active ?? existing.active,
    updatedAt: new Date().toISOString(),
  };
}
