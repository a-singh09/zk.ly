import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";

interface ReviewRequest {
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

interface CommitmentRecord {
  commitmentId: string;
  reviewId: string;
  walletAddress: string;
  authorizationMode: string;
  commitmentHash: string;
  status: "authorized" | "pending-chain";
  createdAt: string;
}

const reviews = new Map<string, ReviewRecord>();
const commitments = new Map<string, CommitmentRecord>();
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

function createReview(input: ReviewRequest): ReviewRecord {
  const reviewId = `review_${randomUUID()}`;
  const questId = input.questId?.trim() || "blog-quest-demo";
  const artifactUrl =
    input.artifactUrl?.trim() || "https://dev.to/midnight/demo";
  const artifactText = input.artifactText?.trim();
  const { score, breakdown } = scoreFromInput({ artifactUrl, artifactText });
  const threshold = 70;
  const evidenceHash = createHash("sha256")
    .update(`${questId}|${artifactUrl}|${artifactText ?? ""}|${score}`)
    .digest("hex");

  return {
    reviewId,
    questId,
    artifactUrl,
    artifactText,
    score,
    threshold,
    passed: score >= threshold,
    evidenceHash: `0x${evidenceHash}`,
    summary:
      score >= threshold
        ? "AI review passed the rubric and is ready for wallet authorization."
        : "AI review completed but did not clear the current threshold.",
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
      reviews: reviews.size,
      commitments: commitments.size,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/reviews") {
    try {
      const body = (await readJsonBody(request)) as ReviewRequest;
      const review = createReview(body);
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

  sendJson(response, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`zk.ly mock AI API listening on http://127.0.0.1:${PORT}`);
});
