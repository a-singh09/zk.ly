import { useState, type FormEvent, type ReactNode } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin123";
const SESSION_KEY = "zkly_admin_auth";

export default function AdminGuard({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (authed) {
    return <>{children}</>;
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setAuthed(true);
      return;
    }

    setError(true);
    setInput("");
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-[#161616] border border-white/10 p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-bright-blue flex items-center justify-center">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-heading font-black text-xl uppercase tracking-widest text-white">
              Admin Access
            </h1>
            <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">
              zk.ly Creator Console
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  setError(false);
                }}
                autoFocus
                placeholder="Enter admin password"
                className="w-full bg-[#0A0A0A] border border-white/20 px-5 py-4 pr-12 outline-none focus:border-bright-blue font-mono text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {error && (
              <p className="mt-2 text-red-400 text-xs font-mono">
                Incorrect password.
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-bright-blue text-white font-bold uppercase tracking-widest hover:bg-bright-blue/80 transition-colors border border-bright-blue"
          >
            Enter Console
          </button>
        </form>
      </div>
    </div>
  );
}
