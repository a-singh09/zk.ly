import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WebSocket } from "ws";
import * as Rx from "rxjs";
import { Buffer } from "buffer";

import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { NodeZkConfigProvider } from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
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
import { CompiledContract } from "@midnight-ntwrk/compact-js";

// Required for wallet sync subscriptions.
// @ts-expect-error WebSocket is required globally by the wallet SDK.
globalThis.WebSocket = WebSocket;

setNetworkId("preprod");

const CONFIG = {
  indexer: "https://indexer.preprod.midnight.network/api/v3/graphql",
  indexerWS: "wss://indexer.preprod.midnight.network/api/v3/graphql/ws",
  node: "https://rpc.preprod.midnight.network",
  proofServer: "http://127.0.0.1:6300",
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const zkConfigPath = path.resolve(
  __dirname,
  "..",
  "contracts",
  "managed",
  "hello-world",
);

const contractPath = path.join(zkConfigPath, "contract", "index.js");
const HelloWorld = await import(pathToFileURL(contractPath).href);

const compiledContract = CompiledContract.make(
  "hello-world",
  HelloWorld.Contract,
).pipe(
  CompiledContract.withVacantWitnesses,
  CompiledContract.withCompiledFileAssets(zkConfigPath),
);

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

  await wallet.start(shieldedSecretKeys, dustSecretKey);
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
  if (!fs.existsSync("deployment.json")) {
    console.error("No deployment.json found. Run: npm run deploy");
    process.exit(1);
  }

  const deployment = JSON.parse(
    fs.readFileSync("deployment.json", "utf-8"),
  ) as {
    contractAddress: string;
  };

  const rl = createInterface({ input: stdin, output: stdout });

  try {
    const seed = await rl.question("Enter your wallet seed: ");

    const walletCtx = await createWallet(seed.trim());
    await Rx.firstValueFrom(
      walletCtx.wallet.state().pipe(
        Rx.throttleTime(5000),
        Rx.filter((s) => s.isSynced),
      ),
    );

    const providers = await createProviders(walletCtx);

    const contract = await findDeployedContract(
      providers as never,
      {
        contractAddress: deployment.contractAddress,
        compiledContract,
        privateStateId: "helloWorldState",
        initialPrivateState: {},
      } as never,
    );

    let running = true;
    while (running) {
      const walletState = await Rx.firstValueFrom(
        walletCtx.wallet.state().pipe(Rx.filter((s) => s.isSynced)),
      );
      const dust = walletState.dust.balance(new Date());

      console.log("------------------------------");
      console.log(`DUST balance: ${dust.toLocaleString()}`);
      console.log("------------------------------");

      const choice = await rl.question(
        "[1] Store a message\n[2] Read current message\n[3] Exit\n> ",
      );

      switch (choice.trim()) {
        case "1": {
          const message = await rl.question("Enter message: ");
          const tx = await contract.callTx.storeMessage(message);
          console.log("Message stored");
          console.log(`Transaction: ${tx.public.txId}`);
          console.log(`Block: ${tx.public.blockHeight}`);
          break;
        }
        case "2": {
          const state = await providers.publicDataProvider.queryContractState(
            deployment.contractAddress,
          );
          if (state) {
            const ledgerState = HelloWorld.ledger(state.data);
            console.log(
              `Current message: "${ledgerState.message || "(empty)"}"`,
            );
          } else {
            console.log("No message found.");
          }
          break;
        }
        case "3":
          running = false;
          break;
        default:
          console.log("Invalid option.");
      }
    }

    await walletCtx.wallet.stop();
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
