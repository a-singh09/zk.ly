const API_BASE_URL =
  import.meta.env.VITE_ZKLY_API_URL ?? "http://127.0.0.1:8787";

export interface AiReviewResponse {
  reviewId: string;
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

export interface CommitmentResponse {
  commitmentId: string;
  reviewId: string;
  walletAddress: string;
  authorizationMode: string;
  commitmentHash: string;
  status: "authorized" | "pending-chain";
  createdAt: string;
  chainNote: string;
  review?: AiReviewResponse;
  disclosure?: DisclosureRecord;
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
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
