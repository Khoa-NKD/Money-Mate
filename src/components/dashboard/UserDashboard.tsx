import { useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { TransactionList } from './TransactionList';
import { AddTransactionForm } from './AddTransactionForm';
import { CategoryManager } from './CategoryManager';

export function UserDashboard() {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [txRefreshTrigger, setTxRefreshTrigger] = useState<number>(0);
  const [catRefreshTrigger, setCatRefreshTrigger] = useState<number>(0);

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Người dùng MoneyMate';

  const userInitial = (fullName[0] || user?.email?.[0] || 'M').toUpperCase();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError(null);
    try {
      const { error } = await signOut();
      if (error) {
        setSignOutError(getAuthErrorMessage(error));
      }
    } catch (err) {
      setSignOutError(getAuthErrorMessage(err));
    } finally {
      setIsSigningOut(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Chưa ghi nhận';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div className="mm-dashboard">
      {/* Top Banner Profile */}
      <div className="mm-card mm-profile-card">
        <div className="mm-profile-main">
          <div className="mm-avatar-badge">{userInitial}</div>
          <div className="mm-profile-details">
            <div className="mm-profile-header-row">
              <h2 className="mm-profile-name">{fullName}</h2>
              <span className="mm-badge badge-success">Đã Đăng Nhập</span>
            </div>
            <p className="mm-profile-email">{user?.email}</p>
          </div>
        </div>

        <div className="mm-profile-actions">
          <button
            type="button"
            className="mm-btn mm-btn-outline-danger"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <span className="mm-btn-spinner-text">
                <span className="mm-spinner"></span> Đang đăng xuất...
              </span>
            ) : (
              '🚪 Đăng Xuất'
            )}
          </button>
        </div>
      </div>

      {signOutError && (
        <div className="mm-alert mm-alert-error" role="alert">
          <span className="mm-alert-icon">⚠️</span>
          <div className="mm-alert-content">{signOutError}</div>
        </div>
      )}

      {/* Grid Features & Session Info */}
      <div className="mm-main">
        {/* Session & Security Card */}
        <div className="mm-card">
          <div className="mm-card-header">
            <h3>Chi Tiết Phiên Làm Việc</h3>
            <span className="mm-badge badge-info">Supabase Auth</span>
          </div>
          <div className="mm-card-body">
            <div className="mm-info-row">
              <span className="mm-info-label">User ID (UID):</span>
              <span className="mm-info-value mm-code">{user?.id}</span>
            </div>
            <div className="mm-info-row">
              <span className="mm-info-label">Email đã xác nhận:</span>
              <span className="mm-info-value">
                {user?.email_confirmed_at ? '✅ Đã xác nhận' : '⏳ Chưa xác nhận'}
              </span>
            </div>
            <div className="mm-info-row">
              <span className="mm-info-label">Lần đăng nhập gần nhất:</span>
              <span className="mm-info-value">
                {formatDate(user?.last_sign_in_at)}
              </span>
            </div>
            <div className="mm-info-row">
              <span className="mm-info-label">Thời điểm tạo tài khoản:</span>
              <span className="mm-info-value">
                {formatDate(user?.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Ready to Build MoneyMate Modules */}
        <div className="mm-card">
          <div className="mm-card-header">
            <h3>Trạng Thái Module MoneyMate</h3>
            <span className="mm-badge badge-success">Xác Thực Sẵn Sàng</span>
          </div>
          <div className="mm-checklist">
            <div className="mm-check-item">
              <span className="mm-check-icon">✓</span>
              <div>
                <strong>Hệ Thống Authentication (Supabase)</strong>
                <p>AuthContext, SignUp, SignIn, SignOut hoạt động hoàn chỉnh</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">⏳</span>
              <div>
                <strong>Quản Lý Ví &amp; Tài Khoản Ngân Hàng</strong>
                <p>Sẵn sàng liên kết RLS (Row Level Security) theo UID người dùng</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">⏳</span>
              <div>
                <strong>Ghi Chép Thu Chi &amp; Phân Loại Danh Mục</strong>
                <p>Theo dõi dòng tiền hàng ngày, tuần, tháng</p>
              </div>
            </div>
            <div className="mm-check-item">
              <span className="mm-check-icon">⏳</span>
              <div>
                <strong>Báo Cáo Thống Kê &amp; Biểu Đồ Trực Quan</strong>
                <p>Phân tích tỷ trọng chi tiêu thông minh</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Thanh điều hướng Tab chức năng */}
      <div className="mm-dashboard-tabs" style={{ marginTop: '2rem' }}>
        <button
          type="button"
          className={`mm-dash-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          💳 Sổ Giao Dịch Thu / Chi
        </button>
        <button
          type="button"
          className={`mm-dash-tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📁 Quản Lý Danh Mục
        </button>
      </div>

      {/* Tab 1: Giao Dịch Tài Chính (Form thêm & Danh sách) */}
      {activeTab === 'transactions' && (
        <div className="mm-transactions-grid" style={{ marginTop: '1.25rem' }}>
          <AddTransactionForm
            onSuccess={() => setTxRefreshTrigger((prev) => prev + 1)}
            categoryRefreshTrigger={catRefreshTrigger}
          />
          <TransactionList
            refreshTrigger={txRefreshTrigger}
            onAddNewTransaction={() => {
              const amountInput = document.getElementById('tx-amount') as HTMLInputElement | null;
              amountInput?.focus();
              amountInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        </div>
      )}

      {/* Tab 2: Quản Lý Danh Mục (CategoryManager) */}
      {activeTab === 'categories' && (
        <div style={{ marginTop: '1.25rem' }}>
          <CategoryManager
            onCategoriesChange={() => {
              setCatRefreshTrigger((prev) => prev + 1);
              setTxRefreshTrigger((prev) => prev + 1);
            }}
          />
        </div>
      )}
    </div>
  );
}
