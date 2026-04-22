import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Buffer } from "node:buffer";
import { WebSocket } from "ws";
import * as Rx from "rxjs";

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import { HDWallet, Roles } from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import type {
  QuestRecord,
  QuestTrack,
  RewardMode,
  ReviewRecord,
} from "../domain/models.js";

(
  globalThis as typeof globalThis & {
    WebSocket: typeof WebSocket;
  }
).WebSocket = WebSocket;

setNetworkId(process.env.MIDNIGHT_NETWORK_ID?.trim() || "preprod");

const NETWORK_CONFIG = {
  indexer:
    process.env.MIDNIGHT_INDEXER_URL ??
    "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS:
    process.env.MIDNIGHT_INDEXER_WS_URL ??
    "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: process.env.MIDNIGHT_RPC_URL ?? "https://rpc.preprod.midnight.network",
  proofServer: process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://127.0.0.1:6300",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..", "..");
const contractsRoot = path.resolve(repoRoot, "contracts");
const managedRoot = path.resolve(contractsRoot, "contracts", "managed");

const questDeploymentPath = path.resolve(
  contractsRoot,
  "deployment.quest-registry.json",
);
const completionDeploymentPath = path.resolve(
  contractsRoot,
  "deployment.completion-registry.json",
);

const questManagedPath = path.resolve(managedRoot, "quest-registry");
const completionManagedPath = path.resolve(managedRoot, "completion-registry");

const QUEST_PRIVATE_STATE_ID = "zklyQuestRegistryState";
const COMPLETION_PRIVATE_STATE_ID = "zklyCompletionRegistryState";

const completionSlots = new Map<string, bigint>();

interface MidnightStatus {
  enabled: boolean;
  reason?: string;
  questContractAddress?: string;
  completionContractAddress?: string;
  txSubmissionMode?: "backend-operator" | "wallet-popup";
}

interface QuestOnChainResult {
  mode: "midnight" | "mock";
  reason?: string;
  questIdHex?: string;
  criteriaCommitmentHex?: string;
  txId?: string;
}

interface CompletionOnChainResult {
  mode: "midnight" | "mock";
  reason?: string;
  certificateIdHex?: string;
  txId?: string;
  reviewCommitmentHex?: string;
  commitmentCommitmentHex?: string;
  disclosedPassed?: boolean;
  disclosedScoreBand?: number;
}

interface DeploymentRecord {
  contractAddress: string;
  seed?: string;
}

interface RuntimeContext {
  questDeployment: DeploymentRecord;
  completionDeployment: DeploymentRecord;
  questModule: any;
  completionModule: any;
  questCompiledContract: any;
  completionCompiledContract: any;
  operatorSecretKey: Uint8Array;
  walletContext: Awaited<ReturnType<typeof createWalletContext>>;
  providers: Awaited<ReturnType<typeof createProviders>>;
}

let runtimePromise: Promise<RuntimeContext | null> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function bytesToHex(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("hex");
}

function strip0x(value: string) {
  return value.startsWith("0x") ? value.slice(2) : value;
}

function isHex(value: string) {
  return /^[0-9a-fA-F]+$/.test(strip0x(value));
}

function toFixedBytesFromText(value: string, length: number): Uint8Array {
  const src = Buffer.from(value, "utf8");
  const result = new Uint8Array(length);
  result.set(src.slice(0, length));
  return result;
}

function toBytes32(value: string): Uint8Array {
  if (isHex(value)) {
    const raw = Buffer.from(strip0x(value), "hex");
    if (raw.length === 32) {
      return new Uint8Array(raw);
    }
  }

  const digest = createHash("sha256").update(value).digest();
  return new Uint8Array(digest);
}

function toBytes32FromHex(value: string | undefined): Uint8Array {
  if (!value) {
    return new Uint8Array(32);
  }

  const normalized = strip0x(value);
  if (!isHex(normalized)) {
    return toBytes32(value);
  }

  const raw = Buffer.from(normalized, "hex");
  if (raw.length === 32) {
    return new Uint8Array(raw);
  }

  const result = new Uint8Array(32);
  result.set(raw.slice(0, 32));
  return result;
}

function toBytes256FromJson(value: unknown): Uint8Array {
  const json = JSON.stringify(value ?? {}, null, 0);
  return toFixedBytesFromText(json, 256);
}

function nowSlot(): bigint {
  return BigInt(Math.floor(Date.now() / 1000));
}

function questTypeTag(type: QuestRecord["type"]): string {
  switch (type) {
    case "blog":
      return "AI_REVIW";
    case "github":
      return "GIT_PR";
    case "social":
      return "SOCIAL";
    case "onchain":
      return "ONCHAIN";
    default:
      return "CUSTOM";
  }
}

function evidenceClassTag(type: QuestRecord["type"]): string {
  switch (type) {
    case "blog":
      return "AI_SCORE";
    case "github":
      return "GIT_PR";
    case "social":
      return "OAUTH_FL";
    case "onchain":
      return "ONCHAIN";
    default:
      return "CUSTOM";
  }
}

function trackTag(track: QuestTrack): string {
  switch (track) {
    case "builder":
      return "BUILDER";
    case "educator":
      return "EDUCATR";
    case "advocate":
      return "ADVOCATE";
    case "community-leadership":
      return "COMLEAD";
    default:
      return "BUILDER";
  }
}

function scoreBand(score: number): number {
  if (score >= 85) return 3;
  if (score >= 75) return 2;
  if (score >= 70) return 1;
  return 0;
}

function safeReadJson<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function getStatus(): MidnightStatus {
  if (process.env.MIDNIGHT_DISABLE_CONTRACTS === "1") {
    return {
      enabled: false,
      reason: "MIDNIGHT_DISABLE_CONTRACTS=1",
      txSubmissionMode: "wallet-popup",
    };
  }

  const questDeployment = safeReadJson<DeploymentRecord>(questDeploymentPath);
  const completionDeployment = safeReadJson<DeploymentRecord>(
    completionDeploymentPath,
  );

  if (
    !questDeployment?.contractAddress ||
    !completionDeployment?.contractAddress
  ) {
    return {
      enabled: false,
      reason:
        "Deployment metadata missing. Deploy quest-registry and completion-registry first.",
      txSubmissionMode: "wallet-popup",
    };
  }

  if (!fs.existsSync(path.join(questManagedPath, "contract", "index.js"))) {
    return {
      enabled: false,
      reason: "Missing compiled artifact: contracts/managed/quest-registry",
      txSubmissionMode: "wallet-popup",
    };
  }

  if (
    !fs.existsSync(path.join(completionManagedPath, "contract", "index.js"))
  ) {
    return {
      enabled: false,
      reason:
        "Missing compiled artifact: contracts/managed/completion-registry",
      txSubmissionMode: "wallet-popup",
    };
  }

  return {
    enabled: true,
    questContractAddress: questDeployment.contractAddress,
    completionContractAddress: completionDeployment.contractAddress,
    txSubmissionMode:
      process.env.MIDNIGHT_TX_SUBMISSION_MODE === "backend-operator"
        ? "backend-operator"
        : "wallet-popup",
  };
}

function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, "hex"));
  if (hdWallet.type !== "seedOk") {
    throw new Error("Invalid Midnight operator seed");
  }

  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (result.type !== "keysDerived") {
    throw new Error("Failed to derive Midnight operator keys");
  }

  hdWallet.hdWallet.clear();
  return result.keys;
}

