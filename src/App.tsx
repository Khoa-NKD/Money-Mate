import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AuthPage } from './components/auth/AuthPage';
import { UserDashboard } from './components/dashboard/UserDashboard';
import './App.css';

function AppContent() {
  return (
    <div className="mm-container">
      {/* Header thương hiệu MoneyMate */}
      <header className="mm-header">
        <div className="mm-logo-badge">
          <span className="mm-logo-icon">💰</span>
          <span className="mm-logo-text">MoneyMate</span>
        </div>
        <p className="mm-subtitle">
          Nền tảng Quản lý Tài chính Cá nhân Hiện đại &amp; Thông minh
        </p>
      </header>

      {/* Main Content Area quản lý bởi React Router */}
      <main>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/login" element={<AuthPage mode="signin" />} />
          <Route path="/register" element={<AuthPage mode="signup" />} />
          <Route path="/signup" element={<Navigate to="/register" replace />} />

          {/* Protected Route: Bảo vệ /dashboard bằng ProtectedRoute */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Root redirect về /dashboard (ProtectedRoute sẽ tự động chuyển về /login nếu chưa đăng nhập) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Fallback cho các đường dẫn khác */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="mm-footer">
        <p>
          MoneyMate • Bảo mật với Supabase Auth &amp; PostgreSQL Row Level Security
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
