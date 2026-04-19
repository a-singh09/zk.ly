import { randomUUID } from "node:crypto";
import type {
  CommitmentRecord,
  EscalationRecord,
  QuestRecord,
  ReviewerPolicyRecord,
  ReviewRecord,
  SpaceRecord,
} from "./models.js";

export const reviews = new Map<string, ReviewRecord>();
export const commitments = new Map<string, CommitmentRecord>();
export const escalations = new Map<string, EscalationRecord>();

export const spaces = new Map<string, SpaceRecord>([
  [
    "midnight",
    {
      id: "midnight",
      name: "Midnight Fellowship",
      desc: "Reference space for Midnight builders and educators.",
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
]);

const now = new Date().toISOString();

export const reviewerPolicies = new Map<string, ReviewerPolicyRecord>([
  [
    "policy_1",
    {
      id: "policy_1",
      agentId: "zkquest-builder-v1",
      model: "gpt-4.1-mini",
      category: "technical",
      scoreThreshold: 70,
      dimensions: {
        technicalDepth: 0.4,
        factualAccuracy: 0.3,
        clarity: 0.2,
        originality: 0.1,
      },
      maxTokens: 6000,
      timeoutMs: 12000,
      retryLimit: 1,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
  [
    "policy_2",
    {
      id: "policy_2",
      agentId: "zkquest-educator-v1",
      model: "claude-3-7-sonnet",
      category: "education",
      scoreThreshold: 68,
      dimensions: {
        pedagogy: 0.4,
        technicalDepth: 0.25,
        evidenceCoverage: 0.25,
        novelty: 0.1,
      },
      maxTokens: 9000,
      timeoutMs: 15000,
      retryLimit: 2,
      active: true,
      createdAt: now,
      updatedAt: now,
    },
  ],
]);

export const quests = new Map<string, QuestRecord>([
  [
    "quest_1",
    {
      id: "quest_1",
      spaceId: "midnight",
      name: "Write a Midnight ZK Tutorial",
      description:
        "Create an in-depth tutorial on Midnight's ZK proofs and selective disclosure.",
      type: "blog",
      policyId: "policy_2",
      reward: 500,
      creatorWallet: "admin",
      createdAt: now,
      updatedAt: now,
      active: true,
    },
  ],
  [
    "quest_2",
    {
      id: "quest_2",
      spaceId: "midnight",
      name: "Deploy a Compact Contract",
      description: "Deploy a working Compact contract to the Midnight testnet.",
      type: "onchain",
      policyId: undefined,
      reward: 750,
      creatorWallet: "admin",
      createdAt: now,
      updatedAt: now,
      active: true,
    },
  ],
]);

export function createId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}
