import { Link, useLocation } from 'react-router-dom';
import { Settings, Bot, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function AdminSidebar() {
  const { pathname } = useLocation();

  const adminItems = [
    { label: 'Creator Console', icon: <Settings size={22} />, path: '/admin' },
    { label: 'AI Review Policy', icon: <Bot size={22} />, path: '/admin/reviewers' },
  ];

  return (
    <aside className="fixed top-0 left-0 h-screen w-20 lg:w-64 bg-[#0A0A0A] border-r border-[#0000FE]/30 flex flex-col z-40 transition-all">
      <div className="h-20 flex items-center justify-center lg:justify-start px-0 lg:px-6 border-b border-white/10 shrink-0">
        <Link to="/" className="flex items-center border border-bright-blue px-3 py-1.5 hover:bg-bright-blue transition-colors group">
          <span className="font-heading font-black text-xl lg:text-2xl tracking-widest uppercase text-bright-blue group-hover:text-white">ZK</span>
          <span className="font-heading font-black text-xl lg:text-2xl tracking-widest uppercase text-white">.LY</span>
        </Link>
      </div>

      <nav className="flex-1 py-8 px-4 flex flex-col gap-2 overflow-y-auto w-full">
        <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-bright-blue tracking-[0.2em] px-4 mb-4 uppercase">
           <ShieldAlert size={12} />
           <span>Root Access</span>
        </div>
        
        {adminItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(item.path));
          return (
            <Link 
              key={item.label} 
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 group hover:bg-[#0000FE]/10 transition-colors ${isActive ? 'text-bright-blue bg-[#0000FE]/20 border-l-2 border-bright-blue' : 'text-white/60 border-l-2 border-transparent'}`}
            >
              <div className={`${isActive ? 'text-bright-blue' : 'text-white/60 group-hover:text-bright-blue'}`}>
                {item.icon}
              </div>
              <span className={`hidden lg:block font-medium ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <Link to="/spaces" className="flex items-center gap-3 px-4 py-4 text-white/50 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest border-t border-white/10">
          <ArrowLeft size={16} /> Exit Admin
        </Link>
        <div className="hidden lg:block bg-bright-blue/5 p-4 border border-bright-blue/20 mt-4">
          <div className="text-xs text-bright-blue uppercase tracking-widest font-bold mb-2">Space Creator</div>
          <div className="font-mono text-sm text-white">0xadmin...ffaa</div>
        </div>
      </div>
    </aside>
  );
}
