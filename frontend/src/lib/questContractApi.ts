/**
 * questContractApi.ts
 *
 * Shared constants and types for quest/completion contract addresses.
 * Actual on-chain execution lives in midnightConnectorExecutor.ts — import
 * createQuestOnChain / commitCompletionOnChain from there.
 */

export const QUEST_REGISTRY_ADDRESS =
  "2adc5eb8746273a867292697d97f38bb3f183960081f062856c23f272de74187";

export const COMPLETION_REGISTRY_ADDRESS =
  "e9a7c61d713b77629344c2ed0390ae953396539668f9719f0e1404e2f8452120";

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
