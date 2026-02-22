import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
// Protected Pages - Client
import Dashboard from './pages/dashboard/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import DomainDetails from './pages/dashboard/DomainDetails';
// Domain Search
import DomainSearch from './pages/DomainSearch';
import Domains from './pages/dashboard/Domains';
import ForgotPassword from './pages/auth/ForgotPassword';
// Public Pages
import Home from './pages/Home';
import InvoiceDetails from './pages/dashboard/InvoiceDetails';
import Invoices from './pages/dashboard/Invoices';
import Login from './pages/auth/Login';
// Layouts
import MainLayout from './layouts/MainLayout';
import Profile from './pages/dashboard/Profile';
import Register from './pages/auth/Register';
import ResetPassword from './pages/auth/ResetPassword';
import { Toaster } from 'react-hot-toast';
import Wallet from './pages/dashboard/Wallet';
import useAuthStore from './store/authStore';

import Setup2FA from './pages/auth/Setup2FA';
import VerifyEmail from './pages/auth/VerifyEmail';
import VerifyLogin2FA from './pages/auth/VerifyLogin2FA';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<DomainSearch />} />
        </Route>

        {/* Auth Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={!isAuthenticated ? <VerifyLogin2FA /> : <Navigate to="/dashboard" />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="domains" element={<Domains />} />
          <Route path="domains/:id" element={<DomainDetails />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/:id" element={<InvoiceDetails />} />
          <Route path="wallet" element={<Wallet />} />
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;