import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Shield, Lock, Activity, ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function SecurityConsole() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const currentAdmin = useAuth((s) => s.profile);
  const logout = useAuth((s) => s.logout);

  // 1. Fetch all users
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['security-users'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
  });

  // 2. Fetch Audit Logs
  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw error;
      return data;
    },
  });

  // 3. Mutation to change role AND write a log
  const roleMut = useMutation({
    mutationFn: async ({ id, email, oldRole, newRole }) => {
      // Update the profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);
      
      if (updateErr) throw updateErr;

      // Write to audit log
      const { error: logErr } = await supabase
        .from('audit_logs')
        .insert({
          action: `Changed ${email} from ${oldRole} to ${newRole}`,
          target: email,
          performed_by: currentAdmin?.email || 'Unknown Admin',
        });
      
      if (logErr) {
        console.error("Failed to write log:", logErr);
        throw logErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['security-users'] });
      qc.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success('Role updated and logged');
    },
    onError: (err) => toast.error(err.message),
  });

  async function handleLogout() {
    await logout();
    nav('/login');
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="text-red-500" size={24} />
          <span className="font-bold tracking-wide">Security Configuration Domain</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => nav('/')} className="text-sm flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Back to Marketplace
          </button>
          <button onClick={handleLogout} className="text-sm flex items-center gap-2 bg-red-900/50 text-red-200 px-3 py-1.5 rounded-lg hover:bg-red-900 transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          <div className="bg-red-950 border border-red-900 text-red-200 p-4 rounded-lg flex items-start gap-3 text-sm">
            <Lock className="shrink-0 mt-0.5" size={16} />
            <p>This module is hosted on a separate domain. Unauthorized access attempts are logged and blocked by Row Level Security.</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-3">User Role Management</h2>
            {usersLoading ? (
              <p>Loading users...</p>
            ) : (
              <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800 text-slate-400">
                    <tr>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">Current Role</th>
                      <th className="px-4 py-3 text-right">Change Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-700/50">
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'security_admin' ? 'bg-red-900 text-red-200' : 'bg-slate-700 text-slate-200'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={u.role}
                            onChange={(e) => roleMut.mutate({ 
                              id: u.id, 
                              email: u.email, 
                              oldRole: u.role, 
                              newRole: e.target.value 
                            })}
                            className="bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm outline-none focus:border-red-500"
                          >
                            {['buyer', 'seller', 'admin', 'security_admin'].map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Activity className="text-violet-400" size={18} />
              <h2 className="text-lg font-semibold">Recent Security Audit Logs</h2>
            </div>
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden p-4 space-y-3">
              {logs.length === 0 ? (
                <p className="text-slate-500 text-sm italic">No actions logged yet.</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm border-b border-slate-700/50 pb-3 last:border-0 last:pb-0">
                    <div className="w-2 h-2 mt-1.5 rounded-full bg-violet-500 shrink-0" />
                    <div>
                      <p className="text-slate-200">
                        <strong>{log.performed_by}</strong> {log.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}