import { Link, useLocation } from "react-router-dom";
import { Shield, Wallet, LogOut, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import {
  truncateAddress,
  useMidnightWallet,
} from "../lib/MidnightWalletContext";

export default function Navbar({ className }: { className?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
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

  const isLanding = pathname === "/";

  return (
    <header
      className={cn(
        "fixed top-0 z-40 transition-all duration-300",
        isLanding ? "w-full" : "w-[calc(100%-5rem)] lg:w-[calc(100%-16rem)] left-20 lg:left-64",
        scrolled ? "glass py-4 border-b border-white/10" : "bg-transparent py-6",
        className,
      )}
    >
      <div className={cn("max-w-7xl mx-auto px-6 flex justify-between items-center", !isLanding && "max-w-none")}>
        {!isLanding ? (
          <div />
        ) : (
          <Link
            to="/"
            className="flex items-center border border-white/20 px-4 py-2 hover:border-bright-blue transition-colors bg-[#0A0A0A]"
          >
            <span className="font-heading font-black text-2xl tracking-widest uppercase text-bright-blue">
              ZK
            </span>
            <span className="font-heading font-black text-2xl tracking-widest uppercase text-white">
              .LY
            </span>
          </Link>
        )}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {isLanding && (
            <>
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
            </>
          )}
          {isConnected && (
            <Link
              to="/admin"
              className="px-3 py-1 bg-bright-blue text-white text-[10px] font-black uppercase tracking-[0.1em] hover:bg-bright-blue/90 transition-all border border-bright-blue"
            >
              Admin Console
            </Link>
          )}
        </nav>
        {isConnected ? (
          <button
            onClick={disconnectWallet}
            className="px-6 py-3 bg-white text-midnight font-bold tracking-widest hover:bg-white/90 transition-colors uppercase text-sm border border-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            {isConnected && walletAddress
              ? `Connected ${truncateAddress(walletAddress)}`
              : "Connect Wallet"}
          </button>
        ) : (
          <button
            onClick={connectWallet}
            disabled={isConnecting || isConnected}
            className="px-6 py-3 bg-white text-midnight font-bold tracking-widest hover:bg-white/90 transition-colors uppercase text-sm border border-white disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isConnecting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Wallet size={16} />
            )}
            {isConnected && walletAddress
              ? `Connected ${truncateAddress(walletAddress)}`
              : "Connect Wallet"}
          </button>
        )}
      </div>
    </header>
  );
}
