import { useState } from 'react';
import { toast } from 'sonner';
import {
  Search, ShieldOff, ShieldCheck, Ban, CheckCircle,
  UserPlus, Check, X,
} from 'lucide-react';
import { useAccounts, useAccountActions } from '../../hooks/useAdmin';
import { useRoleRequests, useRoleRequestActions } from '../../hooks/useRoleRequests';
import { useAuth } from '../../store/authStore';
import { supabase } from '../../lib/supabase';

const ROLES = ['buyer', 'seller', 'admin'];

/* ─── Pending Seller-Request Panel ─────────────────────── */
function RoleRequestsPanel() {
  const { data = [], isLoading } = useRoleRequests();
  const { approveMut, rejectMut } = useRoleRequestActions();
  const pending = data.filter((r) => r.status === 'pending');

  if (isLoading || !pending.length) return null;

  async function approve(id) {
    try { await approveMut.mutateAsync(id); toast.success('Seller approved'); }
    catch (e) { toast.error(e.message); }
  }
  async function reject(id) {
    try { await rejectMut.mutateAsync(id); toast.success('Request rejected'); }
    catch (e) { toast.error(e.message); }
  }

  return (
    <div className="card p-5 border-violet-200 bg-violet-50/40 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <UserPlus size={16} className="text-violet-600" />
        <h2 className="font-semibold text-slate-900">
          Pending seller requests
          <span className="ml-2 badge-violet">{pending.length}</span>
        </h2>
      </div>

      <div className="space-y-2">
        {pending.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 p-3 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">
                {r.requester?.name}
                <span className="text-slate-500 font-normal"> · {r.requester?.email}</span>
              </p>
              {r.message && (
                <p className="text-xs text-slate-600 mt-0.5 italic">"{r.message}"</p>
              )}
              <p className="text-xs text-slate-400 mt-1">
                {new Date(r.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => approve(r.id)} className="btn-ghost text-emerald-600" title="Approve">
                <Check size={16} />
              </button>
              <button onClick={() => reject(r.id)} className="btn-ghost text-red-600" title="Reject">
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Accounts Page ───────────────────────────────── */
export default function Accounts() {
  const me = useAuth((s) => s.profile);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const { data = [], isLoading } = useAccounts({ search, role });
  const { roleMut, suspendMut, verifyMut } = useAccountActions();

  async function changeRole(id, email, oldRole, newRole) {
    try {
      await roleMut.mutateAsync({ id, role: newRole });
      await supabase.from('audit_logs').insert({
        action: `Changed ${email} from ${oldRole} to ${newRole}`,
        target: email,
        performed_by: me?.email || 'Admin',
      });
      toast.success(`Role updated to ${newRole}`);
    } catch (e) { 
      toast.error(e.message); 
    }
  }

  async function toggleSuspend(user) {
    try {
      await suspendMut.mutateAsync({ id: user.id, suspended: !user.suspended });
      toast.success(user.suspended ? 'Account reactivated' : 'Account suspended');
    } catch (e) { toast.error(e.message); }
  }

  async function toggleVerify(user) {
    try {
      await verifyMut.mutateAsync({ id: user.id, verified: !user.verified });
      toast.success(user.verified ? 'Verification revoked' : 'Account verified');
    } catch (e) { toast.error(e.message); }
  }

  return (
    <div className="space-y-4">
      <RoleRequestsPanel />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <p className="text-sm text-slate-500 mt-1">{data.length} account{data.length === 1 ? '' : 's'}</p>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search by name, email or student number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input sm:w-48" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {['buyer', 'seller', 'admin', 'security_admin'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="card p-8 text-center text-slate-500">Loading accounts…</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Student</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.map((u) => {
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name} {isMe && <span className="text-xs text-violet-600">(you)</span>}</div>
                      <div className="text-xs text-slate-500">{u.email}</div>
                      {u.student_number && <div className="text-xs text-slate-400">{u.student_number}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        disabled={isMe || u.role === 'security_admin'}
                        value={u.role}
                        onChange={(e) => changeRole(u.id, u.email, u.role, e.target.value)}
                        className="input text-xs py-1.5"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        {u.role === 'security_admin' && <option value="security_admin">security_admin</option>}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.suspended
                          ? <span className="badge-red">Suspended</span>
                          : <span className="badge-emerald">Active</span>}
                        {u.verified && <span className="badge-violet">Verified</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        disabled={isMe}
                        onClick={() => toggleVerify(u)}
                        className="btn-ghost text-xs mr-1"
                        title={u.verified ? 'Revoke verification' : 'Verify student'}
                      >
                        {u.verified ? <ShieldOff size={14} /> : <ShieldCheck size={14} />}
                      </button>
                      <button
                        disabled={isMe}
                        onClick={() => toggleSuspend(u)}
                        className={`btn-ghost text-xs ${u.suspended ? 'text-emerald-600' : 'text-red-600'}`}
                        title={u.suspended ? 'Reactivate' : 'Suspend'}
                      >
                        {u.suspended ? <CheckCircle size={14} /> : <Ban size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!data.length && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No accounts match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}