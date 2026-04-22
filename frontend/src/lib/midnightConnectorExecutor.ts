import type { ConnectedAPI } from "@midnight-ntwrk/dapp-connector-api";
import { CompiledContract } from "../../../contracts/node_modules/@midnight-ntwrk/compact-js";
import { findDeployedContract } from "../../../contracts/node_modules/@midnight-ntwrk/midnight-js-contracts";
import { indexerPublicDataProvider } from "../../../contracts/node_modules/@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {
  ZKConfigProvider,
  createProofProvider,
  createProverKey,
  createVerifierKey,
  createZKIR,
  type ProverKey,
  type VerifierKey,
  type ZKIR,
} from "../../../contracts/node_modules/@midnight-ntwrk/midnight-js-types";
import {
  Binding,
  Proof,
  SignatureEnabled,
  Transaction,
  type FinalizedTransaction,
  type TransactionId,
} from "../../../contracts/node_modules/@midnight-ntwrk/ledger-v8";
import * as CompletionRegistry from "../../../contracts/contracts/managed/completion-registry/contract/index.js";
import * as RewardEscrow from "../../../contracts/contracts/managed/reward-escrow/contract/index.js";
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
import type { CommitmentResponse } from "./api";
import { COMPLETION_REGISTRY_ADDRESS } from "./questContractApi";

const COMPLETION_ASSET_PATH = "completion-registry/browser";
const REWARD_ESCROW_ASSET_PATH = "reward-escrow/browser";
const ZERO_8 = new Uint8Array(8);
const ZERO_32 = new Uint8Array(32);
const ZERO_256 = new Uint8Array(256);
const textEncoder = new TextEncoder();

type CompletionCircuitId =
  | "approve_completion"
  | "reject_completion"
  | "mark_reward_claimed";

type RewardEscrowCircuitId =
  | "approve_reward"
  | "reject_reward"
  | "claim_reward";

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
  const [config, shieldedAddresses, provingProvider] = await Promise.all([
    connectedApi.getConfiguration(),
    connectedApi.getShieldedAddresses(),
    connectedApi.getProvingProvider(zkConfigProvider.asKeyMaterialProvider()),
  ]);

  const privateStateProvider = new InMemoryPrivateStateProvider();

  return {
    privateStateProvider,
    publicDataProvider: indexerPublicDataProvider(
      config.indexerUri,
      config.indexerWsUri,
      WebSocket as never,
    ),
    zkConfigProvider,
    proofProvider: createProofProvider(provingProvider),
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
          const received = await connectedApi.balanceUnsealedTransaction(serializedTx, {
            payFees: true,
          });

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
          await connectedApi.submitTransaction(bytesToHex(tx.serialize()));
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
