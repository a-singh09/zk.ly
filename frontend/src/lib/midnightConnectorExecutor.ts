import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { Buffer } from "buffer";
import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { submitCallTxAsync } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { ChargedState, StateValue } from "@midnight-ntwrk/compact-runtime";
import {
  ZKConfigProvider,
  createProofProvider,
  createProverKey,
  createVerifierKey,
  createZKIR,
  type ProverKey,
  type VerifierKey,
  type ZKIR,
} from "@midnight-ntwrk/midnight-js-types";
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from "@midnight-ntwrk/ledger-v8";
import * as CompletionRegistry from "../../../contracts/contracts/managed/completion-registry/contract/index.js";
import * as RewardEscrow from "../../../contracts/contracts/managed/reward-escrow/contract/index.js";
import * as QuestRegistry from "../../../contracts/contracts/managed/quest-registry/contract/index.js";
import approveCompletionProverUrl from "../../../contracts/contracts/managed/completion-registry/keys/approve_completion.prover?url";
import approveCompletionVerifierUrl from "../../../contracts/contracts/managed/completion-registry/keys/approve_completion.verifier?url";
import approveCompletionZkirUrl from "../../../contracts/contracts/managed/completion-registry/zkir/approve_completion.bzkir?url";
import rejectCompletionProverUrl from "../../../contracts/contracts/managed/completion-registry/keys/reject_completion.prover?url";
import rejectCompletionVerifierUrl from "../../../contracts/contracts/managed/completion-registry/keys/reject_completion.verifier?url";
import rejectCompletionZkirUrl from "../../../contracts/contracts/managed/completion-registry/zkir/reject_completion.bzkir?url";
import markRewardClaimedProverUrl from "../../../contracts/contracts/managed/completion-registry/keys/mark_reward_claimed.prover?url";
import markRewardClaimedVerifierUrl from "../../../contracts/contracts/managed/completion-registry/keys/mark_reward_claimed.verifier?url";
import markRewardClaimedZkirUrl from "../../../contracts/contracts/managed/completion-registry/zkir/mark_reward_claimed.bzkir?url";
import approveRewardProverUrl from "../../../contracts/contracts/managed/reward-escrow/keys/approve_reward.prover?url";
import approveRewardVerifierUrl from "../../../contracts/contracts/managed/reward-escrow/keys/approve_reward.verifier?url";
import approveRewardZkirUrl from "../../../contracts/contracts/managed/reward-escrow/zkir/approve_reward.bzkir?url";
import rejectRewardProverUrl from "../../../contracts/contracts/managed/reward-escrow/keys/reject_reward.prover?url";
import rejectRewardVerifierUrl from "../../../contracts/contracts/managed/reward-escrow/keys/reject_reward.verifier?url";
import rejectRewardZkirUrl from "../../../contracts/contracts/managed/reward-escrow/zkir/reject_reward.bzkir?url";
import claimRewardProverUrl from "../../../contracts/contracts/managed/reward-escrow/keys/claim_reward.prover?url";
import claimRewardVerifierUrl from "../../../contracts/contracts/managed/reward-escrow/keys/claim_reward.verifier?url";
import claimRewardZkirUrl from "../../../contracts/contracts/managed/reward-escrow/zkir/claim_reward.bzkir?url";
import createQuestProverUrl from "../../../contracts/contracts/managed/quest-registry/keys/create_quest.prover?url";
import createQuestVerifierUrl from "../../../contracts/contracts/managed/quest-registry/keys/create_quest.verifier?url";
import createQuestZkirUrl from "../../../contracts/contracts/managed/quest-registry/zkir/create_quest.bzkir?url";
import incrementCompletionProverUrl from "../../../contracts/contracts/managed/quest-registry/keys/increment_completion.prover?url";
import incrementCompletionVerifierUrl from "../../../contracts/contracts/managed/quest-registry/keys/increment_completion.verifier?url";
import incrementCompletionZkirUrl from "../../../contracts/contracts/managed/quest-registry/zkir/increment_completion.bzkir?url";
import verifyCompletionProverUrl from "../../../contracts/contracts/managed/completion-registry/keys/verify_completion.prover?url";
import verifyCompletionVerifierUrl from "../../../contracts/contracts/managed/completion-registry/keys/verify_completion.verifier?url";
import verifyCompletionZkirUrl from "../../../contracts/contracts/managed/completion-registry/zkir/verify_completion.bzkir?url";
import type { CommitmentResponse } from "./api";
import {
  COMPLETION_REGISTRY_ADDRESS,
  QUEST_REGISTRY_ADDRESS,
  type CreateQuestOnChainParams,
  type CreateQuestOnChainResult,
  type CommitCompletionOnChainParams,
  type CommitCompletionOnChainResult,
} from "./questContractApi";

setNetworkId("preprod");

// Some Midnight/ledger deps still expect Node's Buffer global.
if (typeof (globalThis as unknown as { Buffer?: unknown }).Buffer === "undefined") {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}

const COMPLETION_ASSET_PATH = "completion-registry/browser";
const REWARD_ESCROW_ASSET_PATH = "reward-escrow/browser";
const ZERO_8 = new Uint8Array(8);
const ZERO_32 = new Uint8Array(32);
const ZERO_256 = new Uint8Array(256);
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
// Balancing/proving can take a while (and some wallet builds are slow to respond),
// so we keep this generous to avoid false timeouts after the user already approved.
const WALLET_TX_TIMEOUT_MS = 5 * 60_000;
const CONNECTOR_API_TIMEOUT_MS = 30_000;
const LOCAL_PROOF_SERVER_URL = "http://127.0.0.1:6300";
const API_BASE_URL = import.meta.env.VITE_ZKLY_API_URL ?? "http://127.0.0.1:8787";

