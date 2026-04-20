export interface ReviewRequest {
  spaceId?: string;
  questId?: string;
  artifactUrl?: string;
  artifactText?: string;
}

export interface CommitmentRequest {
  reviewId?: string;
  walletAddress?: string;
  authorizationMode?: string;
}

export interface SpaceCreateRequest {
  name?: string;
  desc?: string;
  creatorWallet?: string;
}

export type EscalationStatus =
  | "pending-admin"
  | "approved"
  | "rejected"
  | "needs-more-info";

export interface EscalationRequest {
  reviewId?: string;
  reason?: string;
  artifactUrl?: string;
  requestedByWallet?: string;
  notes?: string;
}

export interface EscalationDecisionRequest {
  status?: EscalationStatus;
  adminNotes?: string;
  resolutionSummary?: string;
  decidedBy?: string;
}

export interface ReviewerPolicyCreateRequest {
  agentId?: string;
  model?: string;
  category?: string;
  scoreThreshold?: number;
  dimensions?: Record<string, number>;
  maxTokens?: number;
  timeoutMs?: number;
  retryLimit?: number;
  active?: boolean;
}

export interface ReviewerPolicyUpdateRequest
  extends ReviewerPolicyCreateRequest {}

export interface ReviewRecord {
  reviewId: string;
  reviewMode: "mock" | "openai";
  analysisMessage: string;
  spaceId: string;
  questId: string;
  artifactUrl: string;
  artifactText?: string;
  score: number;
  threshold: number;
  passed: boolean;
  evidenceHash: string;
  summary: string;
  breakdown: {
    accuracy: number;
    completeness: number;
    originality: number;
    relevance: number;
  };
  reviewedAt: string;
}

export interface CommitmentRecord {
  commitmentId: string;
  reviewId: string;
  walletAddress: string;
  authorizationMode: string;
  commitmentHash: string;
  status: "authorized" | "pending-chain";
  createdAt: string;
}

export interface SpaceRecord {
  id: string;
  name: string;
  desc: string;
  members: number;
  quests: number;
  createdAt: string;
  creatorWallet?: string;
}

export interface DisclosureRecord {
  certificateId: string;
  spaceId: string;
  questId: string;
  reviewId: string;
  commitmentId: string;
  artifactUrl: string;
  evidenceHash: string;
  commitmentHash: string;
  disclosed: {
    passed: boolean;
    scoreBand: string;
    walletHint: string;
    reviewedAt: string;
  };
}

export interface EscalationRecord {
  escalationId: string;
  reviewId: string;
  artifactUrl: string;
  reason: string;
  notes?: string;
  requestedByWallet: string;
  status: EscalationStatus;
  requestedAt: string;
  resolvedAt?: string;
  adminNotes?: string;
  resolutionSummary?: string;
  decidedBy?: string;
}

export interface ReviewerPolicyRecord {
  id: string;
  agentId: string;
  model: string;
  category: string;
  scoreThreshold: number;
  dimensions: Record<string, number>;
  maxTokens: number;
  timeoutMs: number;
  retryLimit: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface QuestRecord {
  id: string;
  spaceId: string;
  name: string;
  description: string;
  type: "blog" | "github" | "social" | "onchain" | "custom";
  policyId?: string;
  reward: number;
  creatorWallet?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface QuestCreateRequest {
  spaceId?: string;
  name?: string;
  description?: string;
  type?: string;
  policyId?: string;
  reward?: number;
  creatorWallet?: string;
}

export interface QuestUpdateRequest {
  name?: string;
  description?: string;
  type?: string;
  policyId?: string;
  reward?: number;
  active?: boolean;
}
