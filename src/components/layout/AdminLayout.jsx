import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Users, Flag, Database, Menu, X, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../store/authStore';

const items = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/accounts', label: 'Accounts', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: Flag },
  { to: '/admin/ledger', label: 'Blockchain Ledger', icon: Database },
];

function SidebarContent({ profile, onClose }) {
  return (
    <>
      <div className="p-5 border-b border-slate-200 flex justify-between items-center">
        <Link to="/admin" className="flex items-center gap-2" onClick={onClose}>
          <span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center">
            <Shield size={16} />
          </span>
          <span className="font-bold text-slate-900">Admin Console</span>
        </Link>
        {/* Mobile Close Button */}
        <button onClick={onClose} className="md:hidden text-slate-500 p-1">
          <X size={20} />
        </button>
      </div>

      <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Signed in as</p>
        <p className="text-sm font-medium text-slate-900">{profile?.name}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${isActive
                ? 'bg-violet-50 text-violet-700 font-medium'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <Link to="/" className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
          <ArrowLeft size={18} /> Back to marketplace
        </Link>
      </div>
    </>
  );
}

export default function AdminLayout() {
  const profile = useAuth((s) => s.profile);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0">
        <SidebarContent profile={profile} onClose={() => { }} />
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="relative w-64 max-w-[80%] bg-white h-full flex flex-col shadow-xl">
            <SidebarContent profile={profile} onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-violet-600" />
            <span className="font-bold text-slate-900">Admin</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg">
            <Menu size={20} />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}