async function createWalletContext(seed: string) {
  const keys = deriveKeys(seed);
  const networkId = getNetworkId();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(
    keys[Roles.NightExternal],
    networkId,
  );

  const walletConfig = {
    networkId,
    indexerClientConnection: {
      indexerHttpUrl: NETWORK_CONFIG.indexer,
      indexerWsUrl: NETWORK_CONFIG.indexerWS,
    },
    relayURL: new URL(NETWORK_CONFIG.node.replace(/^http/, "ws")),
    provingServerUrl: new URL(NETWORK_CONFIG.proofServer),
    txHistoryStorage: new InMemoryTransactionHistoryStorage(),
    costParameters: {
      additionalFeeOverhead: 300_000_000_000_000n,
      feeBlocksMargin: 5,
    },
  };

  const wallet = await WalletFacade.init({
    configuration: walletConfig,
    shielded: (config) =>
      ShieldedWallet(config).startWithSecretKeys(shieldedSecretKeys),
    unshielded: (config) =>
      UnshieldedWallet(config).startWithPublicKey(
        PublicKey.fromKeyStore(unshieldedKeystore),
      ),
    dust: (config) =>
      DustWallet(config).startWithSecretKey(
        dustSecretKey,
        ledger.LedgerParameters.initialParameters().dust,
      ),
  });

  await wallet.start(shieldedSecretKeys, dustSecretKey);
  await Rx.firstValueFrom(
    wallet.state().pipe(Rx.filter((state) => state.isSynced)),
  );

  return {
    wallet,
    shieldedSecretKeys,
    dustSecretKey,
    unshieldedKeystore,
    seed,
  };
}

