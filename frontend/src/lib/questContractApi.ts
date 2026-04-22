/**
 * questContractApi.ts
 *
 * Handles blockchain interactions for the Quest Registry and Completion Registry
 * contracts via the Midnight DApp connector (Lace wallet).
 *
 * Contracts are already deployed on preprod:
 *   - quest-registry:    5992b8434f52121c1e859f2545ddba089c0da253d1de9fe1d48a4c6261e05474
 *   - completion-registry: dc42e5b98c61e815e59d18413c8ec25e67f103a652493684da3fe0a89d2d3bba
 *
 * Current frontend flow for create_quest / verify_completion:
 *   1. Build an authorization payload representing the intended circuit call.
 *   2. Ask the wallet to sign that payload through the DApp connector popup.
 *   3. Return derived identifiers so the backend can track pending intent state.
 *
 * This file does NOT yet build, prove, balance, and submit real Compact call
 * transactions in-browser. It only captures connector authorization metadata.
 *
 * NOTE: hintUsage() is called only if the wallet exposes it (optional in some
 * Lace builds). If it throws or is missing, we continue to signData() anyway.
 */

import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";

// ---------------------------------------------------------------------------
// Contract addresses (preprod)
// ---------------------------------------------------------------------------

export const QUEST_REGISTRY_ADDRESS =
  "5992b8434f52121c1e859f2545ddba089c0da253d1de9fe1d48a4c6261e05474";

export const COMPLETION_REGISTRY_ADDRESS =
  "dc42e5b98c61e815e59d18413c8ec25e67f103a652493684da3fe0a89d2d3bba";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type QuestRewardMode = "XP_ONLY" | "ESCROW_AUTOMATIC";

export interface CreateQuestOnChainParams {
  connectedApi: ConnectedAPI;
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
  connectedApi: ConnectedAPI;
  questId: string;
  sprintId: string;
  spaceId: string;
  reviewId: string;
  /** AI review score 0-100 */
  score: number;
  /** Whether the review passed the threshold */
  passed: boolean;
  /** Score band: 0=fail, 1=bronze, 2=silver, 3=gold */
  scoreBand: 0 | 1 | 2 | 3;
  /** Evidence class e.g. "AI_SCORE" */
  evidenceClass: string;
  /** XP to be awarded */
  xpValue: number;
  /** SHA-256 of the artifact (evidence hash) */
  evidenceHash: string;
  walletAddress: string;
}

export interface CommitCompletionOnChainResult {
  /** 32-byte hex cert ID derived from the verify_completion circuit output. */
  certId: string;
  /** Commitment hash (SHA-256 of intent payload). */
  commitmentHash: string;
  /** Review commitment hash. */
  reviewCommitmentHash: string;
  /** Signature from the wallet authorization popup. */
  walletSignature: string;
  walletVerifyingKey: string;
  walletData: string;
  txId: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const textEncoder = new TextEncoder();

function padToBytes(str: string, size: number): Uint8Array {
  const encoded = textEncoder.encode(str.slice(0, size));
  const result = new Uint8Array(size);
  result.set(encoded);
  return result;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(input: string): Promise<string> {
  const buffer = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(input),
  );
  return bytesToHex(new Uint8Array(buffer));
}

function timestampHex(): string {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, BigInt(Date.now()), true);
  return bytesToHex(buf);
}

/**
 * Optionally call hintUsage() if the wallet exposes it.
 * Some Lace builds don't implement it — this must never block signData().
 */
async function tryHintUsage(
  api: ConnectedAPI,
  methods: Array<keyof ConnectedAPI>,
): Promise<void> {
  if (typeof api.hintUsage === "function") {
    try {
      await api.hintUsage(methods as Array<keyof import("@midnight-ntwrk/dapp-connector-api").WalletConnectedAPI>);
    } catch {
      // non-fatal — older Lace versions may not implement hintUsage
    }
  }
}

function normalizeConnectorError(error: unknown): Error {
  if (error instanceof Error) {
    if (/Method not implemented/i.test(error.message)) {
      return new Error(
        "Your current Midnight wallet build does not implement this connector signing method yet. The app can still save local state, but real connector-backed contract execution needs a wallet/API build with signData support.",
      );
    }
    return error;
  }

  return new Error(String(error));
}

// ---------------------------------------------------------------------------
// create_quest  — Quest Registry contract
// ---------------------------------------------------------------------------

/**
 * Submit a create_quest intent via the DApp connector.
 * Wallet signs the structured intent and we derive an on-chain quest ID
 * client-side as a commitment hash consistent with the contract's logic.
 */
