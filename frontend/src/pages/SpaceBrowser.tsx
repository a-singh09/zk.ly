import { Link } from "react-router-dom";
import { Search, Filter, ShieldCheck, Users, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getSpaces, type SpaceRecord } from "../lib/api";

export default function SpaceBrowser() {
  const [spaces, setSpaces] = useState<SpaceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadSpaces = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getSpaces();
        if (!cancelled) {
          setSpaces(response.items);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load spaces",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSpaces();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredSpaces = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return spaces;
    return spaces.filter((space) =>
      `${space.name} ${space.desc}`.toLowerCase().includes(normalized),
    );
  }, [query, spaces]);

  return (
    <div className="w-full p-8 lg:p-12 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 pb-8 border-b border-white/10">
        <div>
          <h1 className="text-4xl lg:text-5xl font-bold font-heading uppercase mb-4 tracking-tighter">
            Explore Spaces
          </h1>
          <p className="text-white/50 text-lg max-w-xl">
            Find communities utilizing cryptographic verifiable quests. Engage
            with pure privacy.
          </p>
        </div>

        <div className="flex gap-4 w-full md:w-auto mt-6 md:mt-0">
          <div className="relative flex-1 md:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              size={20}
            />
            <input
              type="text"
              placeholder="SEARCH..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-[#161616] border border-white/20 py-4 pl-12 pr-4 outline-none focus:border-bright-blue transition-colors font-mono uppercase tracking-widest text-xs"
            />
          </div>
          <button className="bg-[#161616] border border-white/20 px-8 py-4 flex items-center justify-center gap-3 hover:border-white transition-colors text-xs font-bold tracking-widest uppercase">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="border border-white/10 bg-[#161616] p-10 flex items-center justify-center gap-3 text-white/60 uppercase tracking-widest text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading spaces...
        </div>
      ) : error ? (
        <div className="border border-red-500/30 bg-red-500/10 text-red-200 px-5 py-4 text-sm">
          {error}
        </div>
      ) : filteredSpaces.length === 0 ? (
        <div className="border border-white/10 bg-[#161616] p-10 text-white/60 text-sm">
          No spaces found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map((space) => (
            <Link
              key={space.id}
              to={`/spaces/${space.id}`}
              className="bg-[#161616] p-10 hover:bg-[#232323] transition-all group border border-white/10 hover:border-bright-blue/50 flex flex-col justify-between min-h-[320px]"
            >
              <div>
                <div className="w-16 h-16 bg-[#0A0A0A] border border-white/10 flex items-center justify-center mb-8">
                  <ShieldCheck className="text-bright-blue" size={32} />
                </div>
                <h3 className="text-2xl font-bold mb-4 font-heading uppercase tracking-wide group-hover:text-bright-blue transition-colors">
                  {space.name}
                </h3>
                <p className="text-white/60 mb-8 leading-relaxed line-clamp-3">
                  {space.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-white/50 font-sans tracking-widest uppercase mt-4">
                <span className="flex items-center gap-2 border border-white/10 px-4 py-2 bg-[#0A0A0A]">
                  <Users size={14} /> {space.members}
                </span>
                <span className="border border-white/10 px-4 py-2 bg-[#0A0A0A]">
                  {space.quests} Quests
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