function formatUnknownError(error: unknown, depth = 0): string {
  if (depth > 4) {
    return "[max depth reached]";
  }

  const tryDecodeTxData = (value: unknown): string | null => {
    if (!value || typeof value !== "object") {
      return null;
    }

    // Effect-style error payloads may include txData as an object with numeric keys.
    const txData = (value as { txData?: unknown }).txData;
    if (!txData || typeof txData !== "object") {
      return null;
    }

    const entries = Object.entries(txData as Record<string, unknown>)
      .map(([key, v]) => [Number(key), v] as const)
      .filter(([key, v]) => Number.isInteger(key) && typeof v === "number")
      .sort(([a], [b]) => a - b);

    if (entries.length === 0) {
      return null;
    }

    const bytes = new Uint8Array(entries.length);
    for (let i = 0; i < entries.length; i++) {
      bytes[i] = entries[i]?.[1] as number;
    }

    // txData is usually ASCII-ish; decode for better diagnostics.
    return textDecoder.decode(bytes);
  };

  if (error instanceof Error) {
    const anyError = error as Error & { cause?: unknown };
    const parts = [
      `${error.name}: ${error.message}`,
      anyError.cause ? `cause: ${formatUnknownError(anyError.cause, depth + 1)}` : null,
    ].filter(Boolean);
    return parts.join(" | ");
  }

  // Some libraries attach rich error payloads directly as objects or JSON strings.
  if (typeof error === "string") {
    const trimmed = error.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed) as unknown;
        const decoded = tryDecodeTxData(parsed);
        return decoded ? `${trimmed} | decodedTxData: ${decoded}` : trimmed;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }

  try {
    const decoded = tryDecodeTxData(error);
    const json = JSON.stringify(error);
    return decoded ? `${json} | decodedTxData: ${decoded}` : json;
  } catch {
    return String(error);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = window.setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
  }
}

type CompletionCircuitId =
  | "approve_completion"
  | "reject_completion"
  | "mark_reward_claimed"
  | "verify_completion";

type RewardEscrowCircuitId =
  | "approve_reward"
  | "reject_reward"
  | "claim_reward";

type QuestCircuitId = "create_quest" | "increment_completion";

type CircuitAssetMap<K extends string> = Record<
  K,
  {
    prover: string;
    verifier: string;
    zkir: string;
  }
>;

interface BrowserProviders {
  privateStateProvider: InMemoryPrivateStateProvider;
  publicDataProvider: ReturnType<typeof indexerPublicDataProvider>;
  zkConfigProvider: BrowserZkConfigProvider<string>;
  proofProvider: ReturnType<typeof createProofProvider>;
  walletProvider: {
    getCoinPublicKey(): string;
    getEncryptionPublicKey(): string;
    balanceTx(tx: unknown, ttl?: Date): Promise<FinalizedTransaction>;
  };
  midnightProvider: {
    submitTx(tx: FinalizedTransaction): Promise<TransactionId>;
  };
}

interface CompletionPrivateState {
  userSecretKey: Uint8Array;
  adminSecretKey: Uint8Array;
  evidenceHash: Uint8Array;
  evidenceClassRaw: Uint8Array;
  verificationScore: bigint;
  criteriaBytes: Uint8Array;
  requiredEvidenceClass: Uint8Array;
  minScoreThreshold: bigint;
  freqSlotsRequired: bigint;
  lastCompletionSlot: bigint;
  currentSlot: bigint;
  reviewPayload: Uint8Array;
  commitmentPayload: Uint8Array;
  passedFlag: boolean;
  scoreBand: bigint;
}

interface RewardEscrowPrivateState {
  adminSecretKey: Uint8Array;
  userSecretKey: Uint8Array;
}

interface AdminRewardDecisionResult {
  completionDecisionTxId: string;
  escrowDecisionTxId?: string;
}

interface RewardClaimResult {
  escrowClaimTxId: string;
  completionClaimTxId: string;
}

class BrowserZkConfigProvider<K extends string> extends ZKConfigProvider<K> {
  private readonly assets: CircuitAssetMap<K>;

  constructor(assets: CircuitAssetMap<K>) {
    super();
    this.assets = assets;
  }

  async getProverKey(circuitId: K): Promise<ProverKey> {
    return fetchBinary(this.assets[circuitId]?.prover, `Missing prover key for ${circuitId}`).then(
      createProverKey,
    );
  }

  async getVerifierKey(circuitId: K): Promise<VerifierKey> {
    return fetchBinary(
      this.assets[circuitId]?.verifier,
      `Missing verifier key for ${circuitId}`,
    ).then(createVerifierKey);
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    return fetchBinary(this.assets[circuitId]?.zkir, `Missing zkIR for ${circuitId}`).then(
      createZKIR,
    );
  }
}

class InMemoryPrivateStateProvider {
  private readonly states = new Map<string, unknown>();
  private readonly signingKeys = new Map<string, unknown>();
  private contractScope = "global";

  setContractAddress(address: { bytes?: Uint8Array } | string): void {
    this.contractScope = typeof address === "string" ? address : bytesToHex(address.bytes ?? ZERO_32);
  }

  async set(privateStateId: string, state: unknown): Promise<void> {
    this.states.set(this.scopedKey(privateStateId), state);
  }

  async get(privateStateId: string): Promise<unknown | null> {
    return this.states.get(this.scopedKey(privateStateId)) ?? null;
  }

  async remove(privateStateId: string): Promise<void> {
    this.states.delete(this.scopedKey(privateStateId));
  }

