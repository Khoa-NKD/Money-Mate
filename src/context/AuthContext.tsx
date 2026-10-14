import {
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { AuthContextType, SignUpResult } from '../types/auth';
import { AuthContext } from './auth-context';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    // 1. Lấy session hiện tại khi ứng dụng khởi động
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession }, error }) => {
        if (!isMounted) return;
        if (error) {
          console.error('[MoneyMate Auth] Lỗi khi lấy session ban đầu:', error.message);
        }
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('[MoneyMate Auth] Ngoại lệ khi lấy session:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    // 2. Lắng nghe thay đổi trạng thái Auth thời gian thực (Sign In, Sign Out, Token Refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // 3. Dọn dẹp listener khi component unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Đăng nhập với Email và Password
   */
  const signIn = async (
    email: string,
    password: string
  ): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  /**
   * Đăng ký tài khoản mới với Email, Password và Họ tên
   */
  const signUp = async (
    email: string,
    password: string,
    fullName?: string
  ): Promise<{ data: SignUpResult | null; error: AuthError | null }> => {
    try {
      const trimmedEmail = email.trim();
      const options = fullName?.trim()
        ? { data: { full_name: fullName.trim() } }
        : undefined;

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options,
      });

      if (error) {
        return { data: null, error };
      }

      // Xác định trường hợp tài khoản tạo thành công nhưng cần kiểm tra email xác nhận
      const requiresEmailConfirmation = !!data.user && !data.session;

      return {
        data: {
          user: data.user,
          session: data.session,
          requiresEmailConfirmation,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err as AuthError };
    }
  };

  /**
   * Đăng xuất phiên làm việc hiện tại
   */
  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err as AuthError };
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
