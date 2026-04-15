import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckSquare, ShieldCheck, Share, ExternalLink } from 'lucide-react';

export default function CertExplorer() {
  const { certId } = useParams();

  return (
    <div className="w-full">
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8 justify-between">
        <Link to="/profile/me" className="flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest">
          <ArrowLeft size={16} /> BACK TO PROFILE
        </Link>
        <div className="text-sm font-mono text-bright-blue tracking-widest uppercase font-bold">Mainnet Verification</div>
      </div>
      
      <div className="p-8 max-w-5xl mx-auto mt-8">
        
        <div className="bg-[#161616] p-10 md:p-14 border border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-10 mb-10">
            <div className="flex items-center gap-6 mb-8 md:mb-0">
              <div className="w-20 h-20 bg-bright-blue flex items-center justify-center">
                <CheckSquare className="text-white" size={40} />
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold font-heading uppercase tracking-tighter text-white">Verified Certificate</h1>
                <p className="text-white/50 font-mono mt-3 uppercase tracking-widest text-sm">ID: {certId}</p>
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
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">Quest Initiated</h3>
                <p className="text-xl font-heading font-bold tracking-wide">Publish a technical blog/tutorial</p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">Space / Sprint</h3>
                <p className="text-xl font-heading font-bold tracking-wide">Midnight Fellowship · Q2 Sprint</p>
              </div>
              <div>
                <h3 className="text-white/40 text-xs uppercase tracking-[0.2em] font-bold mb-3">Rewards Allocated</h3>
                <p className="text-2xl font-bold text-bright-blue flex items-center gap-3">
                   250 XP
                   <span className="text-xs font-bold bg-[#0A0A0A] border border-white/10 text-white/50 px-3 py-1">IN PRIVATE STATE</span>
                </p>
              </div>
            </div>
            
            <div className="bg-[#0A0A0A] p-8 border border-white/10">
              <h3 className="font-bold uppercase tracking-widest mb-8 flex items-center gap-3 pb-4 border-b border-white/10">
                <ShieldCheck className="text-bright-blue" size={24} />
                Cryptographic Proofs
              </h3>
              <ul className="space-y-6 text-sm text-white/70 font-mono">
                <li className="flex items-start gap-4">
                  <CheckSquare size={20} className="text-bright-blue shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">Quest acceptance criteria were not modified</span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare size={20} className="text-bright-blue shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">Evidence matches required type (AI_SCORE)</span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare size={20} className="text-bright-blue shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">AI quality score met the private threshold</span>
                </li>
                <li className="flex items-start gap-4">
                  <CheckSquare size={20} className="text-bright-blue shrink-0 mt-0.5" /> 
                  <span className="leading-relaxed">Cryptographically bound to the completer</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-[#0000FE]/5 border border-bright-blue/20 p-8">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-8">
              <div>
                <h4 className="font-bold text-white mb-3 uppercase tracking-widest text-lg">AI-Governed Review Policy</h4>
                <p className="text-white/60 leading-relaxed max-w-xl text-sm">Evaluated by explicitly recorded on-chain agent: <span className="text-white font-mono bg-[#0A0A0A] px-2 py-1 ml-2 border border-white/10">zkquest-educator-v1</span></p>
              </div>
              <Link to="#" className="px-8 py-4 bg-bright-blue text-white font-bold tracking-widest hover:bg-[#0000FE]/90 transition-colors text-sm uppercase whitespace-nowrap border border-bright-blue">
                Verify AI Audit Logs
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
