'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, X, Check, Pencil, Trash2 } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 2500); };

  const fetchUsers = (s = '') => {
    fetch(`/api/admin/users?search=${encodeURIComponent(s)}`).then(r => r.json()).then(d => {
      if (Array.isArray(d)) setUsers(d);
    });
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleEdit = (u: any) => {
    setEditingId(u.id);
    setEditValues({ name: u.display_name || '', type: u.user_type || '', bio: u.bio || '', genres: u.genres || '' });
  };

  const handleSave = async (id: string) => {
    const body: any = {};
    if (editValues.name !== undefined) body.display_name = editValues.name;
    if (editValues.type !== undefined) body.user_type = editValues.type;
    if (editValues.bio !== undefined) body.bio = editValues.bio;
    if (editValues.genres !== undefined) body.genres = editValues.genres;

    const res = await fetch(`/api/admin/manage?type=users&id=${id}`, {
      method: 'PATCH', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) { setEditingId(null); fetchUsers(search); showToast('User updated'); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/manage?type=users&id=${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { fetchUsers(search); showToast('User deleted', 'info'); }
    else { const e = await res.json(); showToast(e.error || 'Failed', 'error'); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-bold mb-1">Users</h1><p className="text-muted-foreground text-sm">{users.length} users</p></div>
        <form onSubmit={e => { e.preventDefault(); fetchUsers(search); }} className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
            className="w-48 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/30 focus:outline-none" />
          <button type="submit" className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors active:scale-[0.97]"><Search size={14} /></button>
        </form>
      </div>

      {toast && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          className={`text-sm px-4 py-2 rounded-xl ${toast.type === 'error' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
          {toast.msg}
        </motion.div>
      )}

      <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/[0.06] text-muted-foreground text-xs">
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">Type</th>
              <th className="text-left py-3 px-4 font-medium">Joined</th>
              <th className="text-right py-3 px-4 font-medium w-20">Actions</th>
            </tr></thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center text-muted-foreground">No users found</td></tr>
              ) : users.map(u => {
                const isEditing = editingId === u.id;
                return (
                  <tr key={u.id} className={`border-b border-white/[0.03] ${isEditing ? 'bg-primary/[0.03]' : 'hover:bg-white/[0.02]'}`}>
                    <td className="py-3 px-4 font-mono text-xs">{u.email}</td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <input value={editValues.name || ''} onChange={e => setEditValues({ ...editValues, name: e.target.value })}
                          className="w-full rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm focus:border-primary/30 focus:outline-none" />
                      ) : u.display_name}
                    </td>
                    <td className="py-3 px-4">
                      {isEditing ? (
                        <select value={editValues.type || ''} onChange={e => setEditValues({ ...editValues, type: e.target.value })}
                          className="rounded bg-white/[0.06] border border-white/[0.08] px-2 py-1 text-sm">
                          <option value="artist">Artist</option><option value="creator">Creator</option>
                        </select>
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${u.user_type === 'artist' ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>{u.user_type}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <button onClick={() => handleSave(u.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400 active:scale-[0.95]" title="Save"><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground active:scale-[0.95]" title="Cancel"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(u)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-muted-foreground hover:text-foreground active:scale-[0.95]" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(u.id, u.display_name || u.email)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive active:scale-[0.95]" title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
