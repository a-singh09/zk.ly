import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocket } from "ws";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { toHex } from "@midnight-ntwrk/midnight-js-utils";
import * as ledger from "@midnight-ntwrk/ledger-v8";
import { unshieldedToken } from "@midnight-ntwrk/ledger-v8";
import { WalletFacade } from "@midnight-ntwrk/wallet-sdk-facade";
import { DustWallet } from "@midnight-ntwrk/wallet-sdk-dust-wallet";
import {
  HDWallet,
  Roles,
  generateRandomSeed,
} from "@midnight-ntwrk/wallet-sdk-hd";
import { ShieldedWallet } from "@midnight-ntwrk/wallet-sdk-shielded";
import {
  createKeystore,
  InMemoryTransactionHistoryStorage,
  PublicKey,
  UnshieldedWallet,
} from "@midnight-ntwrk/wallet-sdk-unshielded-wallet";
import { CompiledContract } from "@midnight-ntwrk/compact-js";

// Required for wallet sync subscriptions.
// @ts-expect-error WebSocket is required globally by the wallet SDK.
globalThis.WebSocket = WebSocket;

setNetworkId("preprod");

const CONFIG = {
  indexer: "https://indexer.preprod.midnight.network/api/v4/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v4/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  proofServer: "http://127.0.0.1:6300",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const managedContractsPath = path.resolve(
  __dirname,
  "..",
  "contracts",
  "managed",
);

function parseNamedArg(name: string) {
  const prefixed = `${name}=`;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefixed)) {
      return arg.slice(prefixed.length).trim();
    }
  }
  return undefined;
}

function getContractName() {
  return (
    process.env.CONTRACT_NAME?.trim() ||
    parseNamedArg("--contract") ||
    "hello-world"
  );
}

const contractName = getContractName();
const availableManagedContracts = fs
  .readdirSync(managedContractsPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

if (!availableManagedContracts.includes(contractName)) {
  throw new Error(
    `Unknown contract '${contractName}'. Available: ${availableManagedContracts.join(", ")}`,
  );
}

const zkConfigPath = path.resolve(managedContractsPath, contractName);

const contractPath = path.join(zkConfigPath, "contract", "index.js");
const ContractModule = await import(pathToFileURL(contractPath).href);

const zeroBytes = (length: number) => new Uint8Array(length);

function defaultWitnessesForContract(name: string) {
  if (name === "completion-registry") {
    return {
      get_user_secret_key: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
      get_admin_secret_key: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
      get_evidence_hash: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
      get_evidence_class_raw: (context: any) => [
        context.privateState,
        zeroBytes(8),
      ],
      get_verification_score: (context: any) => [context.privateState, 0n],
      get_criteria_bytes: (context: any) => [
        context.privateState,
        zeroBytes(256),
      ],
      get_req_evidence_class: (context: any) => [
        context.privateState,
        zeroBytes(8),
      ],
      get_min_score_threshold: (context: any) => [context.privateState, 0n],
      get_freq_slots_required: (context: any) => [context.privateState, 0n],
      get_last_completion_slot: (context: any) => [context.privateState, 0n],
      get_current_slot: (context: any) => [context.privateState, 0n],
      get_review_payload: (context: any) => [
        context.privateState,
        zeroBytes(256),
      ],
      get_commitment_payload: (context: any) => [
        context.privateState,
        zeroBytes(256),
      ],
      get_passed_flag: (context: any) => [context.privateState, false],
      get_score_band: (context: any) => [context.privateState, 0n],
    };
  }

  if (name === "quest-registry") {
    return {
      caller_secret_key: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
      get_criteria_bytes: (context: any) => [
        context.privateState,
        zeroBytes(256),
      ],
    };
  }

  if (name === "reward-escrow") {
    return {
      get_admin_secret_key: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
      get_user_secret_key: (context: any) => [
        context.privateState,
        zeroBytes(32),
      ],
    };
  }

  return {};
}

const baseCompiledContract = CompiledContract.make(
  contractName,
  ContractModule.Contract,
);

const compiledContract = baseCompiledContract.pipe(
  CompiledContract.withWitnesses(
    defaultWitnessesForContract(contractName) as never,
  ),
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

const DEPLOY_SETTLE_DELAY_MS = 6000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForStableSync(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
) {
  await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
  await sleep(DEPLOY_SETTLE_DELAY_MS);
  await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
  );
}

async function deployWithRetry(
  walletCtx: Awaited<ReturnType<typeof createWallet>>,
  providers: Awaited<ReturnType<typeof createProviders>>,
) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await deployContract(
        providers as never,
        { compiledContract } as never,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const transientError =
        /SubmissionError|Invalid Transaction|Custom error:\s*170/i.test(
          message,
        );

      if (!transientError || attempt === maxAttempts) {
        throw error;
      }

      console.warn(
        `Deploy attempt ${attempt} failed with a transient wallet sync error. Retrying in ${
          DEPLOY_SETTLE_DELAY_MS / 1000
        } seconds.`,
      );
      console.warn(message);
      await waitForStableSync(walletCtx);
    }
  }

  throw new Error("Deploy retry loop exited unexpectedly");
}