  async clear(): Promise<void> {
    this.states.clear();
  }

  async setSigningKey(address: string, signingKey: unknown): Promise<void> {
    this.signingKeys.set(address, signingKey);
  }

  async getSigningKey(address: string): Promise<unknown | null> {
    return this.signingKeys.get(address) ?? null;
  }

  async removeSigningKey(address: string): Promise<void> {
    this.signingKeys.delete(address);
  }

  async clearSigningKeys(): Promise<void> {
    this.signingKeys.clear();
  }

  async exportPrivateStates(): Promise<never> {
    throw new Error("Private state export is not supported in the browser demo provider.");
  }

  async importPrivateStates(): Promise<never> {
    throw new Error("Private state import is not supported in the browser demo provider.");
  }

  async exportSigningKeys(): Promise<never> {
    throw new Error("Signing key export is not supported in the browser demo provider.");
  }

  async importSigningKeys(): Promise<never> {
    throw new Error("Signing key import is not supported in the browser demo provider.");
  }

  private scopedKey(privateStateId: string) {
    return `${this.contractScope}:${privateStateId}`;
  }
}

const completionAssets: CircuitAssetMap<CompletionCircuitId> = {
  approve_completion: {
    prover: approveCompletionProverUrl,
    verifier: approveCompletionVerifierUrl,
    zkir: approveCompletionZkirUrl,
  },
  reject_completion: {
    prover: rejectCompletionProverUrl,
    verifier: rejectCompletionVerifierUrl,
    zkir: rejectCompletionZkirUrl,
  },
  mark_reward_claimed: {
    prover: markRewardClaimedProverUrl,
    verifier: markRewardClaimedVerifierUrl,
    zkir: markRewardClaimedZkirUrl,
  },
  verify_completion: {
    prover: verifyCompletionProverUrl,
    verifier: verifyCompletionVerifierUrl,
    zkir: verifyCompletionZkirUrl,
  },
};

const rewardEscrowAssets: CircuitAssetMap<RewardEscrowCircuitId> = {
  approve_reward: {
    prover: approveRewardProverUrl,
    verifier: approveRewardVerifierUrl,
    zkir: approveRewardZkirUrl,
  },
  reject_reward: {
    prover: rejectRewardProverUrl,
    verifier: rejectRewardVerifierUrl,
    zkir: rejectRewardZkirUrl,
  },
  claim_reward: {
    prover: claimRewardProverUrl,
    verifier: claimRewardVerifierUrl,
    zkir: claimRewardZkirUrl,
  },
};

const questRegistryAssets: CircuitAssetMap<QuestCircuitId> = {
  create_quest: {
    prover: createQuestProverUrl,
    verifier: createQuestVerifierUrl,
    zkir: createQuestZkirUrl,
  },
  increment_completion: {
    prover: incrementCompletionProverUrl,
    verifier: incrementCompletionVerifierUrl,
    zkir: incrementCompletionZkirUrl,
  },
};

const completionCompiledContract = CompiledContract.make(
  "completion-registry",
  CompletionRegistry.Contract,
).pipe(
  CompiledContract.withWitnesses({
    get_user_secret_key: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.userSecretKey,
    ],
    get_admin_secret_key: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.adminSecretKey,
    ],
    get_evidence_hash: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.evidenceHash,
    ],
    get_evidence_class_raw: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.evidenceClassRaw,
    ],
    get_verification_score: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.verificationScore,
    ],
    get_criteria_bytes: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.criteriaBytes,
    ],
    get_req_evidence_class: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.requiredEvidenceClass,
    ],
    get_min_score_threshold: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.minScoreThreshold,
    ],
    get_freq_slots_required: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.freqSlotsRequired,
    ],
    get_last_completion_slot: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.lastCompletionSlot,
    ],
    get_current_slot: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.currentSlot,
    ],
    get_review_payload: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.reviewPayload,
    ],
    get_commitment_payload: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.commitmentPayload,
    ],
    get_passed_flag: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.passedFlag,
    ],
    get_score_band: (context: { privateState: CompletionPrivateState }) => [
      context.privateState,
      context.privateState.scoreBand,
    ],
  } as never),
  CompiledContract.withCompiledFileAssets(COMPLETION_ASSET_PATH),
);

const rewardEscrowCompiledContract = CompiledContract.make(
  "reward-escrow",
  RewardEscrow.Contract,
).pipe(
  CompiledContract.withWitnesses({
    get_admin_secret_key: (context: { privateState: RewardEscrowPrivateState }) => [
      context.privateState,
      context.privateState.adminSecretKey,
    ],
    get_user_secret_key: (context: { privateState: RewardEscrowPrivateState }) => [
      context.privateState,
      context.privateState.userSecretKey,
    ],
  } as never),
  CompiledContract.withCompiledFileAssets(REWARD_ESCROW_ASSET_PATH),
);

// questRegistryCompiledContract is created lazily inside createQuestOnChain
// to avoid module-evaluation failures when QuestRegistry.Contract isn't ready.

function normalizeConnectorError(error: unknown): Error {
  if (error instanceof Error) {
    if (/Method not implemented/i.test(error.message)) {
      return new Error(
        "This Midnight wallet build is missing a required connector transaction method. Update the wallet/connector build before attempting on-chain reward actions.",
      );
    }
    return error;
  }

  return new Error(String(error));
}

