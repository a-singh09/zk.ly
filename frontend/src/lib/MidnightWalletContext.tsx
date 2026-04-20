import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ShieldedAddressesResponse {
  shieldedAddress: string;
}

interface MidnightWalletApi {
  connect(networkId: string): Promise<{
    getShieldedAddresses?: () => Promise<ShieldedAddressesResponse>;
    getConnectionStatus(): Promise<boolean>;
    getConfiguration(): Promise<unknown>;
  }>;
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
    midnight?:
      | MidnightWalletApi
      | {
          mnLace?: MidnightWalletApi;
          lace?: MidnightWalletApi;
        };
    cardano?: {
      lace?: LaceCip30Provider;
    };
  }
}

const MidnightWalletContext = createContext<
  MidnightWalletContextValue | undefined
>(undefined);

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

  const resolveMidnightApi = (): MidnightWalletApi | undefined => {
    const directApi = window.midnight as MidnightWalletApi | undefined;
    if (directApi && typeof directApi.connect === "function") {
      return directApi;
    }

    const nested = window.midnight as
      | {
          mnLace?: MidnightWalletApi;
          lace?: MidnightWalletApi;
        }
      | undefined;

    if (nested?.mnLace && typeof nested.mnLace.connect === "function") {
      return nested.mnLace;
    }

    if (nested?.lace && typeof nested.lace.connect === "function") {
      return nested.lace;
    }

    return undefined;
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
        const connectedApi = await walletApi.connect(networkId);
        const connectionStatus = await connectedApi.getConnectionStatus();
        const shielded = await connectedApi.getShieldedAddresses?.();

        if (!connectionStatus || !shielded?.shieldedAddress) {
          throw new Error("Wallet connection was rejected.");
        }

        setWalletAddress(shielded.shieldedAddress);
        setWalletNetwork(networkId);
        return shielded.shieldedAddress;
      }

      const cardanoLace = resolveCardanoLaceProvider();
      if (!cardanoLace) {
        throw new Error(
          "Lace wallet was not detected. Ensure the extension is enabled for this site and refresh the page.",
        );
      }

      const cip30 = await cardanoLace.enable();
      const used = await cip30.getUsedAddresses();
      const fallback = cip30.getChangeAddress
        ? await cip30.getChangeAddress()
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
