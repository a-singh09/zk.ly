import { Settings, Plus, Network, Layers, Upload, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createSpace,
  getAdminDisclosures,
  getAdminSubmissions,
  confirmSubmissions,
  getSpaces,
  type DisclosureRecord,
  type SpaceRecord,
  type SubmissionRecord,
} from "../lib/api";
import { useMidnightWallet } from "../lib/MidnightWalletContext";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("Submissions");
  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [disclosures, setDisclosures] = useState<DisclosureRecord[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [overrides, setOverrides] = useState<Record<string, boolean | null>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [spaceName, setSpaceName] = useState("");
  const [spaceDesc, setSpaceDesc] = useState("");
  const [savingSpace, setSavingSpace] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminMessage, setAdminMessage] = useState<string | null>(null);
  const { walletAddress } = useMidnightWallet();

  const loadAdminData = async () => {
    try {
      const [spaceResponse, disclosureResponse, submissionsResponse] = await Promise.all([
        getSpaces(),
        getAdminDisclosures(),
        getAdminSubmissions(),
      ]);
      setSpaces(spaceResponse.items);
      setDisclosures(disclosureResponse.items);
      setSubmissions(submissionsResponse.items);
    } catch {
      // Keep page usable when API is unavailable.
    }
  };

  useEffect(() => {
    void loadAdminData();
  }, []);

  const effectiveDecision = (s: SubmissionRecord): boolean => {
    const override = overrides[s.submissionId];
    if (override !== undefined && override !== null) return override;
    return s.aiPassed;
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === submissions.length) setSelected(new Set());
    else setSelected(new Set(submissions.map((s) => s.submissionId)));
  };

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setAdminError(null);
    setConfirming(true);
    try {
      const decisions = Array.from(selected).map((id) => {
        const sub = submissions.find((s) => s.submissionId === id)!;
        return { submissionId: id, approved: effectiveDecision(sub) };
      });
      await confirmSubmissions(decisions);
      setAdminMessage(`${decisions.length} submission(s) confirmed. Wallet addresses stored for disbursement.`);
      setSelected(new Set());
      void loadAdminData();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : "Confirm failed");
    } finally {
      setConfirming(false);
    }
  };

  const handleCreateSpace = async () => {
    setAdminError(null);
    setAdminMessage(null);

    if (!spaceName.trim() || !spaceDesc.trim()) {
      setAdminError("Space name and description are required.");
      return;
    }

    setSavingSpace(true);
    try {
      const created = await createSpace({
        name: spaceName.trim(),
        desc: spaceDesc.trim(),
        creatorWallet: walletAddress ?? undefined,
      });

      setSpaces((previous) => [created, ...previous]);
      setSpaceName("");
      setSpaceDesc("");
      setAdminMessage("Space created successfully.");
      setActiveTab("Spaces");
    } catch (error) {
      setAdminError(
        error instanceof Error ? error.message : "Could not create space",
      );
    } finally {
      setSavingSpace(false);
    }
  };

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
            <Settings className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">
            Creator Console
          </h1>
        </div>
        <button
          onClick={() => setActiveTab("Spaces")}
          className="px-6 py-3 bg-[#0A0A0A] border border-white/20 text-white font-bold tracking-widest uppercase hover:border-bright-blue transition-colors text-sm flex items-center gap-3"
        >
          <Plus size={18} /> New Space
        </button>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-4 mb-12">
          {["Submissions", "Spaces", "Disclosures", "Quest Builder"].map(
            (t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-8 py-4 text-sm font-bold uppercase tracking-[0.2em] transition-all border ${
                  activeTab === t
                    ? "bg-bright-blue border-bright-blue text-white"
                    : "bg-[#161616] border-white/10 text-white/50 hover:bg-[#232323] hover:text-white"
                }`}
              >
                {t}
                {t === "Submissions" && submissions.length > 0 && (
                  <span className="ml-2 bg-white/20 text-white text-xs px-2 py-0.5">
                    {submissions.length}
                  </span>
                )}
              </button>
            ),
          )}
        </div>

        {adminError && (
          <div className="mb-8 border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
            {adminError}
          </div>
        )}
        {adminMessage && (
          <div className="mb-8 border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 px-5 py-4 text-sm">
            {adminMessage}
          </div>
        )}

        {activeTab === "Submissions" && (
          <div className="space-y-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={selectAll}
                  className="px-5 py-3 border border-white/20 text-xs font-bold uppercase tracking-widest hover:border-bright-blue hover:text-bright-blue transition-colors"
                >
                  {selected.size === submissions.length && submissions.length > 0 ? "Deselect All" : "Select All"}
                </button>
                <span className="text-white/40 text-sm font-mono">
                  {selected.size} selected
                </span>
              </div>
              <button
                onClick={handleConfirm}
                disabled={selected.size === 0 || confirming}
                className="px-8 py-3 bg-bright-blue text-white font-bold uppercase tracking-widest hover:bg-bright-blue/80 transition-colors border border-bright-blue disabled:opacity-40 disabled:cursor-not-allowed text-sm"
              >
                {confirming ? "Confirming..." : `Confirm ${selected.size > 0 ? `(${selected.size})` : ""} & Store Wallets`}
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="bg-[#161616] border border-white/10 p-16 text-center">
                <AlertCircle className="mx-auto text-white/20 mb-4" size={40} />
                <p className="text-white/40 text-sm">No submissions yet. Users submit dev.to articles via the Quest Claim page.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub) => {
                  const isSelected = selected.has(sub.submissionId);
                  const override = overrides[sub.submissionId];
                  const decision = effectiveDecision(sub);
                  const isOverridden = override !== undefined && override !== null;

                  return (
                    <div
                      key={sub.submissionId}
                      className={`bg-[#161616] border p-6 transition-colors ${
                        isSelected ? "border-bright-blue" : "border-white/10"
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleSelect(sub.submissionId)}
                          className={`mt-1 w-5 h-5 border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                            isSelected ? "border-bright-blue bg-bright-blue" : "border-white/30 hover:border-bright-blue"
                          }`}
                        >
                          {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                        </button>

                        <div className="flex-1 min-w-0">
                          {/* Article URL */}
                          <a
                            href={sub.artifactUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-bright-blue font-mono text-sm hover:underline break-all"
                          >
                            {sub.artifactUrl}
                          </a>

                          {/* Meta row */}
                          <div className="flex flex-wrap gap-3 mt-3 text-xs font-mono text-white/50">
                            <span>Wallet: {sub.walletHint}</span>
                            <span>·</span>
                            <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                            <span>·</span>
                            <span>Score: <strong className="text-white">{sub.score}</strong>/{sub.threshold}</span>
                            <span>·</span>
                            <span>Band: <strong className="text-white">{sub.scoreBand}</strong></span>
                          </div>

                          {/* Summary + notes */}
                          <p className="mt-3 text-white/60 text-sm leading-6">{sub.summary}</p>
                          {sub.reviewerNotes && (
                            <p className="mt-1 text-white/40 text-xs italic leading-5">{sub.reviewerNotes}</p>
                          )}

                          {/* Breakdown */}
                          <div className="grid grid-cols-4 gap-2 mt-4">
                            {Object.entries(sub.breakdown).map(([key, val]) => (
                              <div key={key} className="bg-[#0A0A0A] border border-white/10 p-3 text-center">
                                <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{key}</div>
                                <div className="font-bold text-white">{val}</div>
                              </div>
                            ))}
                          </div>

                          {/* Wallet address for disbursement */}
                          <div className="mt-4 bg-[#0A0A0A] border border-white/10 p-3">
                            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Wallet Address (for disbursement)</div>
                            <div className="font-mono text-xs text-white/70 break-all">{sub.walletAddress}</div>
                          </div>
                        </div>

                        {/* Decision panel */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-3">
                          {/* AI badge */}
                          <div className={`flex items-center gap-2 px-3 py-1.5 border text-xs font-bold uppercase tracking-widest ${
                            sub.aiPassed
                              ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                              : "border-amber-500/40 text-amber-400 bg-amber-500/10"
                          }`}>
                            {sub.aiPassed ? <CheckCircle size={14} /> : <XCircle size={14} />}
                            AI: {sub.aiPassed ? "Pass" : "Fail"}
                          </div>

                          {/* Admin override */}
                          <div className="flex flex-col gap-1 text-xs">
                            <span className="text-white/30 uppercase tracking-widest text-[10px]">Admin</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setOverrides((p) => ({ ...p, [sub.submissionId]: true }))}
                                className={`px-3 py-1.5 border font-bold uppercase tracking-widest transition-colors ${
                                  override === true
                                    ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                                    : "border-white/20 text-white/40 hover:border-emerald-500 hover:text-emerald-400"
                                }`}
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => setOverrides((p) => ({ ...p, [sub.submissionId]: false }))}
                                className={`px-3 py-1.5 border font-bold uppercase tracking-widest transition-colors ${
                                  override === false
                                    ? "border-red-500 bg-red-500/20 text-red-400"
                                    : "border-white/20 text-white/40 hover:border-red-500 hover:text-red-400"
                                }`}
                              >
                                Reject
                              </button>
                              {isOverridden && (
                                <button
                                  onClick={() => setOverrides((p) => { const n = {...p}; delete n[sub.submissionId]; return n; })}
                                  className="px-3 py-1.5 border border-white/20 text-white/30 hover:text-white hover:border-white/40 uppercase text-[10px] tracking-widest transition-colors"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Final decision badge */}
                          <div className={`flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold ${
                            decision ? "text-emerald-400" : "text-red-400"
                          }`}>
                            {isOverridden && <span className="text-white/30">Override →</span>}
                            {decision ? "Will Approve" : "Will Reject"}
                          </div>

                          {sub.confirmed && (
                            <div className="text-[10px] uppercase tracking-widest text-bright-blue font-bold">
                              ✓ Confirmed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "Spaces" && (
          <div className="space-y-6">
            <div className="bg-[#161616] border border-white/10 p-8">
              <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-6 text-white flex items-center gap-3">
                <Plus className="text-bright-blue" /> Create New Space
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                    Space Name
                  </label>
                  <input
                    value={spaceName}
                    onChange={(event) => setSpaceName(event.target.value)}
                    type="text"
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white"
                    placeholder="E.g. Midnight Content Guild"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                    Creator Wallet
                  </label>
                  <div className="w-full bg-[#0A0A0A] border border-white/10 p-4 font-mono text-sm text-white/80 break-all">
                    {walletAddress ??
                      "Connect wallet from sidebar to attach creator identity"}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                  Description
                </label>
                <textarea
                  value={spaceDesc}
                  onChange={(event) => setSpaceDesc(event.target.value)}
                  rows={4}
                  className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white resize-none"
                  placeholder="Describe what this space validates and rewards."
                />
              </div>
              <button
                onClick={handleCreateSpace}
                disabled={savingSpace}
                className="mt-6 px-8 py-4 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-[#0000FE]/90 transition-colors border border-bright-blue disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {savingSpace ? "Creating Space..." : "Create Space"}
              </button>
            </div>

            <div className="bg-[#161616] border border-white/10 p-10">
              <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-8 text-white flex items-center gap-3">
                <Layers className="text-bright-blue" /> Active Protocol Spaces
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spaces.map((space) => (
                  <div
                    key={space.id}
                    className="bg-[#0A0A0A] border border-white/10 p-8 hover:border-bright-blue transition-colors group"
                  >
                    <h3 className="text-2xl font-bold font-heading uppercase mb-2 group-hover:text-bright-blue transition-colors">
                      {space.name}
                    </h3>
                    <p className="text-white/60 mb-6 leading-relaxed">
                      {space.desc}
                    </p>
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-2xl font-black text-white">
                          {space.quests}
                        </div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                          Quests
                        </div>
                      </div>
                      <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-2xl font-black text-white">
                          {space.members}
                        </div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                          Members
                        </div>
                      </div>
                      <div className="border border-white/10 p-4 text-center bg-[#161616]">
                        <div className="text-sm font-black text-white break-all">
                          {space.id}
                        </div>
                        <div className="text-[10px] text-white/50 uppercase tracking-widest mt-1">
                          Space ID
                        </div>
                      </div>
                    </div>
                    <button className="w-full py-4 text-center border-2 border-white/10 text-white font-bold tracking-widest uppercase hover:border-white transition-colors text-xs">
                      Manage Space
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "Disclosures" && (
          <div className="bg-[#161616] border border-white/10 p-10">
            <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-8 text-white flex items-center gap-3">
              <Network className="text-bright-blue" /> Admin Disclosure
              Verifications
            </h2>
            {disclosures.length === 0 ? (
              <p className="text-white/50 text-sm leading-7">
                No disclosed verification records yet. Submit a dev.to quest and
                authorize commitment to populate this table.
              </p>
            ) : (
              <div className="space-y-5">
                {disclosures.map((item) => (
                  <div
                    key={item.certificateId}
                    className="border border-white/10 bg-[#0A0A0A] p-6"
                  >
                    <div className="grid lg:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                          Artifact URL
                        </div>
                        <p className="font-mono text-xs text-white/80 break-all">
                          {item.artifactUrl}
                        </p>
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                          Certificate ID
                        </div>
                        <p className="font-mono text-xs text-white/80 break-all">
                          {item.certificateId}
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 mt-5">
                      <div className="border border-white/10 bg-[#121212] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Space
                        </div>
                        <div className="font-mono text-xs text-white/80">
                          {item.spaceId}
                        </div>
                      </div>
                      <div className="border border-white/10 bg-[#121212] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Quest
                        </div>
                        <div className="font-mono text-xs text-white/80">
                          {item.questId}
                        </div>
                      </div>
                      <div className="border border-white/10 bg-[#121212] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Disclosed Score Band
                        </div>
                        <div className="font-bold text-white">
                          {item.disclosed.scoreBand}
                        </div>
                      </div>
                      <div className="border border-white/10 bg-[#121212] p-4">
                        <div className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                          Disclosed Status
                        </div>
                        <div
                          className={
                            item.disclosed.passed
                              ? "font-bold text-emerald-400"
                              : "font-bold text-amber-400"
                          }
                        >
                          {item.disclosed.passed ? "Passed" : "Needs revision"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "Quest Builder" && (
          <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
            <div className="bg-[#161616] border border-white/10 p-10">
              <h2 className="text-xl font-bold font-heading uppercase tracking-widest mb-8 text-white">
                Configure New Quest
              </h2>
              <div className="space-y-8">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                    Quest Title
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white"
                    placeholder="E.g. Submit a PR to docs/tutorials"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                      XP Bounty
                    </label>
                    <input
                      type="number"
                      className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white text-xl"
                      defaultValue="200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
                      Frequency Gate
                    </label>
                    <select className="w-full bg-[#0A0A0A] border border-white/10 p-4 outline-none focus:border-bright-blue font-mono text-white appearance-none">
                      <option>One-Time</option>
                      <option>Daily</option>
                      <option>Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-8">
                  <h3 className="text-sm font-bold font-heading uppercase tracking-widest mb-6 text-white">
                    Private Acceptance Criteria
                  </h3>
                  <p className="text-white/40 text-sm mb-6 max-w-xl">
                    Criteria bytes are sent directly to Midnight's private
                    ledger state. Only the immutable commitment hash survives
                    on-chain.
                  </p>
                  <div className="w-full border-2 border-dashed border-white/20 p-12 flex flex-col items-center justify-center bg-[#0A0A0A] hover:bg-[#121212] transition-colors cursor-pointer group">
                    <Upload
                      size={32}
                      className="text-white/30 group-hover:text-bright-blue mb-4 transition-colors"
                    />
                    <div className="font-bold text-white uppercase tracking-widest mb-2">
                      Upload Rubric File
                    </div>
                    <div className="text-white/40 text-xs font-mono">
                      Supported: .json, .md, .txt (Max 256 bytes)
                    </div>
                  </div>
                </div>

                <button className="w-full py-5 bg-bright-blue text-white font-bold uppercase tracking-widest hover:bg-transparent border border-bright-blue transition-colors text-lg">
                  Build & Commit to Chain
                </button>
              </div>
            </div>

            <div className="bg-[#0A0A0A] border border-white/10 p-10 h-fit">
              <h3 className="font-bold uppercase tracking-widest mb-6 pb-4 border-b border-white/10 flex items-center gap-3">
                <Network className="text-bright-blue" size={20} /> Circuit
                Checks
              </h3>
              <ul className="space-y-6 text-sm text-white/50 font-mono">
                <li>
                  <strong className="text-white block mb-1">CHECK 1:</strong>{" "}
                  Criteria signature matches private persistence state
                </li>
                <li>
                  <strong className="text-white block mb-1">CHECK 2:</strong>{" "}
                  Provided evidence passes requested AI/Git Adapter
                </li>
                <li>
                  <strong className="text-white block mb-1">CHECK 3:</strong>{" "}
                  Evaluated score supersedes defined threshold boundary
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