function deriveKeys(seed: string) {
  const hdWallet = HDWallet.fromSeed(Buffer.from(seed, "hex"));
  if (hdWallet.type !== "seedOk") throw new Error("Invalid seed");

  const result = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);

  if (result.type !== "keysDerived") throw new Error("Key derivation failed");
  hdWallet.hdWallet.clear();
  return result.keys;
}

async function createWallet(seed: string) {
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
      indexerHttpUrl: CONFIG.indexer,
      indexerWsUrl: CONFIG.indexerWS,
    },
    relayURL: new URL(CONFIG.node.replace(/^http/, "ws")),
    provingServerUrl: new URL(CONFIG.proofServer),
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

  return {
    wallet,
    shieldedSecretKeys,
    dustSecretKey,
    unshieldedKeystore,
    seed,
  };
}

async function createProviders(
  walletCtx: ReturnType<typeof createWallet> extends Promise<infer T>
    ? T
    : never,
) {
  const state = await Rx.firstValueFrom(
    walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
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
        { ttl: ttl ?? new Date(Date.now() + 30 * 60 * 1000) },
      );
      const signedRecipe = await walletCtx.wallet.signRecipe(
        recipe,
        (payload) => walletCtx.unshieldedKeystore.signData(payload),
      );
      return walletCtx.wallet.finalizeRecipe(signedRecipe);
    },
    submitTx: (tx: any) => walletCtx.wallet.submitTransaction(tx),
  };

  const zkConfigProvider = new NodeZkConfigProvider(zkConfigPath);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStoragePasswordProvider: () => `Aa1!${walletCtx.seed}`,
      accountId: walletCtx.unshieldedKeystore.getBech32Address().toString(),
    }),
    publicDataProvider: indexerPublicDataProvider(
      CONFIG.indexer,
      CONFIG.indexerWS,
    ),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(
      CONFIG.proofServer,
      zkConfigProvider,
    ),
    walletProvider,
    midnightProvider: walletProvider,
  };
}

async function main() {
  if (!fs.existsSync(path.join(zkConfigPath, "contract", "index.js"))) {
    console.error(`Contract '${contractName}' not compiled in ${zkConfigPath}`);
    console.error(
      `Compile it with: compact compile contracts/${contractName}.compact contracts/managed/${contractName}`,
    );
    process.exit(1);
  }

  console.log(`Target contract: ${contractName}`);

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const seedFromEnv = process.env.WALLET_SEED?.trim();
    const choice = seedFromEnv
      ? "2"
      : await rl.question("[1] Create new wallet\n[2] Restore from seed\n> ");

    const seed = seedFromEnv
      ? seedFromEnv
      : choice.trim() === "2"
        ? await rl.question("Enter your 64-character seed: ")
        : toHex(Buffer.from(generateRandomSeed()));

    if (choice.trim() !== "2" && !seedFromEnv) {
      console.log("Save this seed:");
      console.log(seed);
    }

    const walletCtx = await createWallet(seed.trim());

    await walletCtx.wallet.start(
      walletCtx.shieldedSecretKeys,
      walletCtx.dustSecretKey,
    );

    const state = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s) => s.isSynced),
      ),
    );

    const address = walletCtx.unshieldedKeystore.getBech32Address();
    const balance = state.unshielded.balances[unshieldedToken().raw] ?? 0n;

    console.log(`Wallet address: ${address}`);
    console.log(`Balance: ${balance.toLocaleString()} tNight`);

    if (balance === 0n) {
      console.log(
        "Fund this address at https://faucet.preprod.midnight.network/ and wait for sync.",
      );
      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(10000),
          Rx.filter((s) => s.isSynced),
          Rx.map((s) => s.unshielded.balances[unshieldedToken().raw] ?? 0n),
          Rx.filter((b) => b > 0n),
        ),
      );
    }

    const dustState = await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
    );

    if (dustState.dust.balance(new Date()) === 0n) {
      const nightUtxos = dustState.unshielded.availableCoins.filter(
        (c: { meta?: { registeredForDustGeneration?: boolean } }) =>
          !c.meta?.registeredForDustGeneration,
      );

      if (nightUtxos.length > 0) {
        const recipe =
          await walletCtx.wallet.registerNightUtxosForDustGeneration(
            nightUtxos,
            walletCtx.unshieldedKeystore.getPublicKey(),
            (payload) => walletCtx.unshieldedKeystore.signData(payload),
          );
        await walletCtx.wallet.submitTransaction(
          await walletCtx.wallet.finalizeRecipe(recipe),
        );
      }

      await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(
          Rx.throttleTime(5000),
          Rx.filter((s) => s.isSynced),
          Rx.filter((s) => s.dust.balance(new Date()) > 0n),
        ),
      );
    }

    await waitForStableSync(walletCtx);

    const providers = await createProviders(walletCtx);
    const deployed = await deployWithRetry(walletCtx, providers);

    const contractAddress = deployed.deployTxData.public.contractAddress;

    const deploymentFile =
      contractName === "hello-world"
        ? "deployment.json"
        : `deployment.${contractName}.json`;

    fs.writeFileSync(
      deploymentFile,
      JSON.stringify(
        {
          contractName,
          contractAddress,
          seed: seed.trim(),
          network: "preprod",
          deployedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );

    console.log("Contract deployed:", contractAddress);
    console.log(`Saved deployment metadata to ${deploymentFile}`);

    await walletCtx.wallet.stop();
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
