import { Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import type { AuthViewMode } from '../../types/auth';

interface AuthPageProps {
  mode: AuthViewMode;
}

/**
 * Trang xác thực chứa tab chuyển đổi giữa Đăng Nhập và Đăng Ký,
 * tự động điều hướng vào /dashboard nếu người dùng đã có phiên đăng nhập hợp lệ.
 */
export function AuthPage({ mode }: AuthPageProps) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Đang kiểm tra session ban đầu thì hiển thị loader
  if (loading) {
    return (
      <div className="mm-loading-screen" role="status" aria-live="polite">
        <div className="mm-loading-spinner-lg"></div>
        <p className="mm-loading-text">
          Đang đồng bộ trạng thái tài khoản...
        </p>
      </div>
    );
  }

  // Nếu người dùng đã đăng nhập, chuyển hướng ngay vào /dashboard (hoặc trang trước đó)
  if (session) {
    const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
    return <Navigate to={fromPath} replace />;
  }

  return (
    <div className="mm-auth-wrapper">
      {/* Tabs chuyển đổi URL giữa /login và /register */}
      <div className="mm-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signin'}
          className={`mm-tab-btn ${mode === 'signin' ? 'active' : ''}`}
          onClick={() => navigate('/login')}
        >
          🔑 Đăng Nhập
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'signup'}
          className={`mm-tab-btn ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => navigate('/register')}
        >
          ✨ Đăng Ký
        </button>
      </div>

      {/* Hiển thị form tương ứng với URL */}
      {mode === 'signin' ? (
        <SignIn onSwitchToSignUp={() => navigate('/register')} />
      ) : (
        <SignUp onSwitchToSignIn={() => navigate('/login')} />
      )}
    </div>
  );
}
