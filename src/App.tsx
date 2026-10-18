import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthPage } from './components/auth/AuthPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { WalletIcon } from './components/ui/Icons';
import './App.css';

function AppLayout() {
  const location = useLocation();
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/signup';

  return (
    <div className={`mm-app-root ${isAuthRoute ? 'mm-auth-mode' : 'mm-dashboard-mode'}`}>
      {/* Auth-only Brand Header (Dashboard uses its own Navbar) */}
      {isAuthRoute && (
        <header className='mm-auth-page-header'>
          <div className='mm-brand-badge-pill'>
            <div className='mm-brand-icon'>
              <WalletIcon size={24} />
            </div>
            <span className='mm-brand-title'>MoneyMate</span>
          </div>
          <p className='mm-auth-page-subtitle'>
            Nền tảng Quản lý Tài chính Cá nhân Hiện đại &amp; Bảo mật
          </p>
        </header>
      )}

      {/* Main Content Area */}
      <main className='mm-main-content'>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path='/login' element={<AuthPage mode='signin' />} />
          <Route path='/register' element={<AuthPage mode='signup' />} />
          <Route path='/signup' element={<Navigate to='/register' replace />} />

          {/* Protected Route: Bảo vệ /dashboard bằng ProtectedRoute */}
          <Route
            path='/dashboard'
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root redirect về /dashboard (ProtectedRoute sẽ tự động chuyển về /login nếu chưa đăng nhập) */}
          <Route path='/' element={<Navigate to='/dashboard' replace />} />

          {/* Fallback cho các đường dẫn khác */}
          <Route path='*' element={<Navigate to='/dashboard' replace />} />
        </Routes>
      </main>

      {/* Global Footer */}
      <footer className='mm-app-footer'>
        <div className='mm-footer-container'>
          <p>
            MoneyMate © 2026 • Bảo mật mã hóa với Supabase Auth &amp; PostgreSQL Row Level Security
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
