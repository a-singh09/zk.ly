import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ShieldAlert,
  Award,
  Grid,
  Loader2,
  Lock,
  Unlock,
  EyeOff,
  Eye,
  Zap,
} from "lucide-react";
import { getProfile } from "../lib/api";
import { useMidnightWallet } from "../lib/MidnightWalletContext";

const TIER_STYLES: Record<string, { border: string; bg: string; text: string; glow: string }> = {
  LEGEND:      { border: "border-yellow-400/50",  bg: "bg-yellow-400/10",  text: "text-yellow-300",  glow: "shadow-[0_0_30px_rgba(250,204,21,0.15)]" },
  ARCHITECT:   { border: "border-purple-400/50",  bg: "bg-purple-400/10",  text: "text-purple-300",  glow: "shadow-[0_0_30px_rgba(192,132,252,0.15)]" },
  BUILDER:     { border: "border-bright-blue/50", bg: "bg-bright-blue/10", text: "text-bright-blue",  glow: "shadow-[0_0_30px_rgba(0,0,254,0.15)]" },
  CONTRIBUTOR: { border: "border-emerald-400/50", bg: "bg-emerald-400/10", text: "text-emerald-300",  glow: "shadow-[0_0_25px_rgba(52,211,153,0.12)]" },
  NEWCOMER:    { border: "border-white/20",        bg: "bg-white/5",        text: "text-white/60",    glow: "" },
};

const TIER_THRESHOLDS: Record<string, { min: number; max: number; label: string }> = {
  NEWCOMER:    { min: 0,     max: 999,   label: "0 – 999 XP" },
  CONTRIBUTOR: { min: 1000,  max: 4999,  label: "1,000 – 4,999 XP" },
  BUILDER:     { min: 5000,  max: 14999, label: "5,000 – 14,999 XP" },
  ARCHITECT:   { min: 15000, max: 49999, label: "15,000 – 49,999 XP" },
  LEGEND:      { min: 50000, max: Infinity, label: "50,000+ XP" },
};

