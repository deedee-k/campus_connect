import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Flag, ArrowLeft, Shield, Database } from 'lucide-react';
import { useAuth } from '../../store/authStore';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/accounts', label: 'Accounts', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/ledger', label: 'Blockchain Ledger', icon: Database }, // <-- Added
];

export default function AdminLayout() {
  const profile = useAuth((s) => s.profile);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-5 border-b border-slate-200">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center">
              <Shield size={16} />
            </span>
            <span className="font-bold text-slate-900">Admin Console</span>
          </Link>
          <p className="text-xs text-slate-500 mt-1">{profile?.name}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-50 text-violet-700 font-medium'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <Icon size={16} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
            <ArrowLeft size={16} /> Back to marketplace
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}