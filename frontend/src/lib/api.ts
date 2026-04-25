const API_BASE_URL =
  import.meta.env.VITE_ZKLY_API_URL ?? "http://127.0.0.1:8787";

const REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_API_TIMEOUT_MS ?? 45_000,
);

export interface AiReviewResponse {
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
  thinking?: string;
  reviewedAt: string;
}

export interface CommitmentResponse {
  commitmentId: string;
  reviewId: string;
  questId: string;
  walletAddress: string;
  authorizationMode: string;
  walletApprovalSignature?: string;
  walletApprovalData?: string;
  walletApprovalVerifyingKey?: string;
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
  verificationStatus: "pending-admin" | "approved" | "rejected" | "claimed";
  rewardStatus: "none" | "awaiting-admin" | "claimable" | "claimed" | "rejected";
  rewardMode: RewardMode;
  rewardAmount: number;
  approvedBy?: string;
  approvedAt?: string;
  completionDecisionTxId?: string;
  escrowDecisionTxId?: string;
  claimedBy?: string;
  claimedAt?: string;
  escrowClaimTxId?: string;
  completionClaimTxId?: string;
  createdAt: string;
  chainNote: string;
  review?: AiReviewResponse;
  quest?: QuestRecord;
  disclosure?: DisclosureRecord;
}

export type QuestTrack =
  | "builder"
  | "educator"
  | "advocate"
  | "community-leadership";

export type RewardMode = "xp-only" | "escrow-auto";

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
  verificationStatus: "pending-admin" | "approved" | "rejected" | "claimed";
  rewardStatus: "none" | "awaiting-admin" | "claimable" | "claimed" | "rejected";
  rewardAmount: number;
  disclosed: {
    passed: boolean;
    scoreBand: string;
    walletHint: string;
    reviewedAt: string;
  };
}

export type EscalationStatus =
  | "pending-admin"
  | "approved"
  | "rejected"
  | "needs-more-info";

export interface EscalationRecord {
  escalationId: string;
  reviewId: string;
  artifactUrl: string;
  reason: string;
  notes?: string;
  reviewThinking?: string;
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

export interface RewardApprovalRecord {
  commitmentId: string;
  reviewId: string;
  questId: string;
  spaceId: string;
  walletAddress: string;
  artifactUrl: string;
  reviewScore: number;
  reviewPassed: boolean;
  reviewThinking?: string;
  verificationStatus: "pending-admin" | "approved" | "rejected" | "claimed";
  rewardStatus: "none" | "awaiting-admin" | "claimable" | "claimed" | "rejected";
  rewardMode: RewardMode;
  rewardAmount: number;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  claimedAt?: string;
  claimedBy?: string;
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
  onChainMode?: "midnight" | "mock" | "wallet-popup";
  onChainReason?: string;
  walletApprovalSignature?: string;
  walletApprovalData?: string;
  walletApprovalVerifyingKey?: string;
  creatorWallet?: string;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface DevToArticle {
  id: number;
  title: string;
  description: string;
  url: string;
  canonical_url: string;
  body_markdown?: string;
  published_at: string;
  readable_publish_date: string;
  tag_list: string[] | string;
  user: {
    name: string;
    username: string;
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${Math.floor(REQUEST_TIMEOUT_MS / 1000)}s. Check backend/proof server health and retry.`,
      );
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }

  if (!response.ok) {
    const raw = await response.text();
    try {
      const payload = JSON.parse(raw) as {
        error?: string;
        details?: string;
      };
      const errorText = [payload.error, payload.details]
        .filter(Boolean)
        .join(": ");
      throw new Error(
        errorText || `Request failed with status ${response.status}`,
      );
    } catch {
      throw new Error(raw || `Request failed with status ${response.status}`);
    }
  }

  return (await response.json()) as T;
}

export function runAiReview(payload: {
  spaceId?: string;
  questId: string;
  artifactUrl: string;
  artifactText?: string;
}) {
  return requestJson<AiReviewResponse>("/api/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function authorizeReviewCommitment(payload: {
  reviewId: string;
  walletAddress: string;
  authorizationMode?: string;
  walletApprovalSignature?: string;
  walletApprovalData?: string;
  walletApprovalVerifyingKey?: string;
  /** On-chain cert ID from the DApp connector verify_completion intent */
  onChainCertId?: string;
  /** Full commitment hash derived client-side */
  onChainCommitmentHash?: string;
  /** Review payload commitment hash */
  onChainReviewCommitmentHash?: string;
  /** Tx ID (hash of wallet signature) */
  onChainTxId?: string;
  /** How the on-chain interaction was performed */
  onChainMode?: "midnight" | "mock" | "wallet-popup";
  /** Human-readable chain note */
  chainNote?: string;
}) {
  return requestJson<CommitmentResponse>("/api/commitments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSpaces() {
  return requestJson<{ items: SpaceRecord[] }>("/api/spaces");
}

export function createSpace(payload: {
  name: string;
  desc: string;
  creatorWallet?: string;
}) {
  return requestJson<SpaceRecord>("/api/spaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCommitment(commitmentId: string) {
  return requestJson<CommitmentResponse>(`/api/commitments/${commitmentId}`);
}

export function getAdminDisclosures() {
  return requestJson<{ items: DisclosureRecord[] }>("/api/admin/disclosures");
}

export function createEscalation(payload: {
  reviewId: string;
  reason: string;
  artifactUrl?: string;
  requestedByWallet?: string;
  notes?: string;
}) {
  return requestJson<EscalationRecord>("/api/escalations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminEscalations() {
  return requestJson<{ items: EscalationRecord[] }>("/api/admin/escalations");
}

export function getAdminRewardApprovals() {
  return requestJson<{ items: RewardApprovalRecord[] }>(
    "/api/admin/reward-approvals",
  );
}

export function decideEscalation(
  escalationId: string,
  payload: {
    status: EscalationStatus;
    adminNotes?: string;
    resolutionSummary?: string;
    decidedBy?: string;
  },
) {
  return requestJson<EscalationRecord>(
    `/api/admin/escalations/${escalationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function decideRewardApproval(
  commitmentId: string,
  payload: {
    status: "approved" | "rejected";
    decidedBy?: string;
    adminNotes?: string;
    walletApprovalSignature?: string;
    walletApprovalData?: string;
    walletApprovalVerifyingKey?: string;
    completionDecisionTxId?: string;
    escrowDecisionTxId?: string;
  },
) {
  return requestJson<CommitmentResponse>(
    `/api/admin/reward-approvals/${commitmentId}/decision`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function claimReward(
  commitmentId: string,
  payload: {
    walletAddress: string;
    walletApprovalSignature?: string;
    walletApprovalData?: string;
    walletApprovalVerifyingKey?: string;
    escrowClaimTxId?: string;
    completionClaimTxId?: string;
  },
) {
  return requestJson<CommitmentResponse>(`/api/commitments/${commitmentId}/claim`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getReviewerPolicies() {
  return requestJson<{ items: ReviewerPolicyRecord[] }>(
    "/api/admin/reviewer-policies",
  );
}

export function createReviewerPolicy(payload: {
  agentId: string;
  model: string;
  category: string;
  scoreThreshold: number;
  dimensions: Record<string, number>;
  steps: string[];
  maxTokens: number;
  timeoutMs: number;
  retryLimit: number;
  active?: boolean;
}) {
  return requestJson<ReviewerPolicyRecord>("/api/admin/reviewer-policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateReviewerPolicy(
  policyId: string,
  payload: Partial<{
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
  }>,
) {
  return requestJson<ReviewerPolicyRecord>(
    `/api/admin/reviewer-policies/${policyId}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function getQuests(spaceId?: string) {
  const params = spaceId ? `?spaceId=${encodeURIComponent(spaceId)}` : "";
  return requestJson<{ items: QuestRecord[] }>(`/api/quests${params}`);
}

export function getQuestsBySpace(spaceId: string) {
  return getQuests(spaceId);
}

export function getQuest(questId: string) {
  return requestJson<QuestRecord>(`/api/quests/${questId}`);
}

export function createQuest(payload: {
  spaceId: string;
  name: string;
  description: string;
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
  /** On-chain quest ID from the DApp connector create_quest circuit call. */
  onChainQuestId?: string;
  /** Transaction ID returned after wallet submission. */
  onChainTxId?: string;
  /** How the on-chain interaction was performed. */
  onChainMode?: "midnight" | "mock" | "wallet-popup";
  /** Human-readable note about the on-chain status. */
  onChainReason?: string;
}) {
  return requestJson<QuestRecord>("/api/quests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function publishQuestOnChain(
  questId: string,
  payload: {
    walletAddress: string;
    walletApprovalSignature: string;
    walletApprovalData?: string;
    walletApprovalVerifyingKey?: string;
  },
) {
  return requestJson<QuestRecord>(`/api/quests/${questId}/publish`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateQuest(
  questId: string,
  payload: Partial<{
    name: string;
    description: string;
    type: string;
    track: QuestTrack;
    policyId?: string;
    reward: number;
    rewardMode: RewardMode;
    escrowContractAddress?: string;
    escrowAmount?: number;
    criteriaJson?: Record<string, unknown>;
    active: boolean;
  }>,
) {
  return requestJson<QuestRecord>(`/api/quests/${questId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteQuest(questId: string) {
  return fetch(`${API_BASE_URL}/api/quests/${questId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((r) =>
    r.ok ? Promise.resolve() : r.text().then((t) => Promise.reject(t)),
  );
}

export async function fetchDevToArticle(url: string): Promise<DevToArticle> {
  const parsed = new URL(url);
  if (parsed.hostname !== "dev.to") {
    throw new Error("Only dev.to URLs are supported for live blog fetch.");
  }

  const pathParts = parsed.pathname.split("/").filter(Boolean);
  if (pathParts.length < 2) {
    throw new Error("Invalid dev.to URL format.");
  }

  const [username, slug] = pathParts;
  const response = await fetch(
    `https://dev.to/api/articles/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
  );

  if (!response.ok) {
    throw new Error("Could not fetch dev.to article metadata.");
  }

  return (await response.json()) as DevToArticle;
}

export function getLeaderboard() {
  return requestJson<{
    items: Array<{
      rank: number;
      wallet: string;
      tier: string;
      quests: number;
      spaces: number;
      xpPublic: number;
    }>;
  }>("/api/leaderboard");
}

export function getProfile(wallet: string) {
  return requestJson<{
    wallet: string;
    tier: string;
    verifiedQuests: number;
    activeSpaces: number;
    xpPublic: number;
    memberSince: string;
  }>(`/api/profile/${encodeURIComponent(wallet)}`);
}

export interface MidnightHealthStatus {
  ok: boolean;
  mode: "midnight-backed" | "hybrid-fallback";
  midnight: {
    enabled: boolean;
    reason?: string;
    questContractAddress?: string;
    completionContractAddress?: string;
    txSubmissionMode?: "backend-operator" | "wallet-popup";
  };
  spaces: number;
  reviews: number;
  commitments: number;
}

export function getMidnightHealth(): Promise<MidnightHealthStatus> {
  return requestJson<MidnightHealthStatus>("/health");
}