async function createProviders(
  walletCtx: Awaited<ReturnType<typeof createWalletContext>>,
) {
  const state = await Rx.firstValueFrom(
    walletCtx.wallet
      .state()
      .pipe(Rx.filter((walletState) => walletState.isSynced)),
  );

  const walletProvider = {
    getCoinPublicKey: () => state.shielded.coinPublicKey.toHexString(),
    getEncryptionPublicKey: () =>
      state.shielded.encryptionPublicKey.toHexString(),
    async balanceTx(tx: any, ttl?: Date) {
      const recipe = await walletCtx.wallet.balanceUnboundTransaction(
        tx,
        {
          shieldedSecretKeys: walletCtx.shieldedSecretKeys,
          dustSecretKey: walletCtx.dustSecretKey,
        },
        {
          ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000),
        },
      );

      const signedRecipe = await walletCtx.wallet.signRecipe(
        recipe,
        (payload) => walletCtx.unshieldedKeystore.signData(payload),
      );

      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx),
  };

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => `Aa1!${walletCtx.seed}`,
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
    }),
    publicDataProvider: indexerPublicDataProvider(
      NETWORK_CONFIG.indexer,
      NETWORK_CONFIG.indexerWS,
    ),
    zkConfigProvider: undefined,
    proofProvider: undefined,
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function initRuntime(): Promise<RuntimeContext | null> {
  const status = getStatus();
  if (!status.enabled) {
    return null;
  }

  const questDeployment = safeReadJson<DeploymentRecord>(questDeploymentPath);
  const completionDeployment = safeReadJson<DeploymentRecord>(
    completionDeploymentPath,
  );

  if (!questDeployment || !completionDeployment) {
    return null;
  }

  const operatorSeed =
    process.env.MIDNIGHT_OPERATOR_SEED?.trim() ||
    questDeployment.seed?.trim() ||
    completionDeployment.seed?.trim();

  if (!operatorSeed) {
    throw new Error(
      "No Midnight operator seed available. Set MIDNIGHT_OPERATOR_SEED or include seed in deployment metadata.",
    );
  }

  const questModule = await import(
    pathToFileURL(path.join(questManagedPath, "contract", "index.js")).href
  );
  const completionModule = await import(
    pathToFileURL(path.join(completionManagedPath, "contract", "index.js")).href
  );

  const operatorSecretKey = toBytes32FromHex(operatorSeed);

  const questCompiledContract = CompiledContract.make(
    "quest-registry",
    questModule.Contract,
  ).pipe(
    CompiledContract.withWitnesses({
      caller_secret_key: (context: any) => [
        context.privateState,
        context.privateState.callerSecretKey,
      ],
      get_criteria_bytes: (context: any) => [
        context.privateState,
        context.privateState.criteriaBytes,
      ],
    } as never),
    CompiledContract.withCompiledFileAssets(questManagedPath),
  );

  const completionCompiledContract = CompiledContract.make(
    "completion-registry",
    completionModule.Contract,
  ).pipe(
    CompiledContract.withWitnesses({
      get_user_secret_key: (context: any) => [
        context.privateState,
        context.privateState.userSecretKey,
      ],
      get_evidence_hash: (context: any) => [
        context.privateState,
        context.privateState.evidenceHash,
      ],
      get_evidence_class_raw: (context: any) => [
        context.privateState,
        context.privateState.evidenceClassRaw,
      ],
      get_verification_score: (context: any) => [
        context.privateState,
        context.privateState.verificationScore,
      ],
      get_criteria_bytes: (context: any) => [
        context.privateState,
        context.privateState.criteriaBytes,
      ],
      get_req_evidence_class: (context: any) => [
        context.privateState,
        context.privateState.requiredEvidenceClass,
      ],
      get_min_score_threshold: (context: any) => [
        context.privateState,
        context.privateState.minScoreThreshold,
      ],
      get_freq_slots_required: (context: any) => [
        context.privateState,
        context.privateState.freqSlotsRequired,
      ],
      get_last_completion_slot: (context: any) => [
        context.privateState,
        context.privateState.lastCompletionSlot,
      ],
      get_current_slot: (context: any) => [
        context.privateState,
        context.privateState.currentSlot,
      ],
      get_review_payload: (context: any) => [
        context.privateState,
        context.privateState.reviewPayload,
      ],
      get_commitment_payload: (context: any) => [
        context.privateState,
        context.privateState.commitmentPayload,
      ],
      get_passed_flag: (context: any) => [
        context.privateState,
        context.privateState.passedFlag,
      ],
      get_score_band: (context: any) => [
        context.privateState,
        context.privateState.scoreBand,
      ],
    } as never),
    CompiledContract.withCompiledFileAssets(completionManagedPath),
  );

  const walletContext = await createWalletContext(operatorSeed);
  const providers = await createProviders(walletContext);

  providers.zkConfigProvider = new NodeZkConfigProvider(completionManagedPath);
  providers.proofProvider = httpClientProofProvider(
    NETWORK_CONFIG.proofServer,
    providers.zkConfigProvider,
  );

  return {
    questDeployment,
    completionDeployment,
    questModule,
    completionModule,
    questCompiledContract,
    completionCompiledContract,
    operatorSecretKey,
    walletContext,
    providers,
  };
}

