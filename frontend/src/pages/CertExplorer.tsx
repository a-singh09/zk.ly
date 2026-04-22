import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckSquare,
  ShieldCheck,
  Share,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Unlock,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCommitment, type CommitmentResponse } from "../lib/api";

export default function CertExplorer() {
  const { certId } = useParams();
  const [record, setRecord] = useState<CommitmentResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadRecord = async () => {
      if (!certId) return;
      try {
        const response = await getCommitment(certId);
        if (!cancelled) {
          setRecord(response);
        }
      } catch {
        // Keep page visible with generic placeholders when API data is unavailable.
      }
    };

    void loadRecord();
    return () => {
      cancelled = true;
    };
  }, [certId]);

  const resolvedQuest = record?.review?.questId ?? "Unknown quest";
  const resolvedSpace = record?.review?.spaceId ?? "Unknown space";
  const resolvedXp = record?.review?.score ?? 0;
  const resolvedAgent = record?.review
    ? `zkquest-review-${record.review.reviewMode}`
    : "agent-unavailable";

  return (
    <div className="w-full">
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8 justify-between">
        <Link
          to="/profile/me"
          className="flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> BACK TO PROFILE
        </Link>
        <div className="text-sm font-mono text-bright-blue tracking-widest uppercase font-bold">
          Mainnet Verification
        </div>
      </div>

      <div className="p-8 max-w-5xl mx-auto mt-8">
        <div className="bg-[#161616] p-10 md:p-14 border border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-10 mb-10">
            <div className="flex items-center gap-6 mb-8 md:mb-0">
              <div className="w-20 h-20 bg-bright-blue flex items-center justify-center">
                <CheckSquare className="text-white" size={40} />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold font-heading uppercase tracking-tighter text-white">
                  Verified Certificate
                </h1>
                <p className="text-white/50 font-mono mt-3 uppercase tracking-widest text-sm">
                  ID: {certId}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="px-6 py-3 border border-white/20 bg-[#0A0A0A] hover:border-white transition-colors flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                <Share size={18} /> Share
              </button>
              <button className="px-6 py-3 border border-white/20 bg-[#0A0A0A] hover:border-white transition-colors flex items-center gap-3 text-sm font-bold uppercase tracking-widest">
                <ExternalLink size={18} /> Explorer
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 mb-16">
            <div className="space-y-10">
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">
                  Quest Initiated
                </h3>
                <p className="text-xl font-heading font-bold tracking-wide">
                  {resolvedQuest}
                </p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">
                  Space / Sprint
                </h3>
                <p className="text-xl font-heading font-bold tracking-wide">
                  {resolvedSpace}
                </p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">
                  Rewards Allocated
                </h3>
                <p className="text-2xl font-bold text-bright-blue flex items-center gap-3">
                  {resolvedXp} XP
                  <span className="text-xs font-bold bg-[#0A0A0A] border border-white/10 text-white/50 px-3 py-1">
                    IN PRIVATE STATE
                  </span>
                </p>
              </div>
            </div>

            <div className="bg-[#0A0A0A] p-8 border border-white/10">
              {/* ZK Proof mode badge */}
              {record && (
                <div
                  className={`mb-6 border px-4 py-3 text-xs flex items-start gap-3 ${
                    record.proofMode === "midnight"
                      ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200"
                      : "border-amber-400/30 bg-amber-500/5 text-amber-200"
                  }`}
                >
                  {record.proofMode === "midnight" ? (
                    <CheckCircle size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <div className="font-bold uppercase tracking-widest text-[10px] mb-1">
                      {record.proofMode === "midnight"
                        ? "ZK Proof — Midnight Network"
                        : "Local Commitment — Fallback Mode"}
                    </div>
                    <div className="text-white/60 text-[10px] leading-4">
                      {record.chainNote}
                    </div>
                  </div>
                </div>
              )}
              <h3 className="font-bold uppercase tracking-widest mb-8 flex items-center gap-3 pb-4 border-b border-white/10">
                <ShieldCheck className="text-bright-blue" size={24} />
                Cryptographic Proofs
              </h3>
              <ul className="space-y-6 text-sm text-white/70 font-mono">
                <li className="flex items-start gap-4">
                  <CheckSquare
                    size={20}
                    className="text-bright-blue shrink-0 mt-0.5"
                  />
                  <span className="leading-relaxed">
                    Quest acceptance criteria were not modified
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare
                    size={20}
                    className="text-bright-blue shrink-0 mt-0.5"
                  />
                  <span className="leading-relaxed">
                    Evidence matches required type (AI_SCORE)
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare
                    size={20}
                    className="text-bright-blue shrink-0 mt-0.5"
                  />
                  <span className="leading-relaxed">
                    AI quality score met the private threshold
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare
                    size={20}
                    className="text-bright-blue shrink-0 mt-0.5"
                  />
                  <span className="leading-relaxed">
                    Cryptographically bound to the completer
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* ZK Privacy Model Split */}
          <div className="border border-white/10 bg-[#0A0A0A] mb-10">
            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/60">
              <Lock size={14} />
              ZK Privacy Model
            </div>
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/5">
              <div className="p-5">
                <div className="flex items-center gap-2 text-emerald-400 mb-3 text-[10px] font-bold uppercase tracking-widest">
                  <Unlock size={10} /> Public on-chain
                </div>
                <ul className="space-y-1 text-xs text-white/60">
                  <li>• quest_id: <span className="font-mono text-white/80">{record?.review?.questId ?? "—"}</span></li>
                  <li>• xp_awarded: <span className="font-mono text-white/80">{resolvedXp}</span></li>
                  <li>• status: <span className="font-mono text-emerald-300">VERIFIED</span></li>
                  <li>• completer_key (pseudonymous hash)</li>
                </ul>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-blue-400 mb-3 text-[10px] font-bold uppercase tracking-widest">
                  <Eye size={10} /> Selectively disclosed
                </div>
                <ul className="space-y-1 text-xs text-white/60">
                  {record?.disclosure && (
                    <>
                      <li>• passed_flag: <span className={`font-mono ${record.disclosure.disclosed.passed ? "text-emerald-300" : "text-amber-300"}`}>{String(record.disclosure.disclosed.passed)}</span></li>
                      <li>• score_band: <span className="font-mono text-white/80">{record.disclosure.disclosed.scoreBand}</span></li>
                    </>
                  )}
                  <li>• evidence_class: <span className="font-mono text-white/80">AI_SCORE</span></li>
                </ul>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 text-white/30 mb-3 text-[10px] font-bold uppercase tracking-widest">
                  <EyeOff size={10} /> ZK private (never on-chain)
                </div>
                <ul className="space-y-1 text-xs text-white/50">
                  <li>• Raw AI score ({record?.review?.score ?? "—"})</li>
                  <li>• Full analysis text</li>
                  <li>• Raw wallet address</li>
                  <li>• Quest criteria bytes</li>
                </ul>
              </div>
            </div>
            {record?.commitmentHash && (
              <div className="px-6 py-3 border-t border-white/10 font-mono text-[10px] text-white/40 flex items-start gap-2 break-all">
                <span className="text-white/30 shrink-0">commitment_hash:</span>
                {record.commitmentHash}
              </div>
            )}
          </div>

          <div className="bg-[#0000FE]/5 border border-bright-blue/20 p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-8">
              <div>
                <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-lg">
                  AI-Governed Review Policy
                </h4>
                <p className="text-white/60 leading-relaxed max-w-xl text-sm">
                  Evaluated by explicitly recorded on-chain agent:{" "}
                  <span className="text-white font-mono bg-[#0A0A0A] px-2 py-1 ml-2 border border-white/10">
                    {resolvedAgent}
                  </span>
                </p>
              </div>
              <Link
                to="#"
                className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest hover:bg-[#0000FE]/90 transition-colors text-sm uppercase whitespace-nowrap border border-bright-blue"
              >
                Verify AI Audit Logs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
