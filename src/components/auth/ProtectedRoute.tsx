import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Component bảo vệ các tuyến đường (routes) yêu cầu xác thực.
 * - Đang kiểm tra auth (loading: true): hiển thị giao diện chờ tải.
 * - Chưa có session: điều hướng về /login và lưu lại trang đích trong location state.
 * - Đã có session: render children bình thường.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="mm-loading-screen" role="status" aria-live="polite">
        <div className="mm-loading-spinner-lg"></div>
        <p className="mm-loading-text">
          Đang kiểm tra quyền truy cập...
        </p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
