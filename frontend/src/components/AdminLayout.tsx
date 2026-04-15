import { ReactNode } from 'react';
import AdminSidebar from './AdminSidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <AdminSidebar />
      <div className="flex-1 ml-20 lg:ml-64 w-full">
        <main className="min-h-screen pb-20 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
