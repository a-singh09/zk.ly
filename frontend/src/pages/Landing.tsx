import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
import {
  truncateAddress,
  useMidnightWallet,
} from "../lib/MidnightWalletContext";

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const container = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const {
    isConnected,
    isConnecting,
    walletAddress,
    connectWallet,
    walletError,
    clearWalletError,
  } = useMidnightWallet();

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".hero-text", {
        y: 80,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      })
        .from(
          ".hero-sub",
          { y: 30, opacity: 0, duration: 0.8, ease: "power3.out" },
          "-=0.8",
        )
        .from(
          ".hero-actions",
          { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" },
          "-=0.5",
        );

      gsap.utils
        .toArray(".stark-card, .section-title, .footer-stark")
        .forEach((el: any) => {
          gsap.from(el, {
            scrollTrigger: {
              trigger: el,
              start: "top bottom-=100",
              toggleActions: "play none none reverse",
            },
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          });
        });
    },
    { scope: container },
  );

  const handleHeroMove = (event: React.MouseEvent<HTMLElement>) => {
    if (!headlineRef.current) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const rotateY = ((x / rect.width) * 2 - 1) * 5;
    const rotateX = -(((y / rect.height) * 2 - 1) * 3);

    gsap.to(headlineRef.current, {
      rotateY,
      rotateX,
      transformPerspective: 1200,
      transformOrigin: "center",
      duration: 0.25,
      ease: "power2.out",
    });
  };

  const handleHeroLeave = () => {
    if (!headlineRef.current) return;
    gsap.to(headlineRef.current, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.45,
      ease: "power3.out",
    });
  };

  return (
    <div ref={container} className="w-full min-h-screen bg-[#0A0A0A]">
      <header className="absolute top-0 w-full z-40 py-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
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
          <button
            onClick={() => {
              clearWalletError();
              void connectWallet();
            }}
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
        </div>
      </header>

      <section
        className="relative min-h-screen flex flex-col justify-center items-center px-6 pt-24 pb-12 overflow-hidden"
        onMouseMove={handleHeroMove}
        onMouseLeave={handleHeroLeave}
      >
        <div className="absolute top-0 right-0 w-1/3 h-full border-l border-white/5 opacity-50 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 border-t border-white/5 opacity-50 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/10 rotate-45 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-bright-blue/5 rotate-[60deg] pointer-events-none" />

        <div className="max-w-7xl mx-auto text-center relative z-10 w-full">
          <div className="mb-10 w-full flex justify-center">
            <div ref={headlineRef} className="will-change-transform">
              <h1 className="hero-text font-heading font-black leading-[0.95] tracking-tighter uppercase select-none drop-shadow-2xl flex flex-col items-center">
                <span className="block text-white text-3xl md:text-5xl lg:text-7xl opacity-80 mb-2">
                  QUESTS FOR REAL
                </span>
                <span className="block text-bright-blue text-5xl md:text-[80px] lg:text-[110px] xl:text-[130px] leading-[0.85]">
                  ZK ECOSYSTEMS
                  <span className="inline-block text-white/50 align-baseline ml-2">
                    .
                  </span>
                </span>
              </h1>
            </div>
          </div>

          <p className="hero-sub text-lg md:text-2xl text-white/60 mb-16 max-w-3xl mx-auto leading-relaxed font-light">
            The uncompromised quest network built on Midnight. Replace web2
            friction with zero-knowledge math, governed AI, and indisputable
            proof.
          </p>

          <div className="hero-actions flex flex-wrap justify-center gap-6">
            <Link
              to="/spaces"
              className="px-12 py-5 bg-bright-blue text-white font-bold tracking-[0.2em] uppercase hover:bg-transparent hover:text-bright-blue transition-colors border-2 border-bright-blue"
            >
              Start Claiming
            </Link>
            <a
              href="#how-it-works"
              className="px-12 py-5 bg-transparent text-white font-bold tracking-[0.2em] uppercase border-2 border-white/20 hover:border-white transition-colors"
            >
              How it works
            </a>
          </div>

          {walletError && (
            <div className="mx-auto mt-8 max-w-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm text-left">
              {walletError}
            </div>
          )}
        </div>
      </section>

      {/* How it works Section (New) */}
      <section
        id="how-it-works"
        className="py-32 relative border-t border-white/10 bg-[#161616]"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="section-title text-4xl md:text-6xl font-black font-heading uppercase text-center mb-24 tracking-tighter drop-shadow-2xl">
            The Verification Engine
          </h2>

          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 relative">
            <div className="hidden lg:block absolute top-[60px] left-[12%] right-[12%] h-[2px] bg-white/10 z-0"></div>

            {[
              {
                step: "01",
                title: "Complete",
                desc: "Finish a quest—like merging a PR or writing a thread.",
              },
              {
                step: "02",
                title: "Commit",
                desc: "Your browser submits evidence to your local proof server.",
              },
              {
                step: "03",
                title: "Zero-Knowledge",
                desc: "A cryptographic proof hashes your identity and evidence.",
              },
              {
                step: "04",
                title: "Issue",
                desc: "A certificate is minted on the Midnight Network.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="stark-card relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-32 h-32 bg-[#0A0A0A] border-4 border-[#232323] group-hover:border-bright-blue transition-colors duration-500 rounded-none flex items-center justify-center font-heading font-black text-5xl text-white/20 group-hover:text-white mb-8">
                  {f.step}
                </div>
                <h3 className="text-2xl font-bold font-heading uppercase tracking-widest mb-4">
                  {f.title}
                </h3>
                <p className="text-white/50 leading-relaxed px-4">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="architecture"
        className="py-32 relative border-y border-white/10 bg-[#0A0A0A]"
      >
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="section-title text-4xl md:text-6xl font-black font-heading uppercase text-left mb-16 tracking-tighter drop-shadow-2xl">
            Why zk.ly wins
          </h2>
          <div className="grid md:grid-cols-3 gap-0 border border-white/10">
            {[
              {
                title: "PRIVATE BY DESIGN",
                desc: "Quest rules and your aggregate XP live entirely in Midnight's private state. Disclose only your rank tier to protocols, not your full contribution history.",
                number: "01",
              },
              {
                title: "AI-GOVERNED SUBSYSTEM",
                desc: "Every AI evaluator is a registered agent with an immutable rubric and on-chain audit trail. No more black-box or biased rejections.",
                number: "02",
              },
              {
                title: "CRYPTOGRAPHIC PROOF",
                desc: "Git adapters verify merge SHAs. On-chain adapters prove actual transaction existence. You submit proof, we generate the math.",
                number: "03",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="stark-card bg-[#161616] p-12 lg:p-16 border-r border-b border-white/10 group hover:bg-bright-blue transition-colors duration-500"
              >
                <div className="text-5xl font-mono font-bold text-white/10 mb-10 group-hover:text-white/40 transition-colors">
                  {f.number}
                </div>
                <h3 className="text-2xl font-bold font-heading uppercase tracking-wide mb-6">
                  {f.title}
                </h3>
                <p className="text-white/60 leading-relaxed group-hover:text-white/90">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section (New) */}
      <section className="py-40 bg-bright-blue text-white text-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-[#0A0A0A]/20"
          style={{
            backgroundImage:
              "radial-gradient(circle at center, black 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <h2 className="section-title text-5xl md:text-7xl font-black font-heading uppercase tracking-tighter mb-8 drop-shadow-2xl">
            Stop farming. Start proving.
          </h2>
          <p className="text-xl md:text-2xl text-white/80 mb-12 font-light">
            Join the vanguard of the Midnight Network and establish your
            indisputable footprint.
          </p>
          <Link
            to="/spaces"
            className="inline-block px-14 py-6 bg-[#0A0A0A] text-white font-black tracking-[0.2em] uppercase hover:bg-white hover:text-[#0A0A0A] transition-colors border border-transparent hover:border-[#0A0A0A] text-lg shadow-2xl"
          >
            Launch Platform
          </Link>
        </div>
      </section>

      {/* Footer (New) */}
      <footer className="bg-[#0A0A0A] border-t border-white/10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="footer-stark flex flex-col md:flex-row justify-between mb-24 gap-12 border-b border-white/10 pb-20">
            <div className="max-w-xs">
              <div className="flex items-center border border-white/20 px-4 py-2 w-fit mb-8 bg-[#0A0A0A]">
                <span className="font-heading font-black text-2xl tracking-widest uppercase text-bright-blue">
                  ZK
                </span>
                <span className="font-heading font-black text-2xl tracking-widest uppercase text-white">
                  .LY
                </span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed mb-8 font-light">
                The single source of truth for protocol engagement. Verifiable
                credentials, strict privacy, infinite scale.
              </p>
            </div>

            <div className="flex flex-wrap gap-16 md:gap-32">
              <div>
                <h4 className="font-bold uppercase tracking-[0.2em] text-white/30 mb-8 text-xs">
                  Platform
                </h4>
                <ul className="space-y-5 text-sm font-bold tracking-wider">
                  <li>
                    <Link
                      to="/spaces"
                      className="hover:text-bright-blue transition-colors"
                    >
                      EXPLORE SPACES
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/leaderboard"
                      className="hover:text-bright-blue transition-colors"
                    >
                      LEADERBOARD
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/profile/me"
                      className="hover:text-bright-blue transition-colors"
                    >
                      MY PASSPORT
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="#"
                      className="hover:text-bright-blue transition-colors"
                    >
                      AI ECOSYSTEM
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold uppercase tracking-[0.2em] text-white/30 mb-8 text-xs">
                  Developers
                </h4>
                <ul className="space-y-5 text-sm font-bold tracking-wider">
                  <li>
                    <a
                      href="#"
                      className="hover:text-bright-blue transition-colors"
                    >
                      DOCUMENTATION
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-bright-blue transition-colors"
                    >
                      GITHUB REPO
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-bright-blue transition-colors"
                    >
                      COMPACT CONTRACTS
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-bright-blue transition-colors"
                    >
                      VALIDATOR NODES
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-white/30 uppercase tracking-widest font-mono">
            <p>
              &copy; 2026 ZK.LY Network. All Zero-Knowledge rights reserved.
            </p>
            <div className="flex gap-6 mt-6 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">
                Privacy
              </a>
              <a href="#" className="hover:text-white transition-colors">
                Terms of Spec
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
