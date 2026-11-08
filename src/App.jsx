import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AppLayout from './components/layout/AppLayout';
import NotFound from './pages/NotFound';

import Home from './pages/marketplace/Home';
import ListingDetailPage from './pages/marketplace/ListingDetailPage';
import StudentHome from './pages/marketplace/StudentHome';
import Favourites from './pages/buyer/Favourites';
import CartPage from './pages/cart/CartPage';
import Transactions from './pages/transactions/Transactions';

import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminAccounts from './pages/admin/Accounts';
import AdminReports from './pages/admin/Reports';
import AdminLedger from './pages/admin/AdminLedger'; 

import CreateListing from './pages/seller/CreateListing';
import MyListings from './pages/seller/MyListings';
import SellerOrders from './pages/seller/SellerOrder'; 

import SecurityConsole from './pages/security/SecurityConsole';
import ChatPage from './pages/chat/ChatPage';

export default function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Marketplace shell — any signed-in user */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetailPage />} />
          <Route path="/profile" element={<StudentHome />} />
          <Route path="/favourites" element={<Favourites />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/chat/:id" element={<ChatPage />} />

          <Route
            path="/sell"
            element={
              <RoleRoute roles={['seller', 'admin']}>
                <CreateListing />
              </RoleRoute>
            }
          />
          <Route
            path="/my-listings"
            element={
              <RoleRoute roles={['seller', 'admin']}>
                <MyListings />
              </RoleRoute>
            }
          />
          <Route
            path="/seller-orders"
            element={
              <RoleRoute roles={['seller', 'admin']}>
                <SellerOrders />
              </RoleRoute>
            }
          />
        </Route>

        {/* Admin shell — allow both admin and security_admin to view ledger */}
        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin', 'security_admin']}>
              <AdminLayout />
            </RoleRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="accounts" element={<AdminAccounts />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="ledger" element={<AdminLedger />} />
        </Route>

        {/* Security Console */}
        <Route
          path="/security"
          element={
            <RoleRoute roles={['security_admin']}>
              <SecurityConsole />
            </RoleRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}