'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { fetch('/api/admin/users').then(r=>r.json()).then(setUsers); }, []);

  const searchUsers = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}`).then(r=>r.json()).then(setUsers);
  };

  return (
    <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} className="space-y-6">
      <div><h1 className="text-2xl font-bold mb-1">Users</h1><p className="text-muted-foreground text-sm">{users.length} users</p></div>
      <form onSubmit={searchUsers} className="flex gap-2">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by email or name..."
          className="flex-1 rounded-lg bg-white/[0.03] border border-white/[0.06] px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none"/>
        <button type="submit" className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors"><Search size={14}/></button>
      </form>
      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Email</th><th className="text-left py-3 px-4 font-medium">Name</th><th className="text-left py-3 px-4 font-medium">Type</th><th className="text-left py-3 px-4 font-medium">Stripe</th><th className="text-left py-3 px-4 font-medium">Joined</th>
            </tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-3 px-4 font-mono text-xs">{u.email}</td>
                  <td className="py-3 px-4">{u.display_name}</td>
                  <td className="py-3 px-4"><span className={`text-[10px] px-2 py-0.5 rounded-full ${u.user_type==='artist'?'bg-primary/10 text-primary':'bg-success/10 text-success'}`}>{u.user_type}</span></td>
                  <td className="py-3 px-4 text-xs">{u.stripe_connect_id?'✅ Connected':'—'}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
