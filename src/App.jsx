import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './store/authStore';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AppLayout from './components/layout/AppLayout';
import NotFound from './pages/NotFound';
import Home from './pages/marketplace/Home';

// Lazy-loaded routes to optimize initial bundle size
const ListingDetailPage = lazy(() => import('./pages/marketplace/ListingDetailPage'));
const StudentHome = lazy(() => import('./pages/marketplace/StudentHome'));
const Favourites = lazy(() => import('./pages/buyer/Favourites'));
const CartPage = lazy(() => import('./pages/cart/CartPage'));
const Transactions = lazy(() => import('./pages/transactions/Transactions'));
const ChatPage = lazy(() => import('./pages/chat/ChatPage'));

const CreateListing = lazy(() => import('./pages/seller/CreateListing'));
const MyListings = lazy(() => import('./pages/seller/MyListings'));
const SellerOrders = lazy(() => import('./pages/seller/SellerOrder'));

const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminAccounts = lazy(() => import('./pages/admin/Accounts'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminLedger = lazy(() => import('./pages/admin/AdminLedger'));

const SecurityConsole = lazy(() => import('./pages/security/SecurityConsole'));

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const init = useAuth((s) => s.init);
  useEffect(() => { init(); }, [init]);

  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoader />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
