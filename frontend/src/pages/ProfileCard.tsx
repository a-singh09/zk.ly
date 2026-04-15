import { ShieldAlert, Award, Grid } from 'lucide-react';

export default function ProfileCard() {
  return (
    <div className="w-full p-8 max-w-5xl mx-auto mt-12">
      <div className="bg-[#161616] p-12 lg:p-16 border border-white/10">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-12 pb-12 mb-12 border-b border-white/10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="w-40 h-40 bg-[#0A0A0A] border-4 border-[#C0C0C0] flex items-center justify-center">
              <span className="text-6xl tracking-tighter filter grayscale font-heading font-black text-white/50">MM</span>
            </div>
            <div className="text-center md:text-left mt-4">
              <h1 className="text-3xl md:text-5xl font-bold font-mono tracking-tighter mb-4 text-white">0x7f3e...8a9b</h1>
              <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#C0C0C0]/10 text-[#C0C0C0] border border-[#C0C0C0]/30 font-bold tracking-[0.2em] uppercase text-sm mb-6">
                <ShieldAlert size={18} /> ARCHITECT TIER
              </div>
              <p className="text-white/40 text-sm uppercase tracking-widest font-mono">Verified since April 2026</p>
            </div>
          </div>

          <button className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest uppercase text-sm border border-bright-blue hover:bg-transparent transition-colors">
            Prove My Rank
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#0A0A0A] p-10 border border-white/10 flex flex-col items-center justify-center">
            <Award className="mb-6 text-bright-blue" size={40} />
            <div className="text-6xl font-black font-heading tracking-tighter mb-4">71</div>
            <div className="text-white/40 text-sm uppercase tracking-[0.2em] font-bold">Verified Quests</div>
          </div>
          <div className="bg-[#0A0A0A] p-10 border border-white/10 flex flex-col items-center justify-center">
            <Grid className="mb-6 text-bright-blue" size={40} />
            <div className="text-6xl font-black font-heading tracking-tighter mb-4">3</div>
            <div className="text-white/40 text-sm uppercase tracking-[0.2em] font-bold">Active Spaces</div>
          </div>
        </div>

      </div>
    </div>
  );
}
