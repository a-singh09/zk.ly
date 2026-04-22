import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  ConnectionStatus,
  ConnectedAPI,
  InitialAPI,
} from "@midnight-ntwrk/dapp-connector-api";

interface ShieldedAddressesResponse {
  shieldedAddress: string;
}

interface LaceCip30Api {
  getUsedAddresses(): Promise<string[]>;
  getChangeAddress?(): Promise<string>;
}

interface LaceCip30Provider {
  enable(): Promise<LaceCip30Api>;
}

interface MidnightWalletContextValue {
  isConnected: boolean;
  isWalletInstalled: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  walletNetwork: string | null;
  walletError: string | null;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  clearWalletError: () => void;
}

declare global {
  interface Window {
    cardano?: {
      lace?: LaceCip30Provider;
    };
  }
}

const MidnightWalletContext = createContext<
  MidnightWalletContextValue | undefined
>(undefined);

const CONNECT_TIMEOUT_MS = 15_000;
const API_TIMEOUT_MS = 10_000;

const withTimeout = async <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
};

const isInitialApi = (value: unknown): value is InitialAPI => {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as { connect?: unknown }).connect === "function",
  );
};

const normalizeConnectionStatus = (
  status: ConnectionStatus | boolean,
): { connected: boolean; networkId?: string } => {
  if (typeof status === "boolean") {
    return { connected: status };
  }

  if (status.status === "connected") {
    return { connected: true, networkId: status.networkId };
  }

  return { connected: false };
};

function truncateAddress(address: string) {
  return address.length > 16
    ? `${address.slice(0, 8)}…${address.slice(-6)}`
    : address;
}

export function MidnightWalletProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<string | null>("preprod");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);

  const networkId = "preprod";

  const resolveMidnightApi = (): InitialAPI | undefined => {
    const injected = window.midnight;
    if (!injected || typeof injected !== "object") {
      return undefined;
    }

    const candidates: InitialAPI[] = [];

    if (isInitialApi(injected.mnLace)) {
      candidates.push(injected.mnLace);
    }

    if (isInitialApi(injected.lace)) {
      candidates.push(injected.lace);
    }

    for (const value of Object.values(injected)) {
      if (isInitialApi(value)) {
        candidates.push(value);
      }
    }

    if (candidates.length === 0) {
      return undefined;
    }

    const uniqueCandidates = Array.from(new Set(candidates));
    const compatibleCandidates = uniqueCandidates.filter((candidate) => {
      const major = Number.parseInt(
        candidate.apiVersion.split(".")[0] ?? "0",
        10,
      );
      return Number.isFinite(major) && major >= 4;
    });

    // Prefer explicit Lace aliases and API v4+ connectors, then any injected connector.
    return compatibleCandidates[0] ?? uniqueCandidates[0];
  };

  const resolveCardanoLaceProvider = (): LaceCip30Provider | undefined => {
    const provider = window.cardano?.lace;
    if (provider && typeof provider.enable === "function") {
      return provider;
    }
    return undefined;
  };

  const isWalletInstalled = (() => {
    return Boolean(resolveMidnightApi() || resolveCardanoLaceProvider());
  })();

  const connectWallet = async () => {
    setIsConnecting(true);
    setWalletError(null);

    try {
      const walletApi = resolveMidnightApi();

      if (walletApi) {
        const connectedApi: ConnectedAPI = await withTimeout(
          walletApi.connect(networkId),
          CONNECT_TIMEOUT_MS,
          "Midnight Lace wallet connection timed out. Ensure the extension popup is not blocked and try again.",
        );
        const connectionStatus = normalizeConnectionStatus(
          await withTimeout(
            connectedApi.getConnectionStatus(),
            API_TIMEOUT_MS,
            "Could not confirm wallet connection status in time.",
          ),
        );

        if (!connectionStatus.connected) {
          throw new Error("Wallet connection was rejected.");
        }

        const connectedNetworkId = connectionStatus.networkId ?? networkId;
        if (connectedNetworkId !== networkId) {
          setWalletError(
            `Lace wallet is connected to ${connectedNetworkId}. Backend expects ${networkId}; on-chain transactions may fail until you switch networks.`,
          );
        }

        const shielded: ShieldedAddressesResponse = await withTimeout(
          connectedApi.getShieldedAddresses(),
          API_TIMEOUT_MS,
          "Wallet connected, but loading shielded address timed out.",
        );

        if (!shielded?.shieldedAddress) {
          throw new Error(
            "Wallet connected but no shielded address was returned.",
          );
        }

        setWalletAddress(shielded.shieldedAddress);
        setWalletNetwork(connectedNetworkId);
        return shielded.shieldedAddress;
      }

      const cardanoLace = resolveCardanoLaceProvider();
      if (!cardanoLace) {
        throw new Error(
          "Lace wallet was not detected. Ensure the extension is enabled for this site and refresh the page.",
        );
      }

      const cip30 = await withTimeout(
        cardanoLace.enable(),
        CONNECT_TIMEOUT_MS,
        "Lace CIP-30 connection timed out. Ensure wallet popup is visible and this site is authorized.",
      );
      const used = await withTimeout(
        cip30.getUsedAddresses(),
        API_TIMEOUT_MS,
        "Timed out while loading addresses from Lace.",
      );
      const fallback = cip30.getChangeAddress
        ? await withTimeout(
            cip30.getChangeAddress(),
            API_TIMEOUT_MS,
            "Timed out while loading a change address from Lace.",
          )
        : undefined;
      const resolvedAddress = used[0] ?? fallback;

      if (!resolvedAddress) {
        throw new Error("Lace connected but no wallet address was returned.");
      }

      setWalletAddress(resolvedAddress);
      setWalletNetwork("lace");
      return resolvedAddress;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to connect Midnight wallet.";
      setWalletError(message);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletNetwork(networkId);
  };

  const clearWalletError = () => {
    setWalletError(null);
  };

  const value = useMemo<MidnightWalletContextValue>(
    () => ({
      isConnected: Boolean(walletAddress),
      isWalletInstalled,
      isConnecting,
      walletAddress,
      walletNetwork,
      walletError,
      connectWallet,
      disconnectWallet,
      clearWalletError,
    }),
    [
      clearWalletError,
      isConnecting,
      isWalletInstalled,
      walletAddress,
      walletError,
      walletNetwork,
    ],
  );

  return (
    <MidnightWalletContext.Provider value={value}>
      {children}
    </MidnightWalletContext.Provider>
  );
}

export function useMidnightWallet() {
  const context = useContext(MidnightWalletContext);
  if (!context) {
    throw new Error(
      "useMidnightWallet must be used within MidnightWalletProvider",
    );
  }
  return context;
}

export { truncateAddress };
