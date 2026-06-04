'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, Megaphone, FileCheck, Banknote, Mail, Bug, MessageCircle, BookOpen, Mic, Layers, Search, PenTool, Send, LogOut, Shield, BarChart3 } from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/submissions', label: 'Submissions', icon: FileCheck },
  { href: '/admin/payouts', label: 'Payouts', icon: Banknote },
  { href: '/admin/emails', label: 'Emails', icon: Mail },
  { href: '/admin/bugs', label: 'Bugs', icon: Bug },
  { href: '/admin/support-chats', label: 'Chats', icon: MessageCircle },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/outreach', label: 'Outreach', icon: Send },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/source-questions', label: 'Questions', icon: Search },
  { href: '/admin/blog-generator', label: 'Generate', icon: PenTool },
  { href: '/admin/content', label: 'Content', icon: Layers },
  { href: '/admin/interview', label: 'Interview', icon: Mic },
  { href: '/admin/audit-log', label: 'Audit Log', icon: Shield },
];

interface Props {
  children: React.ReactNode;
  isAdmin: boolean;
  email: string;
}

export default function AdminLayoutClient({ children, isAdmin, email }: Props) {
  const pathname = usePathname();

  const handleLogout = async () => { 
    const { createClient } = await import('@/lib/supabase/client');
    await createClient().auth.signOut();
    window.location.href = '/login'; 
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F0F23' }}>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <Shield size={48} className="mx-auto text-destructive/40" strokeWidth={1} />
          <h2 className="text-xl font-bold">Admin access required</h2>
          <p className="text-muted-foreground text-sm">Sign in with an admin account to continue.</p>
          <Link href="/login" className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm">Sign in</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0F0F23' }}>
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 border-r border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 gap-1">
        <div className="mb-6 px-3 py-2">
          <Link href="/" className="flex items-center gap-1.5 mb-6">
            <img src="/images/Selah Logo transparant no text.png" alt="Selah.fm" className="h-6 w-auto" />
          </Link>
          <p className="text-[10px] text-muted-foreground mt-1">Admin · {email}</p>
        </div>
        {nav.map(item => {
          const I = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${active ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'}`}>
              <I size={16} strokeWidth={1.5} />{item.label}
            </Link>
          );
        })}
        <div className="mt-auto pt-4 border-t border-white/[0.06]">
          <button onClick={handleLogout} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive w-full text-left transition-colors">
            <LogOut size={16} strokeWidth={1.5} />Log out
          </button>
        </div>
      </aside>

      {/* Mobile nav — scrollable, all items */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/[0.02] backdrop-blur-xl border-t border-white/[0.06] flex overflow-x-auto">
        {nav.map(item => {
          const I = item.icon;
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-[9px] shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <I size={15} strokeWidth={1.5} />{item.label}
            </Link>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
