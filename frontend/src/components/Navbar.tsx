import { Link } from "react-router-dom";
import { Shield, Wallet, LogOut, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import {
  truncateAddress,
  useMidnightWallet,
} from "../lib/MidnightWalletContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const {
    isConnected,
    isConnecting,
    walletAddress,
    connectWallet,
    disconnectWallet,
  } = useMidnightWallet();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-40 transition-all duration-300",
        scrolled ? "glass py-4" : "bg-transparent py-6",
      )}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded bg-bright-blue flex items-center justify-center text-white font-bold group-hover:rotate-12 transition-transform">
            <Shield size={18} />
          </div>
          <span className="font-heading font-bold text-xl tracking-wide">
            zk.ly
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link
            to="/spaces"
            className="hover:text-bright-blue transition-colors"
          >
            Spaces
          </Link>
          <Link
            to="/leaderboard"
            className="hover:text-bright-blue transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            to="/profile/me"
            className="hover:text-bright-blue transition-colors"
          >
            Profile
          </Link>
        </nav>
        {isConnected ? (
          <button
            onClick={disconnectWallet}
            className="px-4 py-2.5 rounded-full bg-white text-midnight font-medium hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] flex items-center gap-2"
          >
            <Wallet size={16} />
            <span>
              {walletAddress ? truncateAddress(walletAddress) : "Connected"}
            </span>
            <LogOut size={14} />
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className="px-5 py-2.5 rounded-full bg-white text-midnight font-medium hover:bg-white/90 transition-all shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  );
}
