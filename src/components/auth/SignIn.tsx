import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { getAuthErrorMessage } from '../../utils/authErrors';

interface SignInProps {
  onSwitchToSignUp?: () => void;
}

export function SignIn({ onSwitchToSignUp }: SignInProps) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation cơ bản trước khi gọi API
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await signIn(trimmedEmail, password);

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
      } else {
        // Điều hướng về trang người dùng muốn vào hoặc mặc định /dashboard
        const fromPath = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';
        navigate(fromPath, { replace: true });
      }
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSignUp = () => {
    if (onSwitchToSignUp) {
      onSwitchToSignUp();
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="mm-auth-card">
      <div className="mm-auth-header">
        <h2 className="mm-auth-title">Chào Mừng Trở Lại</h2>
        <p className="mm-auth-desc">Đăng nhập tài khoản MoneyMate của bạn</p>
      </div>

      {errorMessage && (
        <div className="mm-alert mm-alert-error" role="alert">
          <span className="mm-alert-icon">⚠️</span>
          <div className="mm-alert-content">{errorMessage}</div>
        </div>
      )}

      <form className="mm-auth-form" onSubmit={handleSubmit}>
        <div className="mm-form-group">
          <label htmlFor="signin-email" className="mm-form-label">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            className="mm-input"
            placeholder="tenban@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
        </div>

        <div className="mm-form-group">
          <div className="mm-form-label-row">
            <label htmlFor="signin-password" className="mm-form-label">
              Mật khẩu
            </label>
          </div>
          <div className="mm-input-wrapper">
            <input
              id="signin-password"
              type={showPassword ? 'text' : 'password'}
              className="mm-input mm-input-with-action"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="mm-btn-ghost-action"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              tabIndex={-1}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="mm-btn mm-btn-primary mm-btn-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="mm-btn-spinner-text">
              <span className="mm-spinner"></span> Đang đăng nhập...
            </span>
          ) : (
            'Đăng Nhập'
          )}
        </button>
      </form>

      <div className="mm-auth-footer">
        <span>Chưa có tài khoản MoneyMate?</span>{' '}
        <button
          type="button"
          className="mm-link-btn"
          onClick={handleSwitchToSignUp}
          disabled={isSubmitting}
        >
          Đăng ký ngay
        </button>
      </div>
    </div>
  );
}