async function fetchBinary(url: string | undefined, missingMessage: string) {
  if (!url) {
    throw new Error(missingMessage);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${missingMessage} (${response.status})`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function snapshotQuestRegistryLedger(publicDataProvider: {
  queryContractState(contractAddress: string): Promise<{ data: unknown } | null>;
}): Promise<Map<string, any>> {
  const state = await publicDataProvider.queryContractState(QUEST_REGISTRY_ADDRESS);
  if (!state) {
    return new Map();
  }

  const ledgerState = (QuestRegistry as unknown as { ledger(data: unknown): { quests: Map<Uint8Array, any> } })
    .ledger(state.data);
  const snapshot = new Map<string, any>();
  for (const [key, value] of ledgerState.quests) {
    snapshot.set(bytesToHex(key), value);
  }
  return snapshot;
}

async function findNewQuestLedgerEntry(params: {
  before: Map<string, any>;
  publicDataProvider: { queryContractState(contractAddress: string): Promise<{ data: unknown } | null> };
}): Promise<{ key: string; value: any } | null> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const after = await snapshotQuestRegistryLedger(params.publicDataProvider);
    for (const [key, value] of after.entries()) {
      if (!params.before.has(key)) {
        return { key, value };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  return null;
}

function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error(`Invalid hex length: ${normalized.length}`);
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let index = 0; index < normalized.length; index += 2) {
    bytes[index / 2] = Number.parseInt(normalized.slice(index, index + 2), 16);
  }
  return bytes;
}

function toBytes32FromText(value: string): Uint8Array {
  const encoded = textEncoder.encode(value.slice(0, 32));
  const result = new Uint8Array(32);
  result.set(encoded);
  return result;
}

function toBytes32FromHex(value: string | undefined): Uint8Array {
  if (!value) {
    return ZERO_32.slice();
  }

  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]+$/.test(normalized)) {
    return toBytes32FromText(value);
  }

  const decoded = fromHex(normalized);
  if (decoded.length === 32) {
    return decoded;
  }

  const padded = new Uint8Array(32);
  padded.set(decoded.slice(0, 32));
  return padded;
}

function isLikelyHexBytes32(value: string): boolean {
  const normalized = value.startsWith("0x") ? value.slice(2) : value;
  return normalized.length === 64 && /^[0-9a-fA-F]+$/.test(normalized);
}

async function tryGetQuestCriteriaCommitmentFromChain(params: {
  publicDataProvider: { queryContractState(contractAddress: string): Promise<{ data: unknown } | null> };
  onChainQuestId: string;
}): Promise<string | null> {
  const questIdHex = params.onChainQuestId.startsWith("0x")
    ? params.onChainQuestId.slice(2)
    : params.onChainQuestId;

  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      const state = await params.publicDataProvider.queryContractState(QUEST_REGISTRY_ADDRESS);
      if (!state) {
        return null;
      }

      const ledgerState = (QuestRegistry as unknown as { ledger(data: unknown): { quests: Map<Uint8Array, any> } })
        .ledger(state.data);

      // The ledger map key is bytes; compare by hex to avoid reference equality issues.
      for (const [key, value] of ledgerState.quests) {
        if (bytesToHex(key).toLowerCase() === questIdHex.toLowerCase()) {
          const criteriaCommitmentBytes = value?.criteria_commitment as Uint8Array | undefined;
          if (criteriaCommitmentBytes && criteriaCommitmentBytes.length > 0) {
            return bytesToHex(criteriaCommitmentBytes);
          }
          return null;
        }
      }
    } catch {
      // swallow and retry
    }

    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  return null;
}

function nowSlot(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function makeCompletionPrivateState(params: {
  adminSecretKey?: Uint8Array;
  userSecretKey?: Uint8Array;
  currentSlot?: bigint;
}): CompletionPrivateState {
  return {
    userSecretKey: params.userSecretKey ?? ZERO_32.slice(),
    adminSecretKey: params.adminSecretKey ?? ZERO_32.slice(),
    evidenceHash: ZERO_32.slice(),
    evidenceClassRaw: ZERO_8.slice(),
    verificationScore: 0n,
    criteriaBytes: ZERO_256.slice(),
    requiredEvidenceClass: ZERO_8.slice(),
    minScoreThreshold: 0n,
    freqSlotsRequired: 0n,
    lastCompletionSlot: 0n,
    currentSlot: params.currentSlot ?? nowSlot(),
    reviewPayload: ZERO_256.slice(),
    commitmentPayload: ZERO_256.slice(),
    passedFlag: false,
    scoreBand: 0n,
  };
}

function makeRewardEscrowPrivateState(params: {
  adminSecretKey?: Uint8Array;
  userSecretKey?: Uint8Array;
}): RewardEscrowPrivateState {
  return {
    adminSecretKey: params.adminSecretKey ?? ZERO_32.slice(),
    userSecretKey: params.userSecretKey ?? ZERO_32.slice(),
  };
}

function requireConnectedWallet(api: ConnectedAPI | null): ConnectedAPI {
  if (!api) {
    throw new Error("Connect a Midnight wallet before attempting on-chain reward actions.");
  }
  return api;
}

function requireQuest(commitment: CommitmentResponse) {
  if (!commitment.quest) {
    throw new Error("Quest metadata is missing from this commitment. Reload the page and try again.");
  }
  return commitment.quest;
}

function requireCertificateId(commitment: CommitmentResponse) {
  if (!commitment.onChainCertificateId) {
    throw new Error(
      "This completion does not have a real on-chain certificate ID yet. The submission path still needs to run the Midnight completion transaction before admin approval/claim can succeed.",
    );
  }
  return commitment.onChainCertificateId;
}

function requireQuestChainId(commitment: CommitmentResponse) {
  const quest = requireQuest(commitment);
  if (!quest.onChainQuestId) {
    throw new Error("This quest is missing its on-chain Midnight quest ID.");
  }
  return quest.onChainQuestId;
}

function requireEscrowAddress(commitment: CommitmentResponse) {
  const quest = requireQuest(commitment);
  if (!quest.escrowContractAddress) {
    throw new Error(
      "This quest is configured for escrow rewards, but no deployed reward-escrow contract address is attached to it yet.",
    );
  }
  return quest.escrowContractAddress;
}

async function createBrowserProviders(
  connectedApi: ConnectedAPI,
  zkConfigProvider: BrowserZkConfigProvider<string>,
): Promise<BrowserProviders> {
  // Hint usage early so the wallet can pre-authorize methods (some builds will
  // trigger permission UX here rather than during the first transaction call).
  try {
    const maybeHintUsage = (connectedApi as unknown as { hintUsage?: unknown }).hintUsage;
    if (typeof maybeHintUsage === "function") {
      await withTimeout(
        (maybeHintUsage as (methodNames: Array<string>) => Promise<void>)([
          "getConfiguration",
          "getShieldedAddresses",
          "balanceUnsealedTransaction",
          "submitTransaction",
          "getProvingProvider",
        ]),
        CONNECTOR_API_TIMEOUT_MS,
        "Wallet did not respond to permission hinting in time.",
      );
    }
  } catch (error) {
    // Non-fatal; proceed and let per-call timeouts surface actionable errors.
    console.warn("[midnight:hintUsage] wallet hint usage failed", error);
  }

  const [config, shieldedAddresses] = await Promise.all([
    withTimeout(
      connectedApi.getConfiguration(),
      CONNECTOR_API_TIMEOUT_MS,
      "Wallet did not respond to getConfiguration() in time.",
    ),
    withTimeout(
      connectedApi.getShieldedAddresses(),
      CONNECTOR_API_TIMEOUT_MS,
      "Wallet did not respond to getShieldedAddresses() in time.",
    ),
  ]);

  const privateStateProvider = new InMemoryPrivateStateProvider();
  const proofServerUrl = LOCAL_PROOF_SERVER_URL;
  // The http-client-proof-provider currently depends on its own copy of
  // `@midnight-ntwrk/midnight-js-types`, which makes the ZKConfigProvider type nominally
  // incompatible in TS even though the runtime shape matches.
  const proofProvider = httpClientProofProvider(proofServerUrl, zkConfigProvider as never, {
    timeout: 5 * 60 * 1000,
  });

  return {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
      WebSocket as never,
    ),
    zkConfigProvider,
    proofProvider,
    walletProvider: {
      getCoinPublicKey() {
        return shieldedAddresses.shieldedCoinPublicKey;
      },
      getEncryptionPublicKey() {
        return shieldedAddresses.shieldedEncryptionPublicKey;
      },
      async balanceTx(tx: unknown, _ttl?: Date) {
        try {
          const serializedTx = bytesToHex((tx as { serialize(): Uint8Array }).serialize());
          const received = await withTimeout(
            connectedApi.balanceUnsealedTransaction(serializedTx, { payFees: true }),
            WALLET_TX_TIMEOUT_MS,
            "Wallet did not respond to balance request in time. Ensure the Midnight wallet popup is not blocked and try again.",
          );

          return Transaction.deserialize<SignatureEnabled, Proof, Binding>(
            "signature",
            "proof",
            "binding",
            fromHex(received.tx),
          );
        } catch (error) {
          throw normalizeConnectorError(error);
        }
      },
    },
    midnightProvider: {
      async submitTx(tx: FinalizedTransaction): Promise<TransactionId> {
        try {
          await withTimeout(
            connectedApi.submitTransaction(bytesToHex(tx.serialize())),
            WALLET_TX_TIMEOUT_MS,
            "Wallet did not respond to submit request in time. Ensure the Midnight wallet popup is not blocked and try again.",
          );
          const identifiers = tx.identifiers();
          const firstIdentifier = identifiers[0];
          if (!firstIdentifier) {
            throw new Error("The submitted transaction did not expose a transaction identifier.");
          }
          return firstIdentifier;
        } catch (error) {
          throw normalizeConnectorError(error);
        }
      },
    },
  };
}

function deriveActorKey(contractModule: any, label: string, secretKey: Uint8Array) {
  const helper = new contractModule.Contract({
    get_user_secret_key: () => [undefined, ZERO_32.slice()],
    get_admin_secret_key: () => [undefined, ZERO_32.slice()],
    get_evidence_hash: () => [undefined, ZERO_32.slice()],
    get_evidence_class_raw: () => [undefined, ZERO_8.slice()],
    get_verification_score: () => [undefined, 0n],
    get_criteria_bytes: () => [undefined, ZERO_256.slice()],
    get_req_evidence_class: () => [undefined, ZERO_8.slice()],
    get_min_score_threshold: () => [undefined, 0n],
    get_freq_slots_required: () => [undefined, 0n],
    get_last_completion_slot: () => [undefined, 0n],
    get_current_slot: () => [undefined, 0n],
    get_review_payload: () => [undefined, ZERO_256.slice()],
    get_commitment_payload: () => [undefined, ZERO_256.slice()],
    get_passed_flag: () => [undefined, false],
    get_score_band: () => [undefined, 0n],
  } as never);

  if (typeof helper._derive_actor_key_0 !== "function") {
    throw new Error("Could not access the generated derive_actor_key helper.");
  }

  return helper._derive_actor_key_0(toBytes32FromText(label), secretKey);
}

export async function executeAdminRewardDecisionOnChain(params: {
  connectedApi: ConnectedAPI | null;
  walletAddress: string | null;
  commitment: CommitmentResponse;
  status: "approved" | "rejected";
}): Promise<AdminRewardDecisionResult> {
  const connectedApi = requireConnectedWallet(params.connectedApi);
  const walletAddress = params.walletAddress ?? params.commitment.quest?.creatorWallet;
  if (!walletAddress) {
    throw new Error("Connect the admin wallet before approving or rejecting rewards on-chain.");
  }

  const quest = requireQuest(params.commitment);
  const certId = requireCertificateId(params.commitment);
  const questId = requireQuestChainId(params.commitment);
  const adminSecretKey = toBytes32FromText(walletAddress);
  const currentSlot = nowSlot();
  const providers = await createBrowserProviders(
    connectedApi,
    new BrowserZkConfigProvider(completionAssets),
  );

  const completionContract = await findDeployedContract(providers as never, {
    contractAddress: COMPLETION_REGISTRY_ADDRESS,
    compiledContract: completionCompiledContract,
    privateStateId: `completion-admin:${params.commitment.commitmentId}`,
    initialPrivateState: makeCompletionPrivateState({
      adminSecretKey,
      currentSlot,
    }),
  } as never);

  const decisionTx =
    params.status === "approved"
      ? await completionContract.callTx.approve_completion(
          toBytes32FromHex(certId),
          BigInt(Math.max(1, Math.floor(params.commitment.rewardAmount))),
          currentSlot,
        )
      : await completionContract.callTx.reject_completion(
          toBytes32FromHex(certId),
          currentSlot,
        );

  let escrowDecisionTxId: string | undefined;

  if (quest.rewardMode === "escrow-auto") {
    const escrowAddress = requireEscrowAddress(params.commitment);
    const escrowProviders = await createBrowserProviders(
      connectedApi,
      new BrowserZkConfigProvider(rewardEscrowAssets),
    );
    const rewardEscrowContract = await findDeployedContract(
      escrowProviders as never,
      {
        contractAddress: escrowAddress,
        compiledContract: rewardEscrowCompiledContract,
        privateStateId: `reward-escrow-admin:${params.commitment.commitmentId}`,
        initialPrivateState: makeRewardEscrowPrivateState({ adminSecretKey }),
      } as never,
    );

    const completerKey = deriveActorKey(
      CompletionRegistry,
      "zkquest:completer:",
      toBytes32FromText(params.commitment.walletAddress),
    );

    const escrowTx =
      params.status === "approved"
        ? await rewardEscrowContract.callTx.approve_reward(
            toBytes32FromHex(certId),
            toBytes32FromHex(questId),
            completerKey,
            BigInt(Math.max(1, Math.floor(params.commitment.rewardAmount))),
            currentSlot,
          )
        : await rewardEscrowContract.callTx.reject_reward(
            toBytes32FromHex(certId),
            toBytes32FromHex(questId),
            completerKey,
            currentSlot,
          );

    escrowDecisionTxId = escrowTx.public.txId;
  }

  return {
    completionDecisionTxId: decisionTx.public.txId,
    escrowDecisionTxId,
  };
}

export async function executeRewardClaimOnChain(params: {
  connectedApi: ConnectedAPI | null;
  walletAddress: string | null;
  commitment: CommitmentResponse;
}): Promise<RewardClaimResult> {
  const connectedApi = requireConnectedWallet(params.connectedApi);
  const walletAddress = params.walletAddress ?? params.commitment.walletAddress;
  if (!walletAddress) {
    throw new Error("Connect the claimant wallet before claiming this reward.");
  }

  const certId = requireCertificateId(params.commitment);
  const escrowAddress = requireEscrowAddress(params.commitment);
  const userSecretKey = toBytes32FromText(walletAddress);
  const currentSlot = nowSlot();

  const escrowProviders = await createBrowserProviders(
    connectedApi,
    new BrowserZkConfigProvider(rewardEscrowAssets),
  );
  const rewardEscrowContract = await findDeployedContract(
    escrowProviders as never,
    {
      contractAddress: escrowAddress,
      compiledContract: rewardEscrowCompiledContract,
      privateStateId: `reward-escrow-claim:${params.commitment.commitmentId}`,
      initialPrivateState: makeRewardEscrowPrivateState({ userSecretKey }),
    } as never,
  );

  const escrowClaimTx = await rewardEscrowContract.callTx.claim_reward(
    toBytes32FromHex(certId),
    currentSlot,
  );

  const completionProviders = await createBrowserProviders(
    connectedApi,
    new BrowserZkConfigProvider(completionAssets),
  );
  const completionContract = await findDeployedContract(
    completionProviders as never,
    {
      contractAddress: COMPLETION_REGISTRY_ADDRESS,
      compiledContract: completionCompiledContract,
      privateStateId: `completion-claim:${params.commitment.commitmentId}`,
      initialPrivateState: makeCompletionPrivateState({
        userSecretKey,
        currentSlot,
      }),
    } as never,
  );

  const completionClaimTx = await completionContract.callTx.mark_reward_claimed(
    toBytes32FromHex(certId),
    currentSlot,
    toBytes32FromHex(escrowClaimTx.public.txId),
  );

  return {
    escrowClaimTxId: escrowClaimTx.public.txId,
    completionClaimTxId: completionClaimTx.public.txId,
  };
}

// ---------------------------------------------------------------------------
// Quest Registry — create_quest
// ---------------------------------------------------------------------------

export async function createQuestOnChain(
  params: CreateQuestOnChainParams,
): Promise<CreateQuestOnChainResult> {
  const {
    connectedApi: rawApi,
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

  if (!rawApi) {
    throw new Error("Connect a Midnight wallet before creating a quest on-chain.");
  }

  if (rewardMode === "ESCROW_AUTOMATIC" && !(escrowAmount > 0)) {
    // Contract asserts `escrow_amount > 0` when `reward_mode` is escrow-auto.
    throw new Error(
      "Escrow amount is required when rewardMode is ESCROW_AUTOMATIC. Provide escrowAmount > 0.",
    );
  }

  const criteriaStr = JSON.stringify(criteriaJson);
  const criteriaBytes = new Uint8Array(256);
  criteriaBytes.set(textEncoder.encode(criteriaStr.slice(0, 256)));

  const callerSecretKeyBytes = toBytes32FromText(spaceId); // deterministic per creator
  const emptyPrivateState = new ChargedState(StateValue.newNull());

  const currentSlot = nowSlot();
  const tsBuf = new Uint8Array(8);
  new DataView(tsBuf.buffer).setBigUint64(0, currentSlot, true);

  const rewardModeEnum =
    rewardMode === "ESCROW_AUTOMATIC"
      ? QuestRegistry.RewardMode.ESCROW_AUTOMATIC
      : QuestRegistry.RewardMode.XP_ONLY;

  // Build questRegistry compiled contract lazily to avoid module-init Symbol issues
  if (!QuestRegistry.Contract) {
    throw new Error("quest-registry contract module failed to load. Ensure the compiled contract is accessible.");
  }
  const questRegistryCompiledContract = CompiledContract.make(
    "quest-registry",
    QuestRegistry.Contract,
  ).pipe(
    CompiledContract.withWitnesses({
      // NOTE: the Compact runtime may pass a ChargedState wrapper here, so we must
      // return the provided state unchanged. We close over our bytes instead of
      // storing a custom privateState object.
      // We deliberately return a known-good ChargedState here. This circuit does
      // not rely on private state beyond witness outputs, and some runtime paths
      // expect the privateState slot to always be a ChargedState instance.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      caller_secret_key: (_ctx: any) => [emptyPrivateState, callerSecretKeyBytes],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get_criteria_bytes: (_ctx: any) => [emptyPrivateState, criteriaBytes],
    } as never),
    CompiledContract.withCompiledFileAssets("quest-registry/browser"),
  );

  const providers = await createBrowserProviders(
    rawApi,
    new BrowserZkConfigProvider(questRegistryAssets),
  );

  const before = await snapshotQuestRegistryLedger(providers.publicDataProvider);

  // timestamp must be Bytes<32> per the contract spec
  const timestamp32 = new Uint8Array(32);
  timestamp32.set(tsBuf); // 8 bytes of slot data in first 8 bytes

  try {
    const submitted = await submitCallTxAsync(providers as never, {
      contractAddress: QUEST_REGISTRY_ADDRESS,
      compiledContract: questRegistryCompiledContract,
      circuitId: "create_quest",
      args: [
        toBytes32FromText(spaceId),
        toBytes32FromText(sprintId),
        (() => {
          const b = new Uint8Array(8);
          b.set(textEncoder.encode(questType.slice(0, 8)));
          return b;
        })(),
        (() => {
          const b = new Uint8Array(8);
          b.set(textEncoder.encode(trackTag.slice(0, 8)));
          return b;
        })(),
        BigInt(freqSlots),
        BigInt(maxCompletions),
        BigInt(expiresAtSlot),
        BigInt(Math.min(xpValue, 65535)),
        rewardModeEnum,
        toBytes32FromText(escrowContract),
        BigInt(escrowAmount),
        timestamp32,
      ],
    } as never);

    const txId = submitted.txId as unknown as string;

    // Read the real quest ID from the ledger (the on-chain key), instead of fabricating one.
    const created = await findNewQuestLedgerEntry({
      before,
      publicDataProvider: providers.publicDataProvider,
    });
    if (!created) {
      throw new Error(
        "Quest transaction submitted, but the indexer has not exposed the new quest yet. Wait a few seconds and retry.",
      );
    }

    const onChainQuestId = created.key;

    console.info("[quest:create-chain] create_quest submitted on-chain (async)", {
      onChainQuestId: onChainQuestId.slice(0, 16) + "…",
      txId: (txId ?? "").slice(0, 16) + "…",
      contractAddress: QUEST_REGISTRY_ADDRESS,
    });

    return { onChainQuestId, txId };
  } catch (error) {
    const detail = formatUnknownError(error);
    throw new Error(
      `create_quest circuit execution failed before wallet submission. This is usually a contract assert or type mismatch. Details: ${detail}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Completion Registry — verify_completion
// ---------------------------------------------------------------------------

export async function commitCompletionOnChain(
  params: CommitCompletionOnChainParams,
): Promise<CommitCompletionOnChainResult> {
  const {
    connectedApi: rawApi,
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

  if (!rawApi) {
    throw new Error("Connect a Midnight wallet before submitting a completion on-chain.");
  }

  const resolveQuestOnChainMeta = async (): Promise<{
    onChainQuestId: string;
    onChainCriteriaCommitment?: string;
  } | null> => {
    // If caller already passed an on-chain quest id, we cannot infer criteria commitment.
    if (isLikelyHexBytes32(questId)) {
      return { onChainQuestId: questId };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/quests/${encodeURIComponent(questId)}`);
      if (!response.ok) {
        return null;
      }
      const quest = (await response.json()) as {
        onChainQuestId?: string;
        onChainCriteriaCommitment?: string;
      };
      if (!quest.onChainQuestId) {
        return null;
      }
      return {
        onChainQuestId: quest.onChainQuestId,
        onChainCriteriaCommitment: quest.onChainCriteriaCommitment,
      };
    } catch {
      return null;
    }
  };

  const questMeta = await resolveQuestOnChainMeta();
  const onChainQuestId = questMeta?.onChainQuestId ?? questId;
  if (!isLikelyHexBytes32(onChainQuestId)) {
    throw new Error(
      "Quest is missing its on-chain Midnight quest ID. Create/publish the quest on-chain first, then retry the completion commitment.",
    );
  }

  // IMPORTANT: verify_completion expects the quest's on-chain criteria commitment (set during create_quest)
  // as the admin/criteria key input. Deriving it from spaceId breaks contract verification.
  let criteriaCommitmentHex = questMeta?.onChainCriteriaCommitment;

  const currentSlot = nowSlot();
  const tsBuf = new Uint8Array(8);
  new DataView(tsBuf.buffer).setBigUint64(0, currentSlot, true);

  // If the backend quest record doesn't have criteria commitment yet, pull it from chain.
  if (!criteriaCommitmentHex || !isLikelyHexBytes32(criteriaCommitmentHex)) {
    const bootstrapProviders = await createBrowserProviders(
      rawApi,
      new BrowserZkConfigProvider(completionAssets),
    );
    const fromChain = await tryGetQuestCriteriaCommitmentFromChain({
      publicDataProvider: bootstrapProviders.publicDataProvider,
      onChainQuestId,
    });
    if (fromChain && isLikelyHexBytes32(fromChain)) {
      criteriaCommitmentHex = fromChain;
    }
  }

  if (!criteriaCommitmentHex || !isLikelyHexBytes32(criteriaCommitmentHex)) {
    throw new Error(
      "Quest is missing its on-chain criteria commitment (not found in backend record or on-chain yet). If you just created the quest, wait a few seconds for the indexer to catch up and retry.",
    );
  }

  const reviewPayloadStr = JSON.stringify({
    reviewId, questId, score, passed, scoreBand, evidenceHash, evidenceClass,
    issuedAt: new Date().toISOString(),
  });
  const commitmentPayloadStr = JSON.stringify({
    questId, sprintId, spaceId, walletAddress, xpValue,
    timestamp: bytesToHex(tsBuf),
  });

  const reviewPayload = new Uint8Array(256);
  reviewPayload.set(textEncoder.encode(reviewPayloadStr.slice(0, 256)));
  const commitmentPayload = new Uint8Array(256);
  commitmentPayload.set(textEncoder.encode(commitmentPayloadStr.slice(0, 256)));

  const reviewCommitmentHash = bytesToHex(
    new Uint8Array(await crypto.subtle.digest("SHA-256", reviewPayload)),
  );

  // The completion circuit uses the quest's criteria commitment as the admin/criteria key.
  const adminKey = toBytes32FromHex(criteriaCommitmentHex);
  const combinedBuf = new Uint8Array(reviewPayload.length + commitmentPayload.length);
  combinedBuf.set(reviewPayload);
  combinedBuf.set(commitmentPayload, reviewPayload.length);
  const onChainCommitment = new Uint8Array(
    await crypto.subtle.digest("SHA-256", combinedBuf),
  );

  // Align with the rest of the browser flows (admin decision / reward claim) which use the wallet address directly.
  const userSecretKey = toBytes32FromText(walletAddress);

  const privateState: CompletionPrivateState = {
    userSecretKey,
    adminSecretKey: adminKey,
    evidenceHash: toBytes32FromHex(evidenceHash),
    evidenceClassRaw: (() => { const b = new Uint8Array(8); b.set(textEncoder.encode(evidenceClass.slice(0, 8))); return b; })(),
    verificationScore: BigInt(Math.round(score)),
    criteriaBytes: ZERO_256.slice(),
    requiredEvidenceClass: ZERO_8.slice(),
    minScoreThreshold: 0n,
    freqSlotsRequired: 0n,
    lastCompletionSlot: 0n,
    currentSlot,
    reviewPayload,
    commitmentPayload,
    passedFlag: passed,
    scoreBand: BigInt(scoreBand),
  };

  const providers = await createBrowserProviders(
    rawApi,
    new BrowserZkConfigProvider(completionAssets),
  );

  const completionContract = await findDeployedContract(providers as never, {
    contractAddress: COMPLETION_REGISTRY_ADDRESS,
    compiledContract: completionCompiledContract,
    privateStateId: `completion-verify:${reviewId}:${Date.now()}`,
    initialPrivateState: privateState,
  } as never);

  const tx = await completionContract.callTx.verify_completion(
    toBytes32FromHex(onChainQuestId),
    toBytes32FromText(sprintId),
    toBytes32FromText(spaceId),
    adminKey,
    onChainCommitment,
    BigInt(Math.min(xpValue, 65535)),
  );

  const txId = tx.public.txId as string;

  // Cert ID: SHA-256 of reviewId + onChainCommitment
  const certIdBuf = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      textEncoder.encode(`${reviewId}:${bytesToHex(onChainCommitment)}`),
    ),
  );
  const certId = bytesToHex(certIdBuf);

  const commitmentHashBuf = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      textEncoder.encode(`${certId}:${reviewCommitmentHash}:${currentSlot}`),
    ),
  );
  const commitmentHash = bytesToHex(commitmentHashBuf);

  console.info("[completion:verify] verify_completion submitted on-chain", {
    certId: certId.slice(0, 16) + "…",
    txId: (txId ?? "").slice(0, 16) + "…",
    contractAddress: COMPLETION_REGISTRY_ADDRESS,
  });

  return { certId, commitmentHash, reviewCommitmentHash, txId };
}
