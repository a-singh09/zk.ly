export interface ReviewRequest {
  spaceId?: string;
  questId?: string;
  artifactUrl?: string;
  artifactText?: string;
}

export type QuestTrack =
  | "builder"
  | "educator"
  | "advocate"
  | "community-leadership";

export type RewardMode = "xp-only" | "escrow-auto";

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
  steps?: string[];
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
  policyId?: string;
  track?: QuestTrack;
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
  reviewCommitmentHash?: string;
  selectiveDisclosureHash?: string;
  onChainReviewCommitmentHash?: string;
  onChainCommitmentCommitmentHash?: string;
  onChainCertificateId?: string;
  onChainQuestId?: string;
  onChainTxId?: string;
  proofMode: "mock" | "midnight";
  status: "authorized" | "pending-chain";
  chainNote?: string;
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
  track?: QuestTrack;
  artifactUrl: string;
  evidenceHash: string;
  commitmentHash: string;
  reviewCommitmentHash?: string;
  selectiveDisclosureHash?: string;
  onChainReviewCommitmentHash?: string;
  onChainCommitmentCommitmentHash?: string;
  onChainCertificateId?: string;
  onChainTxId?: string;
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
  steps: string[];
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
  track: QuestTrack;
  policyId?: string;
  reward: number;
  rewardMode: RewardMode;
  escrowContractAddress?: string;
  escrowAmount?: number;
  criteriaJson?: Record<string, unknown>;
  onChainQuestId?: string;
  onChainCriteriaCommitment?: string;
  onChainTxId?: string;
  onChainMode?: "midnight" | "mock";
  onChainReason?: string;
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
  track?: QuestTrack;
  policyId?: string;
  reward?: number;
  rewardMode?: RewardMode;
  escrowContractAddress?: string;
  escrowAmount?: number;
  criteriaJson?: Record<string, unknown>;
  creatorWallet?: string;
  publishOnChain?: boolean;
}

export interface QuestUpdateRequest {
  name?: string;
  description?: string;
  type?: string;
  track?: QuestTrack;
  policyId?: string;
  reward?: number;
  rewardMode?: RewardMode;
  escrowContractAddress?: string;
  escrowAmount?: number;
  criteriaJson?: Record<string, unknown>;
  active?: boolean;
}
