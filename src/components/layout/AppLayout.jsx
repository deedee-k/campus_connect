import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  LogOut, PlusCircle, Heart, MessageSquare,
  LayoutDashboard, User, Package, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getCart } from '../../services/cart';
import { AiAssistant } from '../ai/AiAssistant';

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const nav = useNavigate();
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin';
  const { data: cart = [] } = useQuery({ queryKey: ['cart'], queryFn: getCart });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center font-bold">C</span>
            <span className="font-bold text-lg text-slate-900">
              CampusConnect <span className="text-violet-600">Market</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm">
            {/* Seller-only links */}
            {isSeller && <NavItem to="/sell" icon={PlusCircle} label="Sell" />}
            {isSeller && <NavItem to="/my-listings" icon={Package} label="My listings" />}
            {isSeller && <NavItem to="/seller-orders" icon={Package} label="Orders" />}
            
            {/* Buyer links */}
            <NavItem to="/cart" icon={ShoppingCart} label={`Cart (${cart.length})`} />
            <NavItem to="/favourites" icon={Heart} label="Favourites" />
            <NavItem to="/transactions" icon={MessageSquare} label="Transactions" />
            
            {/* Admin link */}
            {profile?.role === 'admin' && (
              <NavItem to="/admin" icon={LayoutDashboard} label="Admin" />
            )}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/profile" className="hidden sm:flex flex-col items-end leading-tight hover:opacity-80">
              <span className="text-sm font-medium text-slate-900 flex items-center gap-1">
                <User size={14} className="text-slate-400" />
                {profile?.name ?? 'Student'}
              </span>
              {profile?.role && (
                <span className="text-[10px] uppercase tracking-wide badge-violet">
                  {profile.role}
                </span>
              )}
            </Link>
            <button
              onClick={async () => { await logout(); nav('/login'); }}
              className="btn-ghost text-red-600 hover:bg-red-50"
              title="Sign out"
            >
              <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate-500 flex items-center justify-between">
          <span>© CampusConnect Market</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> All systems online
          </span>
        </div>
      </footer>

      {/* THE FLOATING AI ASSISTANT */}
      <AiAssistant />
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600
                 hover:text-violet-700 hover:bg-violet-50 transition-colors"
    >
      <Icon size={16} />
      <span>{label}</span>
    </Link>
  );
}