function TierProgressBar({ tier, xpPublic }: { tier: string; xpPublic: number }) {
  const threshold = TIER_THRESHOLDS[tier];
  if (!threshold) return null;
  const { min, max } = threshold;
  const pct = max === Infinity
    ? 100
    : Math.min(100, Math.max(0, ((xpPublic - min) / (max - min)) * 100));

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-1.5">
        <span>{threshold.label}</span>
        <span>{pct.toFixed(0)}% to next tier</span>
      </div>
      <div className="h-1 w-full bg-white/5 overflow-hidden">
        <div
          className="h-full bg-bright-blue/60 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function ProfileCard() {
  const { key } = useParams();
  const { walletAddress } = useMidnightWallet();
  const [profile, setProfile] = useState<{
    wallet: string;
    tier: string;
    verifiedQuests: number;
    activeSpaces: number;
    xpPublic: number;
    memberSince: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const targetWallet = useMemo(() => {
    if (!key) return walletAddress;
    return key === "me" ? walletAddress : key;
  }, [key, walletAddress]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!targetWallet) {
        setLoading(false);
        setError("Connect your wallet or provide a profile wallet address.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await getProfile(targetWallet);
        if (!cancelled) setProfile(response);
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load profile",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [targetWallet]);

  if (loading) {
    return (
      <div className="w-full p-8 max-w-5xl mx-auto mt-12">
        <div className="bg-[#161616] p-12 lg:p-16 border border-white/10 flex items-center justify-center gap-3 text-white/60 uppercase tracking-widest text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading profile…
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full p-8 max-w-5xl mx-auto mt-12">
        <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
          {error ?? "Profile not found."}
        </div>
      </div>
    );
  }

  const tierStyles = TIER_STYLES[profile.tier] ?? TIER_STYLES.NEWCOMER;
  const initials = profile.wallet.slice(2, 4).toUpperCase();

  return (
    <div className="w-full p-8 max-w-5xl mx-auto mt-12">
      <div className={`bg-[#161616] p-12 lg:p-16 border ${tierStyles.border} ${tierStyles.glow}`}>
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-12 pb-12 mb-12 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className={`w-40 h-40 bg-[#0A0A0A] border-4 ${tierStyles.border} flex items-center justify-center`}>
              <span className="text-6xl tracking-tighter filter grayscale font-heading font-black text-white/50">
                {initials}
              </span>
            </div>
            <div className="text-center md:text-left mt-4">
              <h1 className="text-3xl md:text-5xl font-bold font-mono tracking-tighter mb-4 text-white break-all">
                {profile.wallet}
              </h1>
              <div
                className={`inline-flex items-center gap-3 px-6 py-2 ${tierStyles.bg} ${tierStyles.text} border ${tierStyles.border} font-bold tracking-[0.2em] uppercase text-sm mb-4`}
              >
                <ShieldAlert size={18} /> {profile.tier} TIER
              </div>
              <TierProgressBar tier={profile.tier} xpPublic={profile.xpPublic} />
              <p className="text-white/40 text-sm uppercase tracking-widest font-mono mt-3">
                Member since{" "}
                {new Date(profile.memberSince).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* XP block */}
          <div className="flex flex-col gap-3 min-w-[200px]">
            <div className={`px-8 py-5 ${tierStyles.bg} border ${tierStyles.border} text-center`}>
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center justify-center gap-1">
                <Unlock size={10} className="text-emerald-400" />
                Public XP (on-chain)
              </div>
              <div className={`text-4xl font-black font-heading ${tierStyles.text}`}>
                {profile.xpPublic.toLocaleString()}
              </div>
              <div className="text-[10px] text-white/30 mt-1 font-mono">
                xp_awarded (sum)
              </div>
            </div>
            <div className="px-8 py-4 bg-white/5 border border-white/10 text-center">
              <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1 flex items-center justify-center gap-1">
                <EyeOff size={10} />
                Total XP (ZK private)
              </div>
              <div className="text-xl font-black font-heading text-white/30 tracking-widest">
                ████████
              </div>
              <div className="text-[10px] text-white/20 mt-1 font-mono">
                stored in private state
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <div className="bg-[#0A0A0A] p-10 border border-white/10 flex flex-col items-center justify-center">
            <Award className="mb-6 text-bright-blue" size={40} />
            <div className="text-6xl font-black font-heading tracking-tighter mb-4">
              {profile.verifiedQuests}
            </div>
            <div className="text-white/40 text-sm uppercase tracking-[0.2em] font-bold">
              Verified Quests
            </div>
          </div>
          <div className="bg-[#0A0A0A] p-10 border border-white/10 flex flex-col items-center justify-center">
            <Grid className="mb-6 text-bright-blue" size={40} />
            <div className="text-6xl font-black font-heading tracking-tighter mb-4">
              {profile.activeSpaces}
            </div>
            <div className="text-white/40 text-sm uppercase tracking-[0.2em] font-bold">
              Active Spaces
            </div>
          </div>
        </div>

        {/* ZK Privacy Model explanation */}
        <div className="border border-white/10 bg-[#0A0A0A]">
          <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60">
            <Lock size={14} />
            Midnight Privacy Model
          </div>
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
            <div className="p-6">
              <div className="flex items-center gap-2 text-emerald-400 mb-3 text-xs font-bold uppercase tracking-widest">
                <Unlock size={12} />
                Public on-chain
              </div>
              <ul className="space-y-1.5 text-xs text-white/60">
                <li>• Quest completion count</li>
                <li>• XP earned per quest (xp_awarded)</li>
                <li>• Reputation tier bucket</li>
                <li>• Completion status (verified/rejected)</li>
                <li>• Number of active Spaces</li>
              </ul>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-blue-400 mb-3 text-xs font-bold uppercase tracking-widest">
                <Eye size={12} />
                Selectively disclosed
              </div>
              <ul className="space-y-1.5 text-xs text-white/60">
                <li>• Pass/fail verdict (per quest)</li>
                <li>• Score band (bronze/silver/gold)</li>
                <li>• Evidence class type</li>
                <li>• Cross-space participation flag</li>
              </ul>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 text-white/30 mb-3 text-xs font-bold uppercase tracking-widest">
                <EyeOff size={12} />
                ZK private (never on-chain)
              </div>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li>• Total XP (aggregate)</li>
                <li>• Raw AI review score</li>
                <li>• Full wallet address</li>
                <li>• Quest acceptance criteria</li>
                <li>• AI analysis breakdown</li>
              </ul>
            </div>
          </div>

          {/* Selective disclosure explainer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-2 text-[11px] text-white/40">
              <Zap size={11} className="text-bright-blue" />
              <span>
                <span className="text-white/70 font-bold">Prove tier without revealing XP:</span>{" "}
                Use the{" "}
                <span className="font-mono text-white/60">prove_rank_range(min, max)</span>{" "}
                circuit to cryptographically prove you are in the{" "}
                <span className={`font-bold ${tierStyles.text}`}>{profile.tier}</span>{" "}
                tier without disclosing your exact XP. Verifiers receive only{" "}
                <span className="font-mono text-white/60">true</span>.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
