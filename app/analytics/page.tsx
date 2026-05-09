'use client';

import { useState } from 'react';
import BottomNav from '@/components/BottomNav';

const PLATFORMS = [
  { id: 'tiktok', name: 'TikTok', color: '#ff0050', icon: '🎵', connected: false },
  { id: 'instagram', name: 'Instagram', color: '#E1306C', icon: '📸', connected: false },
  { id: 'youtube', name: 'YouTube', color: '#FF0000', icon: '▶️', connected: false },
  { id: 'x', name: 'X (Twitter)', color: '#1DA1F2', icon: '🐦', connected: false },
];

const MOCK_STATS = {
  totalViews: 0,
  totalPosts: 0,
  totalEarnings: 0,
  platforms: {} as Record<string, { views: number; posts: number; avgEngagement: number }>,
};

export default function AnalyticsPage() {
  const [connected, setConnected] = useState<Set<string>>(new Set());

  const handleConnect = (platform: string) => {
    setConnected(new Set([...connected, platform]));
  };

  const connectedCount = connected.size;

  return (
    <div className="min-h-screen bg-void pb-20">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <span className="font-display text-gold text-lg">Analytics</span>
          <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">
            {connectedCount > 0 ? connectedCount : '0'}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Stats overview */}
        {connectedCount > 0 ? (
          <div className="card-elevated">
            <h3 className="text-ivory font-semibold mb-4">Overview</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-gold text-2xl font-bold">0</div>
                <div className="text-muted text-xs">Total views</div>
              </div>
              <div>
                <div className="text-gold text-2xl font-bold">0</div>
                <div className="text-muted text-xs">Posts</div>
              </div>
              <div>
                <div className="text-gold text-2xl font-bold">$0</div>
                <div className="text-muted text-xs">Earned</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card-elevated text-center py-8">
            <div className="text-4xl mb-3">📊</div>
            <div className="font-semibold text-ivory mb-1">Connect your accounts</div>
            <p className="text-muted text-sm">Link TikTok, Instagram, YouTube, or X to see your analytics.</p>
          </div>
        )}

        {/* Platform connections */}
        <div className="space-y-3">
          <h3 className="text-ivory font-semibold px-1">Connected accounts</h3>
          {PLATFORMS.map((p) => {
            const isConnected = connected.has(p.id);
            return (
              <div key={p.id} className="card-elevated !p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: p.color + '20' }}>
                    {p.icon}
                  </div>
                  <div>
                    <div className="text-ivory font-semibold text-sm">{p.name}</div>
                    {isConnected ? (
                      <div className="text-green-400 text-xs">Connected · 0 posts</div>
                    ) : (
                      <div className="text-muted text-xs">Not connected</div>
                    )}
                  </div>
                </div>
                {isConnected ? (
                  <button className="text-muted text-xs hover:text-ivory">Disconnect</button>
                ) : (
                  <button onClick={() => handleConnect(p.id)}
                    className="text-gold text-xs font-semibold hover:underline">
                    Connect →
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Coming soon */}
        <div className="card-elevated text-center py-6">
          <div className="text-2xl mb-2">🚀</div>
          <div className="text-muted text-sm">
            Detailed analytics, view tracking, and engagement data coming soon.
            Connect your accounts to start tracking.
          </div>
        </div>
      </div>

      <BottomNav role="creator" />
    </div>
  );
}
