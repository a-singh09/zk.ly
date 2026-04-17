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
    getShieldedAddresses(): Promise<ShieldedAddressesResponse>;
    getConnectionStatus(): Promise<boolean>;
    getConfiguration(): Promise<unknown>;
  }>;
}

interface MidnightWalletContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  walletAddress: string | null;
  walletNetwork: string | null;
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
}

declare global {
  interface Window {
    midnight?: {
      mnLace?: MidnightWalletApi;
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

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      const wallet = window.midnight?.mnLace;
      if (!wallet) {
        throw new Error("Midnight Lace wallet was not detected.");
      }

      const connectedApi = await wallet.connect("preprod");
      const addresses = await connectedApi.getShieldedAddresses();
      const connectionStatus = await connectedApi.getConnectionStatus();

      if (!connectionStatus) {
        throw new Error("Wallet connection was rejected.");
      }

      setWalletAddress(addresses.shieldedAddress);
      setWalletNetwork("preprod");
      return addresses.shieldedAddress;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setWalletNetwork(null);
  };

  const value = useMemo<MidnightWalletContextValue>(
    () => ({
      isConnected: Boolean(walletAddress),
      isConnecting,
      walletAddress,
      walletNetwork,
      connectWallet,
      disconnectWallet,
    }),
    [isConnecting, walletAddress, walletNetwork],
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
