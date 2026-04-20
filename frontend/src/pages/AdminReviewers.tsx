import { useEffect, useState } from "react";
import { Bot, Save, Shield } from "lucide-react";
import {
  getReviewerPolicies,
  updateReviewerPolicy,
  type ReviewerPolicyRecord,
} from "../lib/api";

export default function AdminReviewers() {
  const [policies, setPolicies] = useState<ReviewerPolicyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPolicies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getReviewerPolicies();
      setPolicies(response.items);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load reviewer policies",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
  }, []);

  const handleToggleActive = async (policy: ReviewerPolicyRecord) => {
    try {
      const updated = await updateReviewerPolicy(policy.id, {
        active: !policy.active,
      });
      setPolicies((previous) =>
        previous.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (toggleError) {
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Could not update policy",
      );
    }
  };

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">
            AI Reviewer Policies
          </h1>
        </div>
        <button
          onClick={() => void loadPolicies()}
          className="px-6 py-2 bg-bright-blue text-xs font-bold uppercase tracking-widest text-white hover:bg-transparent border border-bright-blue transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
            {error}
          </div>
        )}

        <div className="bg-[#161616] border border-white/10 overflow-x-auto">
          <div className="flex items-center justify-between p-8 border-b border-white/10 bg-[#0A0A0A]">
            <h2 className="text-xl font-heading font-bold uppercase tracking-widest">
              Registered Reviewer Agents
            </h2>
            <div className="text-xs uppercase tracking-widest text-white/40">
              {loading ? "Loading..." : `${policies.length} policies`}
            </div>
          </div>

          <table className="w-full text-left font-mono text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-widest">
                <th className="px-6 py-4">Agent ID</th>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Threshold</th>
                <th className="px-6 py-4">Tokens/Timeout</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {policies.map((policy) => (
                <tr
                  key={policy.id}
                  className="hover:bg-[#232323] transition-colors"
                >
                  <td className="px-6 py-5 text-white font-bold">
                    {policy.agentId}
                  </td>
                  <td className="px-6 py-5 text-white/70">{policy.model}</td>
                  <td className="px-6 py-5 text-white/70">
                    {policy.scoreThreshold}
                  </td>
                  <td className="px-6 py-5 text-white/70">
                    {policy.maxTokens} / {policy.timeoutMs}ms
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 border text-xs uppercase tracking-widest ${policy.active ? "border-emerald-400/40 text-emerald-300" : "border-white/20 text-white/50"}`}
                    >
                      {policy.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <button
                      onClick={() => void handleToggleActive(policy)}
                      className="px-4 py-2 border border-white/20 text-xs uppercase tracking-widest hover:border-bright-blue hover:text-bright-blue transition-colors flex items-center gap-2"
                    >
                      <Save size={13} />
                      Toggle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-[#0A0A0A] border border-bright-blue/30 p-8">
          <h3 className="flex items-center gap-3 text-lg font-bold font-heading uppercase tracking-widest mb-4 text-white">
            <Shield className="text-bright-blue" size={20} /> Operational Note
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">
            These reviewer policies are stored in a demo in-memory backend to
            unblock frontend and admin workflows. They are structured to map
            directly to persistent storage and on-chain policy commitments in
            the next phase.
          </p>
        </div>
      </div>
    </div>
  );
}
