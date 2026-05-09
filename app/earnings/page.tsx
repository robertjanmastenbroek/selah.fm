'use client';

const MOCK_EARNINGS = [
  { id: '1', track: 'Midnight Frequencies', artist: 'RJ Mastenbroek', platform: 'tiktok', views: 12400, earned: 37.20, status: 'paid', date: 'May 8' },
  { id: '2', track: 'Desert Prayer', artist: 'Luna Sol', platform: 'instagram', views: 8300, earned: 33.20, status: 'paid', date: 'May 7' },
  { id: '3', track: 'Neon Cathedral', artist: 'SYNTHPRIEST', platform: 'tiktok', views: 45100, earned: 90.20, status: 'pending', date: 'May 9' },
  { id: '4', track: 'Midnight Frequencies', artist: 'RJ Mastenbroek', platform: 'youtube', views: 9500, earned: 28.50, status: 'paid', date: 'May 6' },
];

export default function EarningsPage() {
  const totalEarned = MOCK_EARNINGS.reduce((sum, e) => sum + e.earned, 0);
  const pendingPayout = MOCK_EARNINGS.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.earned, 0);

  return (
    <div className="min-h-screen bg-void">
      <div className="sticky top-0 bg-void/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between z-10">
        <a href="/browse" className="text-muted text-sm hover:text-ivory">← Browse</a>
        <span className="font-display text-gold text-lg">Earnings</span>
        <div className="w-8 h-8 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold">C</div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Balance card */}
        <div className="card-elevated text-center mb-6">
          <div className="text-muted text-xs uppercase tracking-wider mb-2">Total earned</div>
          <div className="font-display text-4xl text-gold mb-1">${totalEarned.toFixed(2)}</div>
          <div className="text-muted text-sm mb-4">{MOCK_EARNINGS.length} submissions</div>
          {pendingPayout > 0 && (
            <div className="bg-gold/10 border border-gold/20 rounded-lg p-3 text-sm mb-4">
              <span className="text-gold font-bold">${pendingPayout.toFixed(2)}</span>
              <span className="text-muted"> pending payout</span>
            </div>
          )}
          <button className="btn-gold w-full !py-2.5 !rounded-xl text-sm"
            onClick={() => alert('Payouts coming soon via Stripe Connect')}>
            Withdraw
          </button>
        </div>

        {/* Earnings list */}
        <div className="space-y-3">
          <h3 className="text-muted text-xs uppercase tracking-wider px-1">Recent submissions</h3>
          {MOCK_EARNINGS.map((e) => (
            <div key={e.id} className="card !p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-ivory text-sm">{e.track}</div>
                <div className="text-muted text-xs">{e.artist} · {e.platform} · {e.date}</div>
              </div>
              <div className="text-right">
                <div className="text-gold font-bold">${e.earned.toFixed(2)}</div>
                <div className={`text-xs ${e.status === 'paid' ? 'text-green-400' : 'text-gold-muted'}`}>
                  {e.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
