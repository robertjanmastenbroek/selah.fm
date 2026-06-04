'use client';

import Link from 'next/link';
import {
  LayoutDashboard, Megaphone, User, DollarSign, ChartBar,
  PanelLeftClose, PanelLeft, Music
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface TabDef {
  id: string;
  label: string;
  icon: any;
  badge?: number | string;
}

export default function DashboardSidebar({
  tabs,
  activeTab,
  onTabChange,
  isArtist,
  collapsed,
  onToggle,
}: {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (id: string) => void;
  isArtist: boolean;
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 transition-all duration-300 border-r border-white/[0.06] bg-[#0B0B1E]/90 backdrop-blur-2xl ${
          collapsed ? 'w-16' : 'w-56'
        }`}
      >
        {/* Logo area — click to browse */}
        <Link href="/browse" className={`flex items-center h-14 border-b border-white/[0.06] transition-colors hover:bg-white/[0.02] ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          {collapsed ? (
            <Music size={20} className="text-primary shrink-0" />
          ) : (
            <div className="flex items-center gap-2">
              <Music size={18} className="text-primary" />
              <span className="font-bold text-sm" style={{ fontFamily: 'Righteous, system-ui, sans-serif' }}>
                Selah
              </span>
            </div>
          )}
        </Link>

        {/* Nav items */}
        <nav className="flex-1 py-3 space-y-1 px-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  collapsed ? 'justify-center px-0' : ''
                } ${
                  active
                    ? 'bg-primary/[0.08] text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
                }`}
                title={collapsed ? t.label : undefined}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-primary/[0.08]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon size={18} className="relative z-10 shrink-0" />
                {!collapsed && <span className="relative z-10">{t.label}</span>}
                {!collapsed && t.badge && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-semibold relative z-10">
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="p-2 border-t border-white/[0.06]">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-white/[0.04] transition-all"
          >
            {collapsed ? <PanelLeft size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0B1E]/95 backdrop-blur-2xl border-t border-white/[0.06] safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onTabChange(t.id)}
                className={`flex flex-col items-center gap-0.5 py-2 px-3 rounded-xl transition-all relative ${
                  active ? 'text-primary' : 'text-muted-foreground/50'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-xl bg-primary/[0.06]"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon size={18} className="relative z-10" />
                <span className="text-[9px] font-medium relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