async function getRuntime() {
  if (!runtimePromise) {
    runtimePromise = initRuntime().catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }

  return runtimePromise;
}

async function snapshotQuestLedger(runtime: RuntimeContext) {
  const state = await runtime.providers.publicDataProvider.queryContractState(
    runtime.questDeployment.contractAddress,
  );

  if (!state) {
    return new Map<string, any>();
  }

  const ledgerState = runtime.questModule.ledger(state.data);
  const snapshot = new Map<string, any>();

  for (const [key, value] of ledgerState.quests) {
    snapshot.set(bytesToHex(key), value);
  }

  return snapshot;
}

async function snapshotCompletionLedger(runtime: RuntimeContext) {
  const state = await runtime.providers.publicDataProvider.queryContractState(
    runtime.completionDeployment.contractAddress,
  );

  if (!state) {
    return new Map<string, any>();
  }

  const ledgerState = runtime.completionModule.ledger(state.data);
  const snapshot = new Map<string, any>();

  for (const [key, value] of ledgerState.completions) {
    snapshot.set(bytesToHex(key), value);
  }

  return snapshot;
}

async function findNewLedgerEntry(
  before: Map<string, any>,
  readSnapshot: () => Promise<Map<string, any>>,
) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const after = await readSnapshot();
    for (const [key, value] of after.entries()) {
      if (!before.has(key)) {
        return { key, value };
      }
    }

    await sleep(1200);
  }

  return null;
}

