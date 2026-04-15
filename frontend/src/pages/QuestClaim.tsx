import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitMerge, FileCheck } from 'lucide-react';
import { useNotification } from '../lib/NotificationContext';

export default function QuestClaim() {
  const { id } = useParams();
  const { notifyComplete } = useNotification();
  const navigate = useNavigate();

  const handleClaim = () => {
    notifyComplete("Local proof generated and verified safely on-chain.");
    setTimeout(() => {
      navigate('/proof/0xd4f2a9');
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="h-16 border-b border-white/10 bg-[#161616] flex items-center px-8">
        <Link to={`/spaces/${id}`} className="flex items-center gap-3 text-white/50 hover:text-white transition-colors uppercase text-sm font-bold tracking-widest">
          <ArrowLeft size={16} /> BACK TO SPRINT
        </Link>
      </div>
      
      <div className="p-8 max-w-4xl mx-auto mt-12">
        <div className="bg-[#161616] border border-white/10 p-12">
          <div className="w-20 h-20 bg-[#0A0A0A] border border-white/10 flex items-center justify-center mb-10">
            <GitMerge className="text-bright-blue" size={40} />
          </div>
          
          <h1 className="text-4xl font-bold font-heading mb-6 uppercase tracking-tight">Submit a PR to Docs</h1>
          <p className="text-white/60 mb-10 text-lg max-w-2xl">
            Provide the URL of your merged pull request to the Midnight Network docs repository. Our GitAdapter will cryptographically verify the merge hash.
          </p>
          
          <div className="space-y-6 mb-12">
            <div>
              <label className="block text-sm font-bold tracking-widest uppercase text-white/50 mb-4">GitHub PR URL</label>
              <input 
                type="text" 
                placeholder="https://github.com/midnight-network/docs/pull/123"
                className="w-full bg-[#0A0A0A] border border-white/20 px-6 py-4 outline-none focus:border-bright-blue focus:ring-1 focus:ring-bright-blue transition-all font-mono text-white"
              />
            </div>
          </div>

          <div className="bg-bright-blue/10 border-l-4 border-bright-blue p-6 mb-12 flex items-start gap-4">
            <FileCheck className="text-bright-blue shrink-0 mt-1" size={24} />
            <div>
              <strong className="block text-white mb-2 uppercase tracking-wide">Local Proof Generation</strong>
              <span className="text-white/70 leading-relaxed block max-w-2xl">
                Your browser will generate a local zero-knowledge proof. Your GitHub identity will not be published on-chain, only a verification commitment hash.
              </span>
            </div>
          </div>

          <button onClick={handleClaim} className="w-full md:w-auto block px-12 py-5 bg-bright-blue text-white font-bold tracking-widest uppercase hover:bg-[#0000FE]/90 transition-colors border border-bright-blue">
            Generate Circuit Proof
          </button>
        </div>
      </div>
    </div>
  );
}
