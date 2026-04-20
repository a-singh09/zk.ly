import "dotenv/config";
import { createServer } from "node:http";
import type {
  CommitmentRequest,
  EscalationDecisionRequest,
  EscalationRequest,
  QuestCreateRequest,
  QuestRecord,
  QuestUpdateRequest,
  ReviewerPolicyCreateRequest,
  ReviewerPolicyUpdateRequest,
  ReviewRequest,
  SpaceCreateRequest,
  SpaceRecord,
} from "../domain/models.js";
import {
  commitments,
  escalations,
  quests,
  reviewerPolicies,
  reviews,
  spaces,
  createId,
} from "../domain/store.js";
import { readJsonBody, sendJson, slugify } from "./http.js";
import {
  createCommitment,
  createReview,
  toDisclosureRecord,
} from "../services/reviewService.js";
import {
  applyEscalationDecision,
  createEscalation,
  createReviewerPolicy,
  updateReviewerPolicy,
} from "../services/adminService.js";

const PORT = Number(process.env.PORT ?? 8787);

const VALID_QUEST_TYPES: QuestRecord["type"][] = [
  "blog",
  "github",
  "social",
  "onchain",
  "custom",
];

function toQuestType(value: string | undefined): QuestRecord["type"] {
  if (!value) return "custom";
  const normalized = value.trim().toLowerCase();
  return VALID_QUEST_TYPES.includes(normalized as QuestRecord["type"])
    ? (normalized as QuestRecord["type"])
    : "custom";
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
      escalations: escalations.size,
      reviewerPolicies: reviewerPolicies.size,
      mode: "demo-mock",
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

      const baseId =
        slugify(name) || `space-${Math.random().toString(16).slice(2, 10)}`;
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

  if (request.method === "POST" && url.pathname === "/api/escalations") {
    try {
      const body = (await readJsonBody(request)) as EscalationRequest;

      if (!body.reviewId) {
        sendJson(response, 400, { error: "reviewId is required" });
        return;
      }

      const review = reviews.get(body.reviewId);
      if (!review) {
        sendJson(response, 404, { error: "Review not found" });
        return;
      }

      const escalation = createEscalation(body, review);
      escalations.set(escalation.escalationId, escalation);
      sendJson(response, 200, {
        ...escalation,
        review,
      });
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid escalation payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/disclosures") {
    const disclosures = Array.from(commitments.values())
      .map((commitment) => {
        const review = reviews.get(commitment.reviewId);
        if (!review) return null;
        return toDisclosureRecord(review, commitment);
      })
      .filter((record) => record !== null)
      .sort((a, b) =>
        b.disclosed.reviewedAt.localeCompare(a.disclosed.reviewedAt),
      );

    sendJson(response, 200, { items: disclosures });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/admin/escalations") {
    const items = Array.from(escalations.values()).sort((a, b) =>
      b.requestedAt.localeCompare(a.requestedAt),
    );
    sendJson(response, 200, { items });
    return;
  }

  if (
    request.method === "PATCH" &&
    url.pathname.startsWith("/api/admin/escalations/")
  ) {
    try {
      const escalationId = url.pathname.split("/").pop() ?? "";
      const escalation = escalations.get(escalationId);
      if (!escalation) {
        sendJson(response, 404, { error: "Escalation not found" });
        return;
      }

      const body = (await readJsonBody(request)) as EscalationDecisionRequest;
      const updated = applyEscalationDecision(escalation, body);
      escalations.set(updated.escalationId, updated);
      sendJson(response, 200, updated);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid escalation decision payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === "/api/admin/reviewer-policies"
  ) {
    sendJson(response, 200, {
      items: Array.from(reviewerPolicies.values()).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    });
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname === "/api/admin/reviewer-policies"
  ) {
    try {
      const body = (await readJsonBody(request)) as ReviewerPolicyCreateRequest;
      const policy = createReviewerPolicy(body);
      reviewerPolicies.set(policy.id, policy);
      sendJson(response, 200, policy);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid reviewer policy payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "PATCH" &&
    url.pathname.startsWith("/api/admin/reviewer-policies/")
  ) {
    try {
      const policyId = url.pathname.split("/").pop() ?? "";
      const existing = reviewerPolicies.get(policyId);
      if (!existing) {
        sendJson(response, 404, { error: "Reviewer policy not found" });
        return;
      }

      const body = (await readJsonBody(request)) as ReviewerPolicyUpdateRequest;
      const updated = updateReviewerPolicy(existing, body);
      reviewerPolicies.set(updated.id, updated);
      sendJson(response, 200, updated);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid reviewer policy update payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  // Quest Management Endpoints
  if (request.method === "GET" && url.pathname === "/api/quests") {
    const spaceId = url.searchParams.get("spaceId");
    let questList = Array.from(quests.values());
    if (spaceId) {
      questList = questList.filter((q) => q.spaceId === spaceId);
    }
    sendJson(response, 200, {
      items: questList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/quests") {
    try {
      const body = (await readJsonBody(request)) as QuestCreateRequest;
      const spaceId = body.spaceId?.trim();
      const name = body.name?.trim();
      const description = body.description?.trim();
      const type = toQuestType(body.type);
      const reward = body.reward ?? 100;

      if (!spaceId || !name || !description) {
        sendJson(response, 400, {
          error: "spaceId, name, and description are required",
        });
        return;
      }

      if (!spaces.has(spaceId)) {
        sendJson(response, 404, { error: "Space not found" });
        return;
      }

      const now = new Date().toISOString();
      const questId = createId("quest");
      const quest = {
        id: questId,
        spaceId,
        name,
        description,
        type,
        policyId: body.policyId,
        reward,
        creatorWallet: body.creatorWallet,
        createdAt: now,
        updatedAt: now,
        active: true,
      };

      quests.set(questId, quest);

      // Update space quest count
      const space = spaces.get(spaceId);
      if (space) {
        space.quests = (space.quests || 0) + 1;
        spaces.set(spaceId, space);
      }

      sendJson(response, 201, quest);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid quest creation payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname.match(/^\/api\/quests\/[^/]+$/)
  ) {
    try {
      const questId = url.pathname.split("/").pop() ?? "";
      const quest = quests.get(questId);
      if (!quest) {
        sendJson(response, 404, { error: "Quest not found" });
        return;
      }
      sendJson(response, 200, quest);
    } catch (error) {
      sendJson(response, 400, { error: "Invalid quest ID" });
    }
    return;
  }

  if (
    request.method === "PATCH" &&
    url.pathname.match(/^\/api\/quests\/[^/]+$/)
  ) {
    try {
      const questId = url.pathname.split("/").pop() ?? "";
      const quest = quests.get(questId);
      if (!quest) {
        sendJson(response, 404, { error: "Quest not found" });
        return;
      }

      const body = (await readJsonBody(request)) as QuestUpdateRequest;
      const now = new Date().toISOString();
      const updated = {
        ...quest,
        name: body.name ?? quest.name,
        description: body.description ?? quest.description,
        type: body.type ? toQuestType(body.type) : quest.type,
        policyId: body.policyId !== undefined ? body.policyId : quest.policyId,
        reward: body.reward ?? quest.reward,
        active: body.active !== undefined ? body.active : quest.active,
        updatedAt: now,
      };

      quests.set(questId, updated);
      sendJson(response, 200, updated);
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid quest update payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "DELETE" &&
    url.pathname.match(/^\/api\/quests\/[^/]+$/)
  ) {
    try {
      const questId = url.pathname.split("/").pop() ?? "";
      const quest = quests.get(questId);
      if (!quest) {
        sendJson(response, 404, { error: "Quest not found" });
        return;
      }

      quests.delete(questId);

      // Update space quest count
      const space = spaces.get(quest.spaceId);
      if (space) {
        space.quests = Math.max(0, (space.quests || 1) - 1);
        spaces.set(quest.spaceId, space);
      }

      sendJson(response, 204, {});
    } catch (error) {
      sendJson(response, 400, { error: "Invalid quest ID" });
    }
    return;
  }

  sendJson(response, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`zk.ly mock AI API listening on http://127.0.0.1:${PORT}`);
});
