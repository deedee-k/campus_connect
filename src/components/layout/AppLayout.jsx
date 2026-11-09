import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, PlusCircle, Heart, MessageSquare,
  LayoutDashboard, User, Package, ShoppingCart, Home, Store
} from 'lucide-react';
import { useAuth } from '../../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { getCart } from '../../services/cart';
import { AiAssistant } from '../ai/AiAssistant';

export default function AppLayout() {
  const { profile, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const isSeller = profile?.role === 'seller' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin' || profile?.role === 'security_admin';
  const { data: cart = [] } = useQuery({ queryKey: ['cart'], queryFn: getCart });

  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-16 md:pb-0">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-violet-600 text-white grid place-items-center font-bold">C</span>
            <span className="font-bold text-lg text-slate-900 hidden sm:block">
              CampusConnect <span className="text-violet-600">Market</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {isAdmin && (
              <Link to={profile.role === 'security_admin' ? '/security' : '/admin'} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-600 bg-red-50 hover:bg-red-100 font-medium transition-colors mr-2">
                <LayoutDashboard size={16} /> Admin Dashboard
              </Link>
            )}
            {isSeller && <NavItem to="/sell" icon={PlusCircle} label="Sell" />}
            {isSeller && <NavItem to="/my-listings" icon={Package} label="My listings" />}
            {isSeller && <NavItem to="/seller-orders" icon={Store} label="Sales" />}
            <NavItem to="/cart" icon={ShoppingCart} label={`Cart (${cart.length})`} />
            <NavItem to="/transactions" icon={MessageSquare} label="My Orders" />
            <NavItem to="/favourites" icon={Heart} label="Favourites" />
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/profile" className="hidden sm:flex flex-col items-end leading-tight hover:opacity-80">
              <span className="text-sm font-medium text-slate-900 flex items-center gap-1">
                <User size={14} className="text-slate-400" />
                {profile?.name ?? 'Student'}
              </span>
              {profile?.role && <span className="text-[10px] uppercase tracking-wide badge-violet">{profile.role}</span>}
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-red-600 hover:bg-red-50 p-2" title="Sign out">
              <LogOut size={18} /> <span className="hidden sm:inline text-sm">Logout</span>
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500" />
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav - 4 items only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-2 z-40 pb-safe">
        
        {/* 1. Home */}
        <MobileNavItem to="/" icon={Home} label="Home" current={location.pathname} />
        
        {/* 2. Cart (everyone has a cart) */}
        <MobileNavItem to="/cart" icon={ShoppingCart} label={`Cart (${cart.length})`} current={location.pathname} />

        {/* 3. Smart Middle Button (Seller Management OR Buyer Tracking) */}
        {isSeller ? (
          <MobileNavItem to="/my-listings" icon={Package} label="My Items" current={location.pathname} />
        ) : (
          <MobileNavItem to="/transactions" icon={MessageSquare} label="Orders" current={location.pathname} />
        )}

        {/* 4. Profile / Admin */}
        {isAdmin ? (
          <MobileNavItem 
            to={profile.role === 'security_admin' ? '/security' : '/admin'} 
            icon={LayoutDashboard} 
            label="Admin" 
            current={location.pathname} 
          />
        ) : (
          <MobileNavItem to="/profile" icon={User} label="Profile" current={location.pathname} />
        )}
      </nav>

      <footer className="hidden md:block border-t border-slate-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6 text-xs text-slate-500 flex items-center justify-between">
          <span>© CampusConnect Market — DIDT3110 Group Project</span>
        </div>
      </footer>

      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-50">
        <AiAssistant />
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:text-violet-700 hover:bg-violet-50 transition-colors">
      <Icon size={16} /><span>{label}</span>
    </Link>
  );
}

function MobileNavItem({ to, icon: Icon, label, current }) {
  const active = current === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-1 ${active ? 'text-violet-600' : 'text-slate-400'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-medium">{label}</span>
    </Link>
  );
}