export function getMidnightStatus(): MidnightStatus {
  return getStatus();
}

export async function createQuestOnMidnight(params: {
  localQuestId: string;
  spaceId: string;
  type: QuestRecord["type"];
  track: QuestTrack;
  reward: number;
  rewardMode: RewardMode;
  escrowContractAddress?: string;
  escrowAmount?: number;
  criteriaJson?: Record<string, unknown>;
}): Promise<QuestOnChainResult> {
  const runtime = await getRuntime();
  if (!runtime) {
    return {
      mode: "mock",
      reason: getStatus().reason,
    };
  }

  const before = await snapshotQuestLedger(runtime);

  const contract = await findDeployedContract(
    runtime.providers as never,
    {
      contractAddress: runtime.questDeployment.contractAddress,
      compiledContract: runtime.questCompiledContract,
      privateStateId: `${QUEST_PRIVATE_STATE_ID}:${params.localQuestId}`,
      initialPrivateState: {
        callerSecretKey: runtime.operatorSecretKey,
        criteriaBytes: toBytes256FromJson(params.criteriaJson ?? {}),
      },
    } as never,
  );

  const rewardModeValue =
    params.rewardMode === "escrow-auto"
      ? runtime.questModule.RewardMode.ESCROW_AUTOMATIC
      : runtime.questModule.RewardMode.XP_ONLY;

  const expiry = nowSlot() + 90n * 24n * 60n * 60n;

  const tx = await contract.callTx.create_quest(
    toBytes32(params.spaceId),
    toBytes32(`${params.spaceId}:default-sprint`),
    toFixedBytesFromText(questTypeTag(params.type), 8),
    toFixedBytesFromText(trackTag(params.track), 8),
    0n,
    0n,
    expiry,
    BigInt(Math.max(0, Math.floor(params.reward))),
    rewardModeValue,
    toBytes32FromHex(params.escrowContractAddress),
    BigInt(Math.max(0, Math.floor(params.escrowAmount ?? 0))),
    toBytes32(`${params.localQuestId}:${Date.now()}`),
  );

  const created = await findNewLedgerEntry(before, async () =>
    snapshotQuestLedger(runtime),
  );

  return {
    mode: "midnight",
    questIdHex: created?.key,
    criteriaCommitmentHex: created
      ? bytesToHex(created.value.criteria_commitment)
      : undefined,
    txId: tx.public?.txId,
  };
}

