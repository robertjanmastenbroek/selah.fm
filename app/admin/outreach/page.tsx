'use client';

import { useState, useEffect } from 'react';

export default function OutreachDashboard() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/api/admin/outreach', { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d.error) setStatus('error: ' + d.error);
        else setStatus('ok: ' + (d.pipeline?.discovered || 0) + ' discovered');
      })
      .catch(e => setStatus('fetch error: ' + e.message));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Outreach Pipeline</h1>
      <p className="text-sm text-muted-foreground">Status: {status}</p>
    </div>
  );
}
