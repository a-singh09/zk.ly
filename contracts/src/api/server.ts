import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import OpenAI from "openai";

interface ReviewRequest {
  spaceId?: string;
  questId?: string;
  artifactUrl?: string;
  artifactText?: string;
}

interface CommitmentRequest {
  reviewId?: string;
  walletAddress?: string;
  authorizationMode?: string;
}

interface ReviewRecord {
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
  reviewerNotes?: string;
  breakdown: {
    accuracy: number;
    completeness: number;
    originality: number;
    relevance: number;
  };
  reviewedAt: string;
}

interface CommitmentRecord {
  commitmentId: string;
  reviewId: string;
  walletAddress: string;
  authorizationMode: string;
  commitmentHash: string;
  status: "authorized" | "pending-chain";
  createdAt: string;
}

interface SpaceRecord {
  id: string;
  name: string;
  desc: string;
  members: number;
  quests: number;
  createdAt: string;
  creatorWallet?: string;
}

interface SpaceCreateRequest {
  name?: string;
  desc?: string;
  creatorWallet?: string;
}

interface DisclosureRecord {
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

interface SubmissionRecord {
  submissionId: string;
  reviewId: string;
  artifactUrl: string;
  walletAddress: string;
  walletHint: string;
  score: number;
  threshold: number;
  aiPassed: boolean;
  scoreBand: string;
  summary: string;
  reviewerNotes?: string;
  breakdown: { accuracy: number; completeness: number; originality: number; relevance: number };
  evidenceHash: string;
  submittedAt: string;
  adminDecision: "approved" | "rejected" | null;
  confirmed: boolean;
}

interface ConfirmRequest {
  decisions?: Array<{ submissionId?: string; approved?: boolean }>;
}

const reviews = new Map<string, ReviewRecord>();
const commitments = new Map<string, CommitmentRecord>();
const adminDecisions = new Map<string, { approved: boolean; confirmedAt: string }>();
const spaces = new Map<string, SpaceRecord>([
  [
    "midnight",
    {
      id: "midnight",
      name: "Midnight Fellowship",
      desc: "Reference space for the Midnight Network community builders and educators.",
      members: 1420,
      quests: 34,
      createdAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  [
    "oblivion",
    {
      id: "oblivion",
      name: "Oblivion Protocol",
      desc: "ZK-powered GDPR deletion services ecosystem.",
      members: 890,
      quests: 12,
      createdAt: "2026-04-01T00:00:00.000Z",
    },
  ],
  [
    "zkdonor",
    {
      id: "zkdonor",
      name: "zkDonor Labs",
      desc: "Medical logistics transparency platform.",
      members: 340,
      quests: 8,
      createdAt: "2026-04-01T00:00:00.000Z",
    },
  ],
]);
const PORT = Number(process.env.PORT ?? 8787);

function sendJson(response: any, statusCode: number, body: unknown) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(body, null, 2));
}

function readJsonBody(request: any): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }

      try {
        const parsed = JSON.parse(
          Buffer.concat(chunks).toString("utf8"),
        ) as Record<string, unknown>;
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

interface DevToArticleRaw {
  title?: string;
  description?: string;
  body_markdown?: string;
  tag_list?: string[] | string;
  user?: { name?: string; username?: string };
  readable_publish_date?: string;
  url?: string;
}

interface ScoreResult {
  score: number;
  breakdown: { accuracy: number; completeness: number; originality: number; relevance: number };
  summary: string;
  reviewerNotes: string;
}

async function fetchDevToArticle(artifactUrl: string): Promise<DevToArticleRaw | null> {
  try {
    const parsed = new URL(artifactUrl);
    if (parsed.hostname !== "dev.to") return null;
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const [username, slug] = parts;
    const res = await fetch(
      `https://dev.to/api/articles/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as DevToArticleRaw;
  } catch {
    return null;
  }
}

function mockScore(input: ReviewRequest): ScoreResult {
  const basis = `${input.artifactUrl ?? ""}|${input.artifactText ?? ""}`;
  const digest = createHash("sha256").update(basis || "midnight").digest();
  const accuracy = 55 + (digest[0] % 31);
  const completeness = 45 + (digest[1] % 31);
  const originality = 35 + (digest[2] % 31);
  const relevance = 45 + (digest[3] % 31);
  const score = Math.min(100, Math.round((accuracy + completeness + originality + relevance) / 4));
  return {
    score,
    breakdown: { accuracy, completeness, originality, relevance },
    summary: score >= 70
      ? "AI review passed the rubric and is ready for wallet authorization."
      : "AI review completed but did not clear the current threshold.",
    reviewerNotes: "Demo mode — set OPENAI_API_KEY for live AI scoring.",
  };
}

async function scoreWithAI(article: DevToArticleRaw): Promise<ScoreResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const tags = Array.isArray(article.tag_list)
    ? article.tag_list.join(", ")
    : (article.tag_list ?? "");
  const body = (article.body_markdown ?? "").slice(0, 6000);

  const prompt = `You are an expert blog post reviewer for a developer quest platform.

Evaluate the following dev.to blog post against this rubric. Return ONLY a JSON object with this exact shape:
{
  "accuracy": <integer 0-100>,
  "completeness": <integer 0-100>,
  "originality": <integer 0-100>,
  "relevance": <integer 0-100>,
  "summary": "<one sentence summary of the review>",
  "reviewerNotes": "<2-3 sentences of specific feedback>"
}

Rubric:
- accuracy (0-100): Are the facts, code examples, and claims correct?
- completeness (0-100): Does the post cover the topic with sufficient depth?
- originality (0-100): Does it go beyond paraphrasing docs or copying other posts?
- relevance (0-100): Is the content relevant to blockchain, ZK proofs, or developer tooling?

Post metadata:
Title: ${article.title ?? "N/A"}
Author: ${article.user?.username ?? "N/A"}
Tags: ${tags}
Published: ${article.readable_publish_date ?? "N/A"}

Post body (up to 6000 chars):
${body}`;

  try {
    const client = new OpenAI({ apiKey });
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 512,
    });
    const raw = JSON.parse(res.choices[0].message.content ?? "{}") as {
      accuracy?: number;
      completeness?: number;
      originality?: number;
      relevance?: number;
      summary?: string;
      reviewerNotes?: string;
    };
    const accuracy = Math.min(100, Math.max(0, raw.accuracy ?? 60));
    const completeness = Math.min(100, Math.max(0, raw.completeness ?? 60));
    const originality = Math.min(100, Math.max(0, raw.originality ?? 60));
    const relevance = Math.min(100, Math.max(0, raw.relevance ?? 60));
    const score = Math.round((accuracy + completeness + originality + relevance) / 4);
    return {
      score,
      breakdown: { accuracy, completeness, originality, relevance },
      summary: raw.summary ?? (score >= 70
        ? "AI review passed the rubric."
        : "AI review did not clear the threshold."),
      reviewerNotes: raw.reviewerNotes ?? "",
    };
  } catch {
    return null;
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
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

async function createReview(input: ReviewRequest): Promise<ReviewRecord> {
  const reviewId = `review_${randomUUID()}`;
  const spaceId = input.spaceId?.trim() || "midnight";
  const questId = input.questId?.trim() || "blog-quest-demo";
  const artifactUrl = input.artifactUrl?.trim() || "https://dev.to/midnight/demo";
  const artifactText = input.artifactText?.trim();
  const threshold = 70;

  const article = await fetchDevToArticle(artifactUrl);
  const aiResult = article ? await scoreWithAI(article) : null;
  const { score, breakdown, summary, reviewerNotes } = aiResult ?? mockScore({ artifactUrl, artifactText });

  const evidenceHash = createHash("sha256")
    .update(`${questId}|${artifactUrl}|${artifactText ?? ""}|${score}`)
    .digest("hex");

  return {
    reviewId,
    spaceId,
    questId,
    artifactUrl,
    artifactText,
    score,
    threshold,
    passed: score >= threshold,
    evidenceHash: `0x${evidenceHash}`,
    summary,
    reviewerNotes,
    breakdown,
    reviewedAt: new Date().toISOString(),
  };
}

function createCommitment(
  review: ReviewRecord,
  input: CommitmentRequest,
): CommitmentRecord {
  const walletAddress =
    input.walletAddress?.trim() || "pending-wallet-authorization";
  const authorizationMode = input.authorizationMode?.trim() || "dapp-connector";
  const commitmentId = `commit_${randomUUID()}`;
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

function toDisclosureRecord(
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

const server = createServer(async (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Missing request URL" });
    return;
  }

  const url = new URL(
    request.url,
    `http://${request.headers.host ?? "localhost"}`,
  );

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "zk.ly mock ai api",
      spaces: spaces.size,
      reviews: reviews.size,
      commitments: commitments.size,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/spaces") {
    sendJson(response, 200, {
      items: Array.from(spaces.values()),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/spaces") {
    try {
      const body = (await readJsonBody(request)) as SpaceCreateRequest;
      const name = body.name?.trim();
      const desc = body.desc?.trim();

      if (!name || !desc) {
        sendJson(response, 400, {
          error: "name and desc are required",
        });
        return;
      }

      const baseId = slugify(name) || `space-${randomUUID().slice(0, 8)}`;
      let id = baseId;
      let suffix = 1;
      while (spaces.has(id)) {
        id = `${baseId}-${suffix}`;
        suffix += 1;
      }

      const space: SpaceRecord = {
        id,
        name,
        desc,
        members: 1,
        quests: 1,
        createdAt: new Date().toISOString(),
        creatorWallet: body.creatorWallet?.trim() || undefined,
      };

      spaces.set(space.id, space);
      sendJson(response, 200, space);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid space payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reviews") {
    try {
      const body = (await readJsonBody(request)) as ReviewRequest;
      const review = await createReview(body);
      reviews.set(review.reviewId, review);
      sendJson(response, 200, review);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid review payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/reviews/")) {
    const reviewId = url.pathname.split("/").pop() ?? "";
    const review = reviews.get(reviewId);
    if (!review) {
      sendJson(response, 404, { error: "Review not found" });
      return;
    }

    sendJson(response, 200, review);
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/commitments") {
    try {
      const body = (await readJsonBody(request)) as CommitmentRequest;
      if (!body.reviewId) {
        sendJson(response, 400, { error: "reviewId is required" });
        return;
      }

      const review = reviews.get(body.reviewId);
      if (!review) {
        sendJson(response, 404, { error: "Review not found" });
        return;
      }

      const commitment = createCommitment(review, body);
      commitments.set(commitment.commitmentId, commitment);
      sendJson(response, 200, {
        ...commitment,
        review,
        disclosure: toDisclosureRecord(review, commitment),
        chainNote:
          "Contracts are not deployed yet, so this is a pre-commit authorization artifact.",
      });
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid commitment payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname.startsWith("/api/commitments/")
  ) {
    const commitmentId = url.pathname.split("/").pop() ?? "";
    const commitment = commitments.get(commitmentId);
    if (!commitment) {
      sendJson(response, 404, { error: "Commitment not found" });
      return;
    }

    const review = reviews.get(commitment.reviewId);
    if (!review) {
      sendJson(response, 404, { error: "Review not found for commitment" });
      return;
    }

    sendJson(response, 200, {
      ...commitment,
      review,
      disclosure: toDisclosureRecord(review, commitment),
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/disclosures") {
    const disclosures = Array.from(commitments.values())
      .map((commitment) => {
        const review = reviews.get(commitment.reviewId);
        if (!review) return null;
        return toDisclosureRecord(review, commitment);
      })
      .filter((record): record is DisclosureRecord => record !== null)
      .sort((a, b) =>
        b.disclosed.reviewedAt.localeCompare(a.disclosed.reviewedAt),
      );

    sendJson(response, 200, { items: disclosures });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/submissions") {
    const submissions: SubmissionRecord[] = Array.from(commitments.values())
      .map((commitment) => {
        const review = reviews.get(commitment.reviewId);
        if (!review) return null;
        const decision = adminDecisions.get(commitment.commitmentId);
        return {
          submissionId: commitment.commitmentId,
          reviewId: review.reviewId,
          artifactUrl: review.artifactUrl,
          walletAddress: commitment.walletAddress,
          walletHint: walletHint(commitment.walletAddress),
          score: review.score,
          threshold: review.threshold,
          aiPassed: review.passed,
          scoreBand: toScoreBand(review.score),
          summary: review.summary,
          reviewerNotes: review.reviewerNotes,
          breakdown: review.breakdown,
          evidenceHash: review.evidenceHash,
          submittedAt: commitment.createdAt,
          adminDecision: decision ? (decision.approved ? "approved" as const : "rejected" as const) : null,
          confirmed: !!decision,
        };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    sendJson(response, 200, { items: submissions });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/admin/confirm") {
    try {
      const body = (await readJsonBody(request)) as ConfirmRequest;
      if (!Array.isArray(body.decisions) || body.decisions.length === 0) {
        sendJson(response, 400, { error: "decisions array is required" });
        return;
      }

      const confirmedAt = new Date().toISOString();
      for (const d of body.decisions) {
        if (!d.submissionId || typeof d.approved !== "boolean") continue;
        adminDecisions.set(d.submissionId, { approved: d.approved, confirmedAt });
      }

      sendJson(response, 200, {
        ok: true,
        confirmed: body.decisions.length,
        confirmedAt,
      });
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid confirm payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  sendJson(response, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`zk.ly mock AI API listening on http://127.0.0.1:${PORT}`);
});
