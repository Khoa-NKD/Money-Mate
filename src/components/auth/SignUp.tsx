import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { EyeIcon, EyeOffIcon, AlertTriangleIcon, CheckIcon } from '../ui/Icons';

interface SignUpProps {
  onSwitchToSignIn?: () => void;
}

export function SignUp({ onSwitchToSignIn }: SignUpProps) {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    const trimmedFullName = fullName.trim();

    // 1. Validation đầu vào
    if (!trimmedEmail) {
      setErrorMessage('Vui lòng nhập địa chỉ email.');
      return;
    }

    if (!password) {
      setErrorMessage('Vui lòng nhập mật khẩu.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải có độ dài tối thiểu 6 ký tự.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp. Vui lòng nhập lại.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await signUp(trimmedEmail, password, trimmedFullName);

      if (error) {
        setErrorMessage(getAuthErrorMessage(error));
        return;
      }

      if (data?.requiresEmailConfirmation) {
        setSuccessMessage(
          'Đăng ký tài khoản thành công! Vui lòng kiểm tra hộp thư email để kích hoạt tài khoản của bạn.'
        );
      } else {
        setSuccessMessage('Đăng ký tài khoản thành công! Đang chuyển hướng...');
      }
    } catch (err) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchToSignIn = () => {
    if (onSwitchToSignIn) {
      onSwitchToSignIn();
    } else {
      navigate('/login');
    }
  };

  return (
    <div className='mm-auth-card'>
      <div className='mm-auth-header'>
        <h2 className='mm-auth-title'>Tạo Tài Khoản Mới</h2>
        <p className='mm-auth-desc'>Bắt đầu hành trình quản lý tài chính thông minh</p>
      </div>

      {errorMessage && (
        <div className='mm-alert mm-alert-error' role='alert'>
          <span className='mm-alert-icon'>
            <AlertTriangleIcon size={18} />
          </span>
          <div className='mm-alert-content'>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className='mm-alert mm-alert-success' role='status'>
          <span className='mm-alert-icon'>
            <CheckIcon size={18} />
          </span>
          <div className='mm-alert-content'>{successMessage}</div>
        </div>
      )}

      <form className='mm-auth-form' onSubmit={handleSubmit}>
        <div className='mm-form-group'>
          <label htmlFor='signup-fullname' className='mm-form-label'>
            Họ và tên
          </label>
          <input
            id='signup-fullname'
            type='text'
            className='mm-input'
            placeholder='Nguyễn Văn A'
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSubmitting}
            autoComplete='name'
          />
        </div>

        <div className='mm-form-group'>
          <label htmlFor='signup-email' className='mm-form-label'>
            Email <span className='text-danger'>*</span>
          </label>
          <input
            id='signup-email'
            type='email'
            className='mm-input'
            placeholder='tenban@example.com'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            autoComplete='email'
            required
          />
        </div>

        <div className='mm-form-group'>
          <div className='mm-form-label-row'>
            <label htmlFor='signup-password' className='mm-form-label'>
              Mật khẩu <span className='text-danger'>*</span>
            </label>
            <span className='mm-form-hint'>Tối thiểu 6 ký tự</span>
          </div>
          <div className='mm-input-wrapper'>
            <input
              id='signup-password'
              type={showPassword ? 'text' : 'password'}
              className='mm-input mm-input-with-action'
              placeholder='Nhập ít nhất 6 ký tự'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete='new-password'
              minLength={6}
              required
            />
            <button
              type='button'
              className='mm-btn-ghost-action'
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </div>

        <div className='mm-form-group'>
          <label htmlFor='signup-confirm-password' className='mm-form-label'>
            Xác nhận mật khẩu <span className='text-danger'>*</span>
          </label>
          <input
            id='signup-confirm-password'
            type={showPassword ? 'text' : 'password'}
            className='mm-input'
            placeholder='Nhập lại mật khẩu'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isSubmitting}
            autoComplete='new-password'
            minLength={6}
            required
          />
        </div>

        <button
          type='submit'
          className='mm-btn mm-btn-primary mm-btn-full'
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className='mm-btn-spinner-text'>
              <span className='mm-spinner'></span> Đang tạo tài khoản...
            </span>
          ) : (
            'Tạo Tài Khoản'
          )}
        </button>
      </form>

      <div className='mm-auth-footer'>
        <span>Đã có tài khoản MoneyMate?</span>{' '}
        <button
          type='button'
          className='mm-link-btn'
          onClick={handleSwitchToSignIn}
          disabled={isSubmitting}
        >
          Đăng nhập ngay
        </button>
      </div>
    </div>
  );
}
