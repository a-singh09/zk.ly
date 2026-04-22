import { Link, useLocation } from "react-router-dom";
import {
  Trophy,
  User,
  MessageSquare,
  Compass,
  Loader2,
  LogOut,
  Wallet,
  Server,
} from "lucide-react";
import {
  truncateAddress,
  useMidnightWallet,
} from "../lib/MidnightWalletContext";
import { getMidnightHealth, type MidnightHealthStatus } from "../lib/api";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const { pathname } = useLocation();
  const {
    isConnected,
    isConnecting,
    walletAddress,
    connectWallet,
    disconnectWallet,
  } = useMidnightWallet();
  const [health, setHealth] = useState<MidnightHealthStatus | null>(null);

  useEffect(() => {
    const fetchHealth = () => {
      getMidnightHealth()
        .then(setHealth)
        .catch(() => setHealth(null));
    };
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: "Explore", icon: <Compass size={22} />, path: "/spaces" },
    { label: "My Passport", icon: <User size={22} />, path: "/profile/me" },
    { label: "Leaderboard", icon: <Trophy size={22} />, path: "/leaderboard" },
    { label: "Inbox", icon: <MessageSquare size={22} />, path: "#" },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 lg:w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col z-40 transition-all">
      <div className="h-20 flex items-center justify-center lg:justify-start px-0 lg:px-6 border-b border-white/10 shrink-0">
        <Link
          to="/"
          className="flex items-center border border-white/20 px-3 py-1.5 hover:border-bright-blue transition-colors bg-[#0A0A0A]"
        >
          <span className="font-heading font-black text-xl lg:text-2xl tracking-widest uppercase text-bright-blue">
            ZK
          </span>
          <span className="font-heading font-black text-xl lg:text-2xl tracking-widest uppercase text-white">
            .LY
          </span>
        </Link>
      </div>

      <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto w-full">
        {navItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.label}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 group hover:bg-white/5 transition-colors ${isActive ? "text-bright-blue bg-[#0000FE]/5 border-l-2 border-bright-blue" : "text-white/60 border-l-2 border-transparent"}`}
            >
              <div
                className={`${isActive ? "text-bright-blue" : "text-white/60 group-hover:text-white"}`}
              >
                {item.icon}
              </div>
              <span
                className={`hidden lg:block font-medium ${isActive ? "text-white" : "group-hover:text-white"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto space-y-3">
        {/* Midnight network status pill */}
        {health && (
          <div
            className={`hidden lg:flex items-center gap-2 px-3 py-2 border text-[10px] font-mono ${
              health.midnight.enabled
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "border-amber-400/20 bg-amber-500/5 text-amber-400"
            }`}
          >
            <Server size={10} />
            <div className="flex-1 min-w-0">
              <div className="font-bold uppercase tracking-widest text-[9px] mb-0.5">
                Midnight
              </div>
              <div className="text-white/50 text-[9px] truncate">
                {health.midnight.enabled ? "ZK proofs enabled" : "Fallback mode"}
              </div>
            </div>
            <div
              className={`w-2 h-2 rounded-full ${
                health.midnight.enabled ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
          </div>
        )}

        <div className="lg:hidden">
          {isConnected ? (
            <button
              onClick={disconnectWallet}
              className="w-full border border-white/20 px-3 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-bright-blue transition-colors flex items-center justify-center"
              title="Disconnect wallet"
            >
              <LogOut size={14} />
            </button>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-bright-blue border border-bright-blue px-3 py-3 text-[11px] font-bold uppercase tracking-widest hover:bg-[#0000FE]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
              title="Connect wallet"
            >
              {isConnecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Wallet size={14} />
              )}
            </button>
          )}
        </div>
        <div className="hidden lg:block bg-[#161616] p-4 border border-white/10">
          <div className="text-xs text-bright-blue uppercase tracking-widest font-bold mb-3">
            Wallet
          </div>
          <div className="font-mono text-xs text-white/80 break-all mb-4">
            {isConnected && walletAddress
              ? truncateAddress(walletAddress)
              : "Not connected"}
          </div>
          {isConnected ? (
            <button
              onClick={disconnectWallet}
              className="w-full border border-white/20 px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:border-bright-blue transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={13} /> Disconnect
            </button>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-bright-blue border border-bright-blue px-3 py-2 text-[11px] font-bold uppercase tracking-widest hover:bg-[#0000FE]/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isConnecting ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Wallet size={13} />
              )}
              Connect
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
