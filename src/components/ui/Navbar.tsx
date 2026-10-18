import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import {
  WalletIcon,
  SunIcon,
  MoonIcon,
  LogOutIcon,
  ChevronDownIcon,
  UserIcon,
  SparklesIcon,
  PlusIcon,
} from './Icons';

interface NavbarProps {
  activeTab: 'transactions' | 'categories';
  onTabChange: (tab: 'transactions' | 'categories') => void;
  onOpenQuickAdd?: () => void;
}

export function Navbar({ activeTab, onTabChange, onOpenQuickAdd }: NavbarProps) {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split('@')[0] ||
    'Người dùng';

  const userInitial = (fullName[0] || user?.email?.[0] || 'M').toUpperCase();

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className='mm-navbar'>
      <div className='mm-navbar-container'>
        {/* Logo & Brand */}
        <div className='mm-navbar-brand' onClick={() => onTabChange('transactions')} role='button' tabIndex={0}>
          <div className='mm-brand-icon'>
            <WalletIcon size={22} />
          </div>
          <div className='mm-brand-text-wrap'>
            <span className='mm-brand-name'>MoneyMate</span>
            <span className='mm-brand-tagline'>Finance Hub</span>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <nav className='mm-navbar-nav' aria-label='Điều hướng chính'>
          <button
            type='button'
            className={`mm-nav-link ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => onTabChange('transactions')}
          >
            <SparklesIcon size={16} />
            <span>Sổ Thu Chi & Thống Kê</span>
          </button>
          <button
            type='button'
            className={`mm-nav-link ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => onTabChange('categories')}
          >
            <span>Quản Lý Danh Mục</span>
          </button>
        </nav>

        {/* Right Controls */}
        <div className='mm-navbar-actions'>
          {onOpenQuickAdd && (
            <button
              type='button'
              className='mm-btn mm-btn-primary mm-btn-sm mm-quick-add-btn'
              onClick={onOpenQuickAdd}
              title='Ghi chép giao dịch nhanh'
            >
              <PlusIcon size={15} />
              <span>Ghi Chép</span>
            </button>
          )}

          {/* Theme Toggle */}
          <button
            type='button'
            className='mm-icon-btn mm-theme-toggle'
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
            title={theme === 'dark' ? 'Chuyển sang Chế độ sáng' : 'Chuyển sang Chế độ tối'}
          >
            {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>

          {/* User Profile Dropdown */}
          <div className='mm-user-dropdown-wrap' ref={dropdownRef}>
            <button
              type='button'
              className='mm-user-trigger-btn'
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
              aria-haspopup='true'
              aria-label='Menu tài khoản'
            >
              <div className='mm-user-avatar'>{userInitial}</div>
              <span className='mm-user-name'>{fullName}</span>
              <ChevronDownIcon size={14} className={`mm-chevron-icon ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className='mm-dropdown-menu' role='menu'>
                <div className='mm-dropdown-header'>
                  <div className='mm-dropdown-user-info'>
                    <p className='mm-dropdown-user-name'>{fullName}</p>
                    <p className='mm-dropdown-user-email' title={user?.email}>{user?.email}</p>
                  </div>
                  <span className='mm-verified-badge' title='Tài khoản đã xác thực bảo mật'>
                    <span className='mm-pulse-dot' aria-hidden='true'></span>
                    <span>Đã xác thực</span>
                  </span>
                </div>

                <div className='mm-dropdown-divider' />

                <div className='mm-dropdown-meta'>
                  <div className='mm-dropdown-meta-item'>
                    <UserIcon size={14} />
                    <span>UID: {user?.id?.slice(0, 8)}...</span>
                  </div>
                </div>

                <div className='mm-dropdown-divider' />

                <button
                  type='button'
                  className='mm-dropdown-item mm-logout-action'
                  role='menuitem'
                  onClick={() => {
                    setDropdownOpen(false);
                    void signOut();
                  }}
                >
                  <LogOutIcon size={16} />
                  <span>Đăng Xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