export async function createQuestOnChain(
  params: CreateQuestOnChainParams,
): Promise<CreateQuestOnChainResult> {
  const {
    connectedApi,
    spaceId,
    sprintId,
    questType,
    trackTag,
    criteriaJson,
    freqSlots = 0,
    maxCompletions = 0,
    expiresAtSlot = 0,
    xpValue = 100,
    rewardMode = "XP_ONLY",
    escrowContract = "",
    escrowAmount = 0,
  } = params;

  const tsHex = timestampHex();
  const criteriaStr = JSON.stringify(criteriaJson);
  const rewardModeIndex = rewardMode === "ESCROW_AUTOMATIC" ? 1 : 0;

  const intentPayload = JSON.stringify({
    action: "create-quest",
    contractAddress: QUEST_REGISTRY_ADDRESS,
    spaceId,
    sprintId,
    questType: questType.slice(0, 8),
    trackTag: trackTag.slice(0, 8),
    criteria: criteriaJson,
    freqSlots,
    maxCompletions,
    expiresAtSlot,
    xpValue,
    rewardMode: rewardModeIndex,
    escrowContract,
    escrowAmount,
    timestamp: tsHex,
    issuedAt: new Date().toISOString(),
  });

  // Derive quest ID = SHA-256(criteria_bytes | timestamp | space_id)
  // mirrors persistentHash logic in the Compact circuit
  const criteriaBytes = padToBytes(criteriaStr, 256);
  const onChainQuestId = await sha256(
    [bytesToHex(criteriaBytes), tsHex, spaceId].join(":"),
  );

  await tryHintUsage(connectedApi, ["signData"]);

  let signature;
  try {
    signature = await connectedApi.signData(intentPayload, {
      encoding: "text",
      keyType: "unshielded",
    });
  } catch (error) {
    throw normalizeConnectorError(error);
  }

  const txId = await sha256(signature.signature);

  console.info("[quest-contract] create_quest intent signed via DApp connector", {
    onChainQuestId,
    txId: txId.slice(0, 16) + "…",
    contractAddress: QUEST_REGISTRY_ADDRESS,
  });

  return { onChainQuestId, txId };
}

// ---------------------------------------------------------------------------
// verify_completion  — Completion Registry contract
// ---------------------------------------------------------------------------

/**
 * Submit a verify_completion intent via the DApp connector.
 *
 * This corresponds to the verify_completion() circuit in completion-registry.compact.
 * The wallet signs the intent (DApp connector popup), which authorizes the
 * commitment. The cert_id is derived client-side matching the circuit's
 * persistentHash logic.
 */
export async function commitCompletionOnChain(
  params: CommitCompletionOnChainParams,
): Promise<CommitCompletionOnChainResult> {
  const {
    connectedApi,
    questId,
    sprintId,
    spaceId,
    reviewId,
    score,
    passed,
    scoreBand,
    evidenceClass,
    xpValue,
    evidenceHash,
    walletAddress,
  } = params;

  const tsHex = timestampHex();
  const evidenceClassPadded = bytesToHex(padToBytes(evidenceClass.slice(0, 8), 8));

  // Build the review_payload and commitment_payload (256-byte witnesses)
  const reviewPayload = JSON.stringify({
    reviewId,
    questId,
    score,
    passed,
    scoreBand,
    evidenceHash,
    evidenceClass,
    issuedAt: new Date().toISOString(),
  });
  const commitmentPayload = JSON.stringify({
    questId,
    sprintId,
    spaceId,
    walletAddress,
    xpValue,
    timestamp: tsHex,
  });

  const reviewPayloadBytes = padToBytes(reviewPayload, 256);
  const commitmentPayloadBytes = padToBytes(commitmentPayload, 256);

  // Derive commitment hashes (matches persistentHash<Bytes<256>> in the circuit)
  const reviewCommitmentHash = await sha256(bytesToHex(reviewPayloadBytes));
  const commitmentCommitmentHash = await sha256(
    bytesToHex(commitmentPayloadBytes),
  );

  // Derive the completer_key = SHA-256("zkquest:completer:" + walletAddress)
  const completerKey = await sha256(`zkquest:completer:${walletAddress}`);

  // Derive cert_id = SHA-256(quest_id | completer_key | commitment_commitment)
  // mirrors: persistentHash<Vector<3, Bytes<32>>>([quest_id, completer_key, commitment_commitment])
  const questIdBytes = padToBytes(questId, 32);
  const certId = await sha256(
    [bytesToHex(questIdBytes), completerKey, commitmentCommitmentHash].join(":"),
  );

  // Derive commitment_hash (the ID used by the backend)
  const commitmentHash = await sha256(
    [certId, reviewCommitmentHash, tsHex].join(":"),
  );

  // Build the intent payload that the wallet will sign
  const intentPayload = JSON.stringify({
    action: "verify-completion",
    contractAddress: COMPLETION_REGISTRY_ADDRESS,
    questId,
    sprintId,
    spaceId,
    reviewId,
    score,
    passed,
    scoreBand,
    evidenceClass: evidenceClassPadded,
    xpValue,
    evidenceHash,
    reviewCommitmentHash,
    commitmentCommitmentHash,
    certId,
    walletAddress,
    timestamp: tsHex,
    issuedAt: new Date().toISOString(),
  });

  await tryHintUsage(connectedApi, ["signData"]);

  let signature;
  try {
    signature = await connectedApi.signData(intentPayload, {
      encoding: "text",
      keyType: "unshielded",
    });
  } catch (error) {
    throw normalizeConnectorError(error);
  }

  const txId = await sha256(signature.signature);

  console.info("[completion-contract] verify_completion intent signed via DApp connector", {
    certId: certId.slice(0, 16) + "…",
    commitmentHash: commitmentHash.slice(0, 16) + "…",
    txId: txId.slice(0, 16) + "…",
    contractAddress: COMPLETION_REGISTRY_ADDRESS,
  });

  return {
    certId,
    commitmentHash,
    reviewCommitmentHash,
    walletSignature: signature.signature,
    walletVerifyingKey: signature.verifyingKey,
    walletData: signature.data,
    txId,
  };
}
