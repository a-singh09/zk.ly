import type {
  EscalationDecisionRequest,
  EscalationRecord,
  EscalationRequest,
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

function normalizeDimensions(dimensions: Record<string, number>) {
  const pairs = Object.entries(dimensions).filter(
    ([key, value]) => key.trim().length > 0 && Number.isFinite(value),
  );

  if (pairs.length === 0) {
    throw new Error("dimensions must include at least one weighted dimension");
  }

  return Object.fromEntries(pairs);
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
    maxTokens: Number(payload.maxTokens ?? existing.maxTokens),
    timeoutMs: Number(payload.timeoutMs ?? existing.timeoutMs),
    retryLimit: Number(payload.retryLimit ?? existing.retryLimit),
    active: payload.active ?? existing.active,
    updatedAt: new Date().toISOString(),
  };
}
