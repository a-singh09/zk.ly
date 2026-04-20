import { createHash } from "node:crypto";
import OpenAI from "openai";
import type {
  CommitmentRecord,
  CommitmentRequest,
  DisclosureRecord,
  ReviewRecord,
  ReviewRequest,
} from "../domain/models.js";
import { createId } from "../domain/store.js";

interface DevToArticleRaw {
  title?: string;
  description?: string;
  body_markdown?: string;
  tag_list?: string[] | string;
  user?: { name?: string; username?: string };
  readable_publish_date?: string;
}

interface ScoreResult {
  score: number;
  breakdown: {
    accuracy: number;
    completeness: number;
    originality: number;
    relevance: number;
  };
  summary: string;
  analysisMessage: string;
}

function scoreFromInput(input: ReviewRequest): ScoreResult {
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
  const passed = score >= 70;

  return {
    score,
    breakdown: { accuracy, completeness, originality, relevance },
    summary: passed
      ? "AI review passed the rubric and is ready for wallet authorization."
      : "AI review completed in demo mode but did not clear the threshold.",
    analysisMessage: passed
      ? "Mock AI analysis: structure, technical consistency, and rubric alignment passed for demo-mode verification."
      : "Mock AI analysis: submission missed rubric threshold on completeness and relevance. Escalate to admin review if evidence should still qualify.",
  };
}

async function fetchDevToArticle(
  artifactUrl: string,
): Promise<DevToArticleRaw | null> {
  try {
    const parsed = new URL(artifactUrl);
    if (parsed.hostname !== "dev.to") return null;

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts.length < 2) return null;

    const [username, slug] = pathParts;
    const response = await fetch(
      `https://dev.to/api/articles/${encodeURIComponent(username)}/${encodeURIComponent(slug)}`,
    );

    if (!response.ok) return null;
    return (await response.json()) as DevToArticleRaw;
  } catch {
    return null;
  }
}

async function scoreWithOpenAI(
  article: DevToArticleRaw,
): Promise<ScoreResult | null> {
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
  "summary": "<one sentence summary of the review>"
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
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_REVIEW_MODEL ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 512,
    });

    const raw = JSON.parse(response.choices[0]?.message?.content ?? "{}") as {
      accuracy?: number;
      completeness?: number;
      originality?: number;
      relevance?: number;
      summary?: string;
    };

    const accuracy = Math.min(100, Math.max(0, raw.accuracy ?? 60));
    const completeness = Math.min(100, Math.max(0, raw.completeness ?? 60));
    const originality = Math.min(100, Math.max(0, raw.originality ?? 60));
    const relevance = Math.min(100, Math.max(0, raw.relevance ?? 60));
    const score = Math.round(
      (accuracy + completeness + originality + relevance) / 4,
    );

    return {
      score,
      breakdown: { accuracy, completeness, originality, relevance },
      summary:
        raw.summary ??
        (score >= 70
          ? "AI review passed the rubric and is ready for wallet authorization."
          : "AI review did not clear the threshold."),
      analysisMessage:
        "Live AI analysis completed via OpenAI using fetched dev.to article data.",
    };
  } catch {
    return null;
  }
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

function buildReview(params: {
  reviewId: string;
  spaceId: string;
  questId: string;
  artifactUrl: string;
  artifactText?: string;
  threshold: number;
  scoring: ScoreResult;
  reviewMode: ReviewRecord["reviewMode"];
}): ReviewRecord {
  const { reviewId, spaceId, questId, artifactUrl, artifactText } = params;
  const { score, breakdown, summary, analysisMessage } = params.scoring;
  const threshold = params.threshold;
  const passed = score >= threshold;
  const evidenceHash = createHash("sha256")
    .update(`${questId}|${artifactUrl}|${artifactText ?? ""}|${score}`)
    .digest("hex");

  return {
    reviewId,
    reviewMode: params.reviewMode,
    analysisMessage,
    spaceId,
    questId,
    artifactUrl,
    artifactText,
    score,
    threshold,
    passed,
    evidenceHash: `0x${evidenceHash}`,
    summary,
    breakdown,
    reviewedAt: new Date().toISOString(),
  };
}

export async function createReview(input: ReviewRequest): Promise<ReviewRecord> {
  const reviewId = createId("review");
  const spaceId = input.spaceId?.trim() || "midnight";
  const questId = input.questId?.trim() || "blog-quest-demo";
  const artifactUrl =
    input.artifactUrl?.trim() || "https://dev.to/midnight/demo";
  const artifactText = input.artifactText?.trim();
  const threshold = 70;

  const article = await fetchDevToArticle(artifactUrl);
  const openAiScoring = article ? await scoreWithOpenAI(article) : null;

  if (openAiScoring) {
    return buildReview({
      reviewId,
      spaceId,
      questId,
      artifactUrl,
      artifactText,
      threshold,
      scoring: openAiScoring,
      reviewMode: "openai",
    });
  }

  return buildReview({
    reviewId,
    spaceId,
    questId,
    artifactUrl,
    artifactText,
    threshold,
    scoring: scoreFromInput({ artifactUrl, artifactText }),
    reviewMode: "mock",
  });
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
