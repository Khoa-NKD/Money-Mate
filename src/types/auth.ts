import type { User, Session, AuthError } from '@supabase/supabase-js';

/**
 * Kết quả trả về sau khi đăng ký tài khoản
 */
export interface SignUpResult {
  user: User | null;
  session: Session | null;
  requiresEmailConfirmation: boolean;
}

/**
 * Interface cho AuthContext dùng chung trong ứng dụng
 */
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    fullName?: string
  ) => Promise<{ data: SignUpResult | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

/**
 * Chế độ hiển thị form xác thực
 */
export type AuthViewMode = 'signin' | 'signup';
