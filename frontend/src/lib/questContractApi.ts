/**
 * questContractApi.ts
 *
 * Shared constants and types for quest/completion contract addresses.
 * Actual on-chain execution lives in midnightConnectorExecutor.ts — import
 * createQuestOnChain / commitCompletionOnChain from there.
 */

export const QUEST_REGISTRY_ADDRESS =
  "5992b8434f52121c1e859f2545ddba089c0da253d1de9fe1d48a4c6261e05474";

export const COMPLETION_REGISTRY_ADDRESS =
  "dc42e5b98c61e815e59d18413c8ec25e67f103a652493684da3fe0a89d2d3bba";

export type QuestRewardMode = "XP_ONLY" | "ESCROW_AUTOMATIC";

export interface CreateQuestOnChainParams {
  connectedApi: import("@midnight-ntwrk/dapp-connector-api").ConnectedAPI | null;
  spaceId: string;
  sprintId: string;
  questType: string;
  trackTag: string;
  criteriaJson: Record<string, unknown>;
  freqSlots?: number;
  maxCompletions?: number;
  expiresAtSlot?: number;
  xpValue?: number;
  rewardMode?: QuestRewardMode;
  escrowContract?: string;
  escrowAmount?: number;
}

export interface CreateQuestOnChainResult {
  onChainQuestId: string;
  txId: string;
}

export interface CommitCompletionOnChainParams {
  connectedApi: import("@midnight-ntwrk/dapp-connector-api").ConnectedAPI | null;
  questId: string;
  sprintId: string;
  spaceId: string;
  reviewId: string;
  score: number;
  passed: boolean;
  scoreBand: 0 | 1 | 2 | 3;
  evidenceClass: string;
  xpValue: number;
  evidenceHash: string;
  walletAddress: string;
}

export interface CommitCompletionOnChainResult {
  certId: string;
  commitmentHash: string;
  reviewCommitmentHash: string;
  txId: string;
}
