import "dotenv/config";
import { createServer } from "node:http";
import type {
  CommitmentRequest,
  EscalationDecisionRequest,
  EscalationRequest,
  QuestCreateRequest,
  QuestRecord,
  QuestTrack,
  QuestUpdateRequest,
  RewardMode,
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
import { getMidnightStatus } from "../services/midnightService.js";

const PORT = Number(process.env.PORT ?? 8787);

const VALID_QUEST_TYPES: QuestRecord["type"][] = [
  "blog",
  "github",
  "social",
  "onchain",
  "custom",
];

const VALID_QUEST_TRACKS: QuestTrack[] = [
  "builder",
  "educator",
  "advocate",
  "community-leadership",
];

const VALID_REWARD_MODES: RewardMode[] = ["xp-only", "escrow-auto"];

function toQuestType(value: string | undefined): QuestRecord["type"] {
  if (!value) return "custom";
  const normalized = value.trim().toLowerCase();
  return VALID_QUEST_TYPES.includes(normalized as QuestRecord["type"])
    ? (normalized as QuestRecord["type"])
    : "custom";
}

function toQuestTrack(value: string | undefined): QuestTrack {
  if (!value) return "builder";
  const normalized = value.trim().toLowerCase();
  return VALID_QUEST_TRACKS.includes(normalized as QuestTrack)
    ? (normalized as QuestTrack)
    : "builder";
}

function toRewardMode(value: string | undefined): RewardMode {
  if (!value) return "xp-only";
  const normalized = value.trim().toLowerCase();
  return VALID_REWARD_MODES.includes(normalized as RewardMode)
    ? (normalized as RewardMode)
    : "xp-only";
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  fallback: () => T,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      resolve(fallback());
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
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
    const midnightStatus = getMidnightStatus();
    sendJson(response, 200, {
      ok: true,
      service: "zk.ly mock ai api",
      spaces: spaces.size,
      reviews: reviews.size,
      commitments: commitments.size,
      escalations: escalations.size,
      reviewerPolicies: reviewerPolicies.size,
      mode: midnightStatus.enabled ? "midnight-backed" : "hybrid-fallback",
      midnight: midnightStatus,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/spaces") {
    const questCounts = new Map<string, number>();
    for (const quest of quests.values()) {
      questCounts.set(quest.spaceId, (questCounts.get(quest.spaceId) ?? 0) + 1);
    }

    sendJson(response, 200, {
      items: Array.from(spaces.values()).map((space) => ({
        ...space,
        quests: questCounts.get(space.id) ?? 0,
      })),
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
        quests: 0,
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
      const questId = body.questId?.trim();
      const quest = questId ? quests.get(questId) : undefined;

      if (questId && !quest) {
        sendJson(response, 404, { error: "Quest not found" });
        return;
      }

      const policy = quest?.policyId
        ? reviewerPolicies.get(quest.policyId)
        : undefined;

      const review = await createReview({
        ...body,
        threshold: policy?.scoreThreshold ?? 70,
        policyId: quest?.policyId,
        track: quest?.track,
      });
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
      const body = (await readJsonBody(request)) as CommitmentRequest & {
        onChainCertId?: string;
        onChainCommitmentHash?: string;
        onChainReviewCommitmentHash?: string;
        onChainTxId?: string;
        onChainMode?: "midnight" | "mock" | "wallet-popup";
        chainNote?: string;
      };
      if (!body.reviewId) {
        sendJson(response, 400, { error: "reviewId is required" });
        return;
      }

      const review = reviews.get(body.reviewId);
      if (!review) {
        sendJson(response, 404, { error: "Review not found" });
        return;
      }

      const quest = quests.get(review.questId);
      const baseCommitment = createCommitment(review, body);

      const walletApprovalSignature = body.walletApprovalSignature?.trim();
      const walletApprovalData = body.walletApprovalData?.trim();
      const walletApprovalVerifyingKey = body.walletApprovalVerifyingKey?.trim();

      // Use on-chain data provided by the DApp connector if present
      const onChainCertId = body.onChainCertId?.trim();
      const onChainCommitmentHash = body.onChainCommitmentHash?.trim();
      const onChainReviewCommitmentHash = body.onChainReviewCommitmentHash?.trim();
      const onChainTxId = body.onChainTxId?.trim();

      // Prefer the chainNote from the DApp connector; fall back to generic messages
      const chainNote =
        body.chainNote?.trim() ??
        (onChainCertId
          ? `Completion intent authorized via Midnight DApp connector. Cert: ${onChainCertId.slice(0, 12)}…`
          : walletApprovalSignature
            ? "Wallet popup approval captured; backend no longer submits contract transactions."
            : quest
              ? "Wallet popup approval is required before recording authorization."
              : "Quest metadata not found for this review, so only local commitment data is available.");

      const commitment = {
        ...baseCommitment,
        ...(walletApprovalSignature
          ? {
              status: "authorized" as const,
              walletApprovalSignature,
              walletApprovalData,
              walletApprovalVerifyingKey,
            }
          : {}),
        // Store DApp connector on-chain fields
        ...(onChainCertId ? { onChainCertificateId: onChainCertId } : {}),
        ...(onChainCommitmentHash
          ? { onChainCommitmentCommitmentHash: onChainCommitmentHash }
          : {}),
        ...(onChainReviewCommitmentHash
          ? { onChainReviewCommitmentHash }
          : {}),
        ...(onChainTxId ? { onChainTxId } : {}),
        proofMode: onChainCertId ? ("midnight" as const) : ("mock" as const),
      };

      commitments.set(commitment.commitmentId, commitment);
      sendJson(response, 200, {
        ...commitment,
        review,
        disclosure: toDisclosureRecord(review, commitment),
        chainNote,
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
      const body = (await readJsonBody(request)) as QuestCreateRequest & {
        onChainQuestId?: string;
        onChainTxId?: string;
        onChainMode?: "midnight" | "mock" | "wallet-popup";
        onChainReason?: string;
      };
      const spaceId = body.spaceId?.trim();
      const name = body.name?.trim();
      const description = body.description?.trim();
      const type = toQuestType(body.type);
      const track = toQuestTrack(body.track);
      const reward = body.reward ?? 100;
      const rewardMode = toRewardMode(body.rewardMode);
      const publishOnChain = body.publishOnChain === true;
      const escrowContractAddress = body.escrowContractAddress?.trim();
      const escrowAmount = Number(body.escrowAmount ?? 0);
      const criteriaJson = body.criteriaJson ?? {
        description,
        evidenceClass: type,
      };

      if (!spaceId || !name || !description) {
        sendJson(response, 400, {
          error: "spaceId, name, and description are required",
        });
        return;
      }

      if (rewardMode === "escrow-auto") {
        if (!escrowContractAddress) {
          sendJson(response, 400, {
            error:
              "escrowContractAddress is required when rewardMode is escrow-auto",
          });
          return;
        }

        if (!Number.isFinite(escrowAmount) || escrowAmount <= 0) {
          sendJson(response, 400, {
            error:
              "escrowAmount must be greater than 0 when rewardMode is escrow-auto",
          });
          return;
        }
      }

      // Auto-create space record if not found (supports dynamic spaces created in-session
      // and survives server restarts where in-memory state was lost).
      if (!spaces.has(spaceId)) {
        const autoSpace: SpaceRecord = {
          id: spaceId,
          name: spaceId,
          desc: `Auto-created space for ${spaceId}`,
          members: 1,
          quests: 0,
          createdAt: new Date().toISOString(),
          creatorWallet: body.creatorWallet?.trim() || undefined,
        };
        spaces.set(spaceId, autoSpace);
        console.warn(
          `[quests] Space '${spaceId}' not found in store — auto-created stub record.`,
        );
      }

      const now = new Date().toISOString();
      const questId = createId("quest");

      // Use on-chain data from DApp connector if provided, otherwise record as pending.
      const providedOnChainQuestId = body.onChainQuestId?.trim();
      const providedOnChainTxId = body.onChainTxId?.trim();
      const providedOnChainMode = body.onChainMode ?? "mock";
      const providedOnChainReason =
        body.onChainReason ??
        (publishOnChain
          ? "On-chain publish requested. Awaiting wallet popup approval."
          : "Not published on-chain yet. Use the Publish action from quest list.");

      const quest = {
        id: questId,
        spaceId,
        name,
        description,
        type,
        track,
        policyId: body.policyId,
        reward,
        rewardMode,
        escrowContractAddress,
        escrowAmount: rewardMode === "escrow-auto" ? escrowAmount : undefined,
        criteriaJson,
        onChainQuestId: providedOnChainQuestId,
        onChainCriteriaCommitment: undefined,
        onChainTxId: providedOnChainTxId,
        onChainMode: providedOnChainMode as "midnight" | "mock" | "wallet-popup",
        onChainReason: providedOnChainReason,
        walletApprovalSignature: undefined,
        walletApprovalData: undefined,
        walletApprovalVerifyingKey: undefined,
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

      sendJson(response, 200, { ...quest });
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid quest creation payload",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
    return;
  }

  if (
    request.method === "POST" &&
    url.pathname.match(/^\/api\/quests\/[^/]+\/publish$/)
  ) {
    try {
      const questId = url.pathname.split("/")[3] ?? "";
      const quest = quests.get(questId);
      if (!quest) {
        sendJson(response, 404, { error: "Quest not found" });
        return;
      }

      const body = (await readJsonBody(request)) as {
        walletAddress?: string;
        walletApprovalSignature?: string;
        walletApprovalData?: string;
        walletApprovalVerifyingKey?: string;
      };

      const walletAddress = body.walletAddress?.trim();
      const walletApprovalSignature = body.walletApprovalSignature?.trim();
      const walletApprovalData = body.walletApprovalData?.trim();
      const walletApprovalVerifyingKey =
        body.walletApprovalVerifyingKey?.trim();

      if (!walletAddress || !walletApprovalSignature) {
        sendJson(response, 400, {
          error:
            "walletAddress and walletApprovalSignature are required for wallet-popup publishing",
        });
        return;
      }

      const updated = {
        ...quest,
        onChainMode: "wallet-popup" as const,
        onChainReason:
          "Wallet popup approved. Backend recorded intent and authorization; transaction submission now runs from the DApp connector flow.",
        walletApprovalSignature,
        walletApprovalData,
        walletApprovalVerifyingKey,
        creatorWallet: walletAddress,
        updatedAt: new Date().toISOString(),
      };

      quests.set(questId, updated);
      sendJson(response, 200, updated);
    } catch (error) {
      sendJson(response, 400, {
        error: "Failed to publish quest on-chain",
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
      const nextRewardMode = body.rewardMode
        ? toRewardMode(body.rewardMode)
        : quest.rewardMode;

      const updated = {
        ...quest,
        name: body.name ?? quest.name,
        description: body.description ?? quest.description,
        type: body.type ? toQuestType(body.type) : quest.type,
        track: body.track ? toQuestTrack(body.track) : quest.track,
        policyId: body.policyId !== undefined ? body.policyId : quest.policyId,
        reward: body.reward ?? quest.reward,
        rewardMode: nextRewardMode,
        escrowContractAddress:
          body.escrowContractAddress !== undefined
            ? body.escrowContractAddress
            : quest.escrowContractAddress,
        escrowAmount:
          body.escrowAmount !== undefined
            ? Number(body.escrowAmount)
            : quest.escrowAmount,
        criteriaJson: body.criteriaJson ?? quest.criteriaJson,
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

  if (request.method === "GET" && url.pathname === "/api/leaderboard") {
    const rows = new Map<
      string,
      {
        wallet: string;
        questCount: number;
        xpPublic: number;
        spaces: Set<string>;
      }
    >();

    for (const commitment of commitments.values()) {
      const review = reviews.get(commitment.reviewId);
      if (!review) continue;

      const quest = quests.get(review.questId);
      const current = rows.get(commitment.walletAddress) ?? {
        wallet: commitment.walletAddress,
        questCount: 0,
        xpPublic: 0,
        spaces: new Set<string>(),
      };

      current.questCount += 1;
      current.xpPublic += quest?.reward ?? 0;
      current.spaces.add(review.spaceId);
      rows.set(commitment.walletAddress, current);
    }

    const sorted = Array.from(rows.values())
      .sort((a, b) => b.xpPublic - a.xpPublic || b.questCount - a.questCount)
      .map((item, index) => {
        const tier =
          item.xpPublic >= 50000
            ? "LEGEND"
            : item.xpPublic >= 15000
              ? "ARCHITECT"
              : item.xpPublic >= 5000
                ? "BUILDER"
                : item.xpPublic >= 1000
                  ? "CONTRIBUTOR"
                  : "NEWCOMER";

        return {
          rank: index + 1,
          wallet: item.wallet,
          tier,
          quests: item.questCount,
          spaces: item.spaces.size,
          xpPublic: item.xpPublic,
        };
      });

    sendJson(response, 200, { items: sorted });
    return;
  }

  if (
    request.method === "GET" &&
    url.pathname.match(/^\/api\/profile\/[^/]+$/)
  ) {
    const wallet = decodeURIComponent(url.pathname.split("/").pop() ?? "");
    const relatedCommitments = Array.from(commitments.values()).filter(
      (commitment) => commitment.walletAddress === wallet,
    );

    const spacesSet = new Set<string>();
    let xpPublic = 0;

    for (const commitment of relatedCommitments) {
      const review = reviews.get(commitment.reviewId);
      if (!review) continue;

      const quest = quests.get(review.questId);
      xpPublic += quest?.reward ?? 0;
      spacesSet.add(review.spaceId);
    }

    const tier =
      xpPublic >= 50000
        ? "LEGEND"
        : xpPublic >= 15000
          ? "ARCHITECT"
          : xpPublic >= 5000
            ? "BUILDER"
            : xpPublic >= 1000
              ? "CONTRIBUTOR"
              : "NEWCOMER";

    sendJson(response, 200, {
      wallet,
      tier,
      verifiedQuests: relatedCommitments.length,
      activeSpaces: spacesSet.size,
      xpPublic,
      memberSince: relatedCommitments[0]?.createdAt ?? new Date().toISOString(),
    });
    return;
  }

  sendJson(response, 404, { error: "Route not found" });
});

server.listen(PORT, () => {
  console.log(`zk.ly mock AI API listening on http://127.0.0.1:${PORT}`);
});
