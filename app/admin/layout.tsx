'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Megaphone, FileCheck, Banknote, Database, LogOut } from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/submissions', label: 'Submissions', icon: FileCheck },
  { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
  { href: '/admin/seed', label: 'Seed Data', icon: Database },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(d=>setEmail(d.user?.email||''));
  }, []);

  const handleLogout = async () => { await fetch('/api/auth/logout',{method:'POST'}); window.location.href='/login'; };

  return (
    <div className="min-h-screen flex" style={{background:'#0A0A0A'}}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 gap-1">
        <div className="mb-6 px-3 py-2">
          <Link href="/admin" className="text-sm font-bold tracking-tight">Selah<span className="text-primary">.fm</span></Link>
          <p className="text-[10px] text-muted-foreground">Admin</p>
        </div>
        {nav.map(item=>{const I=item.icon;const active=pathname===item.href;return(
          <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${active?'bg-primary/10 text-primary font-medium':'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}><I size={16} strokeWidth={1.5}/>{item.label}</Link>
        )})}
        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          <p className="px-3 text-[10px] text-muted-foreground truncate mb-2">{email}</p>
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive w-full text-left transition-colors"><LogOut size={16} strokeWidth={1.5}/>Log out</button>
        </div>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.06] flex overflow-x-auto">
        {nav.map(item=>{const I=item.icon;const active=pathname===item.href;return(
          <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-3 py-2 text-[10px] shrink-0 ${active?'text-primary':'text-muted-foreground'}`}><I size={16} strokeWidth={1.5}/>{item.label}</Link>
        )})}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
