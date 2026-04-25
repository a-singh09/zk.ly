import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Sparkles, Tag } from "lucide-react";

type AgentTemplate = {
  id: string;
  title: string;
  description: string;
  agentId: string;
  model: string;
  category: string;
  scoreThreshold: number;
  maxTokens: number;
  timeoutMs: number;
  retryLimit: number;
  config: {
    dimensions: Record<string, number>;
    steps: string[];
  };
  tags: string[];
};

export default function AiAgentsMarketplace() {
  const navigate = useNavigate();

  const templates = useMemo((): AgentTemplate[] => [
      {
        id: "web3-writing-pack-v1",
        title: "Web3 Writing Pack",
        description:
          "Optimized for technical blog/tutorial submissions: correctness, clarity, and actionable steps.",
        agentId: "web3-writing-pack-v1",
        model: "gpt-4.1-mini",
        category: "technical",
        scoreThreshold: 70,
        maxTokens: 8000,
        timeoutMs: 12000,
        retryLimit: 1,
        config: {
          dimensions: {
            technicalDepth: 0.35,
            factualAccuracy: 0.35,
            clarity: 0.2,
            originality: 0.1,
          },
          steps: [
            "Explain the concept clearly with correct terminology.",
            "Include at least one runnable or verifiable example.",
            "Call out assumptions and prerequisites.",
            "Conclude with a short checklist or summary.",
          ],
        },
        tags: ["writing", "technical", "web3"],
      },
      {
        id: "ai-agents-writing-pack-v1",
        title: "AI Agents Writing Pack",
        description:
          "For content about agent design: tools, evaluation criteria, safety boundaries, and reproducibility.",
        agentId: "ai-agents-writing-pack-v1",
        model: "gpt-4.1-mini",
        category: "technical",
        scoreThreshold: 72,
        maxTokens: 8000,
        timeoutMs: 12000,
        retryLimit: 1,
        config: {
          dimensions: {
            technicalDepth: 0.4,
            factualAccuracy: 0.3,
            clarity: 0.2,
            originality: 0.1,
          },
          steps: [
            "Describe the agent objective and constraints clearly.",
            "List tools/data sources used (if any) and why.",
            "Explain how success is measured (metrics or rubric).",
            "Include edge cases and failure modes.",
          ],
        },
        tags: ["writing", "agents", "evaluation"],
      },
      {
        id: "social-signal-pack-v1",
        title: "Social Signal Pack",
        description:
          "For social posts: signal-to-noise, originality, and concrete evidence of work.",
        agentId: "social-signal-pack-v1",
        model: "gpt-4o-mini",
        category: "community",
        scoreThreshold: 65,
        maxTokens: 4000,
        timeoutMs: 9000,
        retryLimit: 1,
        config: {
          dimensions: {
            clarity: 0.35,
            factualAccuracy: 0.25,
            originality: 0.25,
            technicalDepth: 0.15,
          },
          steps: [
            "Avoid fluff; include a concrete claim or takeaway.",
            "Reference evidence (link/screenshot/code snippet) where relevant.",
            "Keep it structured (bullets/sections).",
          ],
        },
        tags: ["social", "community"],
      },
      {
        id: "github-pr-review-pack-v1",
        title: "GitHub PR Review Pack",
        description:
          "Reviews pull requests for correctness, test coverage, risk, and maintainability. Produces actionable change requests.",
        agentId: "github-pr-review-pack-v1",
        model: "gpt-4.1",
        category: "engineering",
        scoreThreshold: 75,
        maxTokens: 9000,
        timeoutMs: 14000,
        retryLimit: 1,
        config: {
          dimensions: {
            correctness: 0.35,
            testCoverage: 0.2,
            maintainability: 0.2,
            security: 0.15,
            clarity: 0.1,
          },
          steps: [
            "Summarize what changed and why it matters (1-3 bullets).",
            "Flag correctness issues and edge cases; include file/line references if provided.",
            "Assess tests: missing coverage, brittle tests, or incorrect assertions.",
            "Identify security and data-handling concerns (injection, auth, secrets, logging).",
            "Suggest refactors for readability and maintainability (naming, separation, complexity).",
            "Provide a final decision: APPROVE / REQUEST_CHANGES / COMMENT_ONLY with rationale.",
          ],
        },
        tags: ["github", "pr", "review", "engineering"],
      },
      {
        id: "technical-docs-quality-pack-v1",
        title: "Technical Docs Quality Pack",
        description:
          "Grades documentation for clarity, completeness, and reproducibility. Great for README, runbooks, and onboarding docs.",
        agentId: "technical-docs-quality-pack-v1",
        model: "gpt-4.1-mini",
        category: "docs",
        scoreThreshold: 70,
        maxTokens: 8000,
        timeoutMs: 12000,
        retryLimit: 1,
        config: {
          dimensions: {
            clarity: 0.3,
            completeness: 0.3,
            reproducibility: 0.25,
            factualAccuracy: 0.15,
          },
          steps: [
            "Check for a clear purpose statement and intended audience.",
            "Verify setup steps are complete: prerequisites, install, config, and run commands.",
            "Validate examples: are they copy-pastable and consistent with the text?",
            "Look for missing sections: troubleshooting, FAQ, common errors, or limitations.",
            "Call out ambiguous terms and suggest precise replacements.",
            "Return a prioritized list of doc fixes (P0/P1/P2).",
          ],
        },
        tags: ["docs", "readme", "runbook", "onboarding"],
      },
      {
        id: "api-contract-compliance-pack-v1",
        title: "API Contract Compliance Pack",
        description:
          "Checks that an implementation matches an API contract (OpenAPI-style expectations). Focuses on inputs, outputs, errors, and pagination.",
        agentId: "api-contract-compliance-pack-v1",
        model: "gpt-4.1",
        category: "backend",
        scoreThreshold: 78,
        maxTokens: 9000,
        timeoutMs: 14000,
        retryLimit: 1,
        config: {
          dimensions: {
            correctness: 0.35,
            errorHandling: 0.25,
            backwardsCompatibility: 0.2,
            clarity: 0.1,
            security: 0.1,
          },
          steps: [
            "List the endpoints touched and expected request/response shapes.",
            "Verify status codes and error payloads are consistent and documented.",
            "Check input validation rules (types, required fields, bounds).",
            "Confirm pagination/sorting/filtering behavior where applicable.",
            "Flag breaking changes and suggest safe migration patterns.",
            "Summarize compliance risks and required fixes.",
          ],
        },
        tags: ["api", "contract", "backend", "openapi"],
      },
      {
        id: "security-audit-lite-pack-v1",
        title: "Security Audit (Lite) Pack",
        description:
          "A lightweight security pass: secrets, authz/authn, injection risks, unsafe deserialization, and logging/PII checks.",
        agentId: "security-audit-lite-pack-v1",
        model: "gpt-4.1",
        category: "security",
        scoreThreshold: 80,
        maxTokens: 9000,
        timeoutMs: 14000,
        retryLimit: 1,
        config: {
          dimensions: {
            security: 0.5,
            correctness: 0.2,
            errorHandling: 0.15,
            clarity: 0.15,
          },
          steps: [
            "Search for secret exposure patterns (tokens, keys, env dumps, debug prints).",
            "Check authentication and authorization: role checks, IDOR, privilege escalation.",
            "Identify injection vectors (SQL/NoSQL/template/command) and escaping issues.",
            "Review file/network operations for unsafe inputs and path traversal.",
            "Review logging/telemetry for PII leakage and overly verbose error messages.",
            "Output: top risks + concrete remediation steps.",
          ],
        },
        tags: ["security", "audit", "risk"],
      },
      {
        id: "architecture-rfc-review-pack-v1",
        title: "Architecture RFC Review Pack",
        description:
          "Reviews technical design docs for trade-offs, feasibility, failure modes, and rollout plan. Perfect for proposals and ADRs.",
        agentId: "architecture-rfc-review-pack-v1",
        model: "claude-4.6-sonnet-medium-thinking",
        category: "architecture",
        scoreThreshold: 75,
        maxTokens: 9000,
        timeoutMs: 16000,
        retryLimit: 1,
        config: {
          dimensions: {
            clarity: 0.2,
            feasibility: 0.25,
            risk: 0.25,
            completeness: 0.2,
            originality: 0.1,
          },
          steps: [
            "Summarize the proposal and success criteria.",
            "Evaluate trade-offs vs at least 2 alternatives.",
            "List operational concerns: monitoring, SLOs, scaling, cost, and failure modes.",
            "Check data model and migration/rollout plan (backward compatibility).",
            "Identify missing decisions and open questions.",
            "Return a decision recommendation: ACCEPT / REVISE / REJECT with rationale.",
          ],
        },
        tags: ["architecture", "rfc", "design", "adr"],
      },
    ],
    [],
  );

  const handleUseTemplate = (t: AgentTemplate) => {
    navigate("/admin", {
      state: {
        activeTab: "AI Agents",
        aiAgentTemplate: {
          agentId: t.agentId,
          model: t.model,
          category: t.category,
          scoreThreshold: String(t.scoreThreshold),
          maxTokens: String(t.maxTokens),
          timeoutMs: String(t.timeoutMs),
          retryLimit: String(t.retryLimit),
          configJson: JSON.stringify(t.config, null, 2),
        },
      },
    });
  };

  return (
    <div className="w-full">
      <div className="h-24 border-b border-white/10 bg-[#161616] flex items-center px-12 justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-bright-blue hover:text-bright-blue/80"
          >
            <ArrowLeft size={20} />
            Back
          </button>
          <h1 className="font-heading font-black text-3xl uppercase tracking-widest text-white">
            AI Agents Marketplace
          </h1>
        </div>
        <div className="text-xs uppercase tracking-widest text-white/50">
          Import a template into your admin console
        </div>
      </div>

      <div className="p-8 lg:p-12 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="border border-white/10 bg-[#161616] p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-white/70 text-xs uppercase tracking-widest mb-2">
                    <Sparkles size={14} className="text-bright-blue" />
                    Template
                  </div>
                  <h2 className="text-lg font-bold text-white">{t.title}</h2>
                </div>
                <div className="text-[10px] uppercase tracking-widest border border-white/10 bg-[#0A0A0A] px-2 py-1 text-white/50">
                  {t.model}
                </div>
              </div>

              <p className="text-sm text-white/60 leading-relaxed mb-4">
                {t.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                {t.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[10px] uppercase tracking-widest border border-white/10 bg-[#0A0A0A] px-2 py-1 text-white/40 flex items-center gap-1"
                  >
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto flex gap-3">
                <button
                  onClick={() => handleUseTemplate(t)}
                  className="flex-1 px-4 py-3 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-bright-blue/90 transition-colors border border-bright-blue text-xs flex items-center justify-center gap-2"
                >
                  <Download size={14} />
                  Use template
                </button>
                <button
                  onClick={() =>
                    navigator.clipboard?.writeText(JSON.stringify(t.config, null, 2))
                  }
                  className="px-4 py-3 border border-white/20 text-white/70 font-bold tracking-widest uppercase hover:border-white transition-colors text-xs"
                  title="Copy config JSON"
                >
                  Copy JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

