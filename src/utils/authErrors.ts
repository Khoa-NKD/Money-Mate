import type { AuthError } from '@supabase/supabase-js';

/**
 * Chuyển đổi thông báo lỗi từ Supabase Auth sang tiếng Việt thân thiện với người dùng
 */
export function getAuthErrorMessage(error: AuthError | Error | null | unknown): string {
  if (!error) return '';

  const rawMessage = (error as { message?: string })?.message || '';
  const errorCode = (error as { code?: string })?.code || '';
  const lowerMsg = rawMessage.toLowerCase();

  // 1. Lỗi đăng nhập sai tài khoản hoặc mật khẩu
  if (
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid credentials') ||
    errorCode === 'invalid_credentials'
  ) {
    return 'Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.';
  }

  // 2. Lỗi email đã tồn tại / trùng lặp khi đăng ký
  if (
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('already exists') ||
    errorCode === 'user_already_exists'
  ) {
    return 'Email này đã được đăng ký tài khoản. Vui lòng đăng nhập hoặc dùng email khác.';
  }

  // 3. Lỗi mật khẩu không đủ độ dài
  if (
    lowerMsg.includes('password should be at least') ||
    lowerMsg.includes('at least 6 characters') ||
    errorCode === 'weak_password'
  ) {
    return 'Mật khẩu phải chứa tối thiểu 6 ký tự.';
  }

  // 4. Lỗi định dạng email
  if (
    lowerMsg.includes('invalid email') ||
    lowerMsg.includes('unable to validate email') ||
    errorCode === 'validation_failed'
  ) {
    return 'Định dạng email không hợp lệ. Ví dụ: user@example.com';
  }

  // 5. Lỗi chưa xác thực email
  if (lowerMsg.includes('email not confirmed')) {
    return 'Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư (cả mục Spam/Junk) để kích hoạt.';
  }

  // 6. Lỗi vượt quá giới hạn gửi yêu cầu (Rate Limit)
  if (
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('too many requests') ||
    errorCode === 'over_request_rate_limit'
  ) {
    return 'Bạn đã thao tác quá nhiều lần liên tiếp. Vui lòng thử lại sau vài phút.';
  }

  // 7. Lỗi kết nối mạng
  if (lowerMsg.includes('fetch failed') || lowerMsg.includes('network request failed')) {
    return 'Không thể kết nối đến máy chủ Supabase. Vui lòng kiểm tra kết nối internet.';
  }

  // Fallback: trả về lỗi gốc nếu có, hoặc thông báo chung
  return rawMessage || 'Đã có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại.';
}