export async function verifyCompletionOnMidnight(params: {
  quest: QuestRecord;
  review: ReviewRecord;
  walletAddress: string;
  authorizationMode: string;
}): Promise<CompletionOnChainResult> {
  const runtime = await getRuntime();
  if (!runtime) {
    return {
      mode: "mock",
      reason: getStatus().reason,
    };
  }

  if (!params.quest.onChainQuestId || !params.quest.onChainCriteriaCommitment) {
    return {
      mode: "mock",
      reason:
        "Quest is missing on-chain metadata (onChainQuestId/onChainCriteriaCommitment).",
    };
  }

  const before = await snapshotCompletionLedger(runtime);

  const completionKey = `${params.walletAddress}:${params.quest.id}`;
  const currentSlot = nowSlot();
  const lastSlot = completionSlots.get(completionKey) ?? 0n;

  const completionContract = await findDeployedContract(
    runtime.providers as never,
    {
      contractAddress: runtime.completionDeployment.contractAddress,
      compiledContract: runtime.completionCompiledContract,
      privateStateId: `${COMPLETION_PRIVATE_STATE_ID}:${params.review.reviewId}`,
      initialPrivateState: {
        userSecretKey: toBytes32(params.walletAddress),
        evidenceHash: toBytes32FromHex(params.review.evidenceHash),
        evidenceClassRaw: toFixedBytesFromText(
          evidenceClassTag(params.quest.type),
          8,
        ),
        verificationScore: BigInt(Math.max(0, Math.floor(params.review.score))),
        criteriaBytes: toBytes256FromJson(params.quest.criteriaJson ?? {}),
        requiredEvidenceClass: toFixedBytesFromText(
          evidenceClassTag(params.quest.type),
          8,
        ),
        minScoreThreshold: BigInt(
          Math.max(0, Math.floor(params.review.threshold)),
        ),
        freqSlotsRequired: 0n,
        lastCompletionSlot: lastSlot,
        currentSlot,
        reviewPayload: toBytes256FromJson({
          reviewId: params.review.reviewId,
          reviewMode: params.review.reviewMode,
          score: params.review.score,
          threshold: params.review.threshold,
          artifactUrl: params.review.artifactUrl,
          summary: params.review.summary,
        }),
        commitmentPayload: toBytes256FromJson({
          reviewId: params.review.reviewId,
          walletAddress: params.walletAddress,
          authorizationMode: params.authorizationMode,
          evidenceHash: params.review.evidenceHash,
        }),
        passedFlag: params.review.passed,
        scoreBand: BigInt(scoreBand(params.review.score)),
      },
    } as never,
  );

  const verifyTx = await completionContract.callTx.verify_completion(
    toBytes32FromHex(params.quest.onChainQuestId),
    toBytes32(`${params.quest.spaceId}:default-sprint`),
    toBytes32(params.quest.spaceId),
    toBytes32FromHex(params.quest.onChainCriteriaCommitment),
    BigInt(Math.max(0, Math.floor(params.quest.reward))),
  );

  const questContract = await findDeployedContract(
    runtime.providers as never,
    {
      contractAddress: runtime.questDeployment.contractAddress,
      compiledContract: runtime.questCompiledContract,
      privateStateId: `${QUEST_PRIVATE_STATE_ID}:${params.quest.id}:increment`,
      initialPrivateState: {
        callerSecretKey: runtime.operatorSecretKey,
        criteriaBytes: toBytes256FromJson(params.quest.criteriaJson ?? {}),
      },
    } as never,
  );

  await questContract.callTx.increment_completion(
    toBytes32FromHex(params.quest.onChainQuestId),
  );

  completionSlots.set(completionKey, currentSlot);

  const created = await findNewLedgerEntry(before, async () =>
    snapshotCompletionLedger(runtime),
  );

  if (!created) {
    return {
      mode: "midnight",
      txId: verifyTx.public?.txId,
    };
  }

  return {
    mode: "midnight",
    certificateIdHex: created.key,
    txId: verifyTx.public?.txId,
    reviewCommitmentHex: bytesToHex(created.value.review_commitment),
    commitmentCommitmentHex: bytesToHex(created.value.commitment_commitment),
    disclosedPassed: created.value.passed_flag,
    disclosedScoreBand: Number(created.value.score_band),
  };
}

export async function getCompletionCertificate(
  certificateIdHex: string,
): Promise<null | {
  certificateIdHex: string;
  questIdHex: string;
  spaceIdHex: string;
  xpAwarded: number;
  evidenceClass: string;
  reviewCommitmentHex: string;
  commitmentCommitmentHex: string;
  passedFlag: boolean;
  scoreBand: number;
}> {
  const runtime = await getRuntime();
  if (!runtime) {
    return null;
  }

  const snapshot = await snapshotCompletionLedger(runtime);
  const key = strip0x(certificateIdHex).toLowerCase();
  const record = snapshot.get(key);

  if (!record) {
    return null;
  }

  return {
    certificateIdHex: key,
    questIdHex: bytesToHex(record.quest_id),
    spaceIdHex: bytesToHex(record.space_id),
    xpAwarded: Number(record.xp_awarded),
    evidenceClass: Buffer.from(record.evidence_class)
      .toString("utf8")
      .replace(/\0+$/g, ""),
    reviewCommitmentHex: bytesToHex(record.review_commitment),
    commitmentCommitmentHex: bytesToHex(record.commitment_commitment),
    passedFlag: Boolean(record.passed_flag),
    scoreBand: Number(record.score_band),
  };
}
