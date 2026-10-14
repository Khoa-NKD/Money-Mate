import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { TransactionListItem } from '../types/database';

/**
 * Tùy chọn cấu hình khi truy vấn danh sách giao dịch
 */
export interface UseTransactionsOptions {
  /** Giới hạn số lượng bản ghi tải về (mặc định: 50) */
  limit?: number;
  /** Lọc theo loại giao dịch: 'income' (thu nhập) hoặc 'expense' (chi phí) */
  type?: 'income' | 'expense';
}

/**
 * Kết quả trả về từ hook useTransactions
 */
export interface UseTransactionsReturn {
  /** Danh sách các giao dịch tài chính tải về */
  transactions: TransactionListItem[];
  /** Trạng thái đang tải dữ liệu (true/false) */
  loading: boolean;
  /** Thông báo lỗi nếu có lỗi xảy ra */
  error: string | null;
  /** Hàm kích hoạt tải lại danh sách giao dịch thủ công */
  refetch: () => void;
}

/**
 * Hook quản lý và tải danh sách giao dịch của người dùng hiện tại từ Supabase
 *
 * @param options Các tùy chọn truy vấn (limit, type)
 * @returns Object chứa `transactions`, `loading`, `error`, và `refetch`
 *
 * @example
 * ```tsx
 * const { transactions, loading, error, refetch } = useTransactions({ limit: 20 });
 * ```
 */
export function useTransactions(
  options: UseTransactionsOptions = {}
): UseTransactionsReturn {
  const { limit = 50, type } = options;

  // Danh sách giao dịch
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  // Trạng thái đang tải dữ liệu
  const [loading, setLoading] = useState<boolean>(true);
  // Thông báo lỗi (nếu có)
  const [error, setError] = useState<string | null>(null);
  // Biến đếm kích hoạt làm mới dữ liệu
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  useEffect(() => {
    let isCancelled = false;

    async function loadTransactions() {
      setLoading(true);
      setError(null);

      try {
        // 1. Lấy thông tin người dùng đang đăng nhập
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentUser = session?.user;

        // Nếu chưa có session cache, truy vấn trực tiếp từ auth server
        if (!currentUser) {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            if (!isCancelled) {
              setTransactions([]);
              setLoading(false);
            }
            return;
          }
          currentUser = user;
        }

        // 2. Truy vấn dữ liệu từ bảng transactions
        // - Defense-in-depth: lọc tường minh theo user_id kết hợp với RLS
        // - Sắp xếp theo ngày xảy ra giao dịch mới nhất (occurred_at DESC)
        let query = supabase
          .from('transactions')
          .select(`
            id,
            user_id,
            category_id,
            amount,
            type,
            note,
            occurred_at,
            created_at,
            category:categories(id, user_id, name, color, icon)
          `)
          .eq('user_id', currentUser.id)
          .order('occurred_at', { ascending: false })
          .limit(limit);

        if (type) {
          query = query.eq('type', type);
        }

        const { data, error: queryError } = await query;
        let effectiveError = queryError;
        let rawRows: any[] | null = data;

        // Fallback: nếu Supabase schema cache chưa nhận diện mối quan hệ join
        if (queryError && queryError.message.toLowerCase().includes('relationship')) {
          let fallbackQuery = supabase
            .from('transactions')
            .select('id, user_id, category_id, amount, type, note, occurred_at, created_at')
            .eq('user_id', currentUser.id)
            .order('occurred_at', { ascending: false })
            .limit(limit);

          if (type) {
            fallbackQuery = fallbackQuery.eq('type', type);
          }

          const fallbackResult = await fallbackQuery;
          effectiveError = fallbackResult.error;

          if (fallbackResult.data) {
            rawRows = fallbackResult.data.map((item) => ({
              ...item,
              category: null,
            }));
          }
        }

        if (isCancelled) return;

        // 3. Xử lý kết quả trả về
        if (effectiveError) {
          setError(effectiveError.message || 'Lỗi khi tải dữ liệu giao dịch từ máy chủ.');
          setTransactions([]);
        } else if (rawRows) {
          // Chuẩn hóa dữ liệu và thêm thuộc tính occurred_on (YYYY-MM-DD)
          const mappedList: TransactionListItem[] = rawRows.map((t: any) => {
            const rawCategory = Array.isArray(t.category) ? t.category[0] : t.category;
            const occurredOn = t.occurred_at ? t.occurred_at.split('T')[0] : '';

            return {
              id: t.id,
              user_id: t.user_id,
              category_id: t.category_id,
              amount: Number(t.amount),
              type: t.type,
              note: t.note,
              occurred_at: t.occurred_at,
              created_at: t.created_at,
              category: rawCategory || null,
              occurred_on: occurredOn,
            };
          });

          setTransactions(mappedList);
        }
      } catch (err) {
        if (!isCancelled) {
          const errMsg =
            err instanceof Error
              ? err.message
              : 'Đã xảy ra lỗi không xác định khi tải giao dịch.';
          setError(errMsg);
          setTransactions([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadTransactions();

    // Tự động làm mới khi người dùng đăng nhập hoặc token thay đổi
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void loadTransactions();
      } else if (event === 'SIGNED_OUT') {
        if (!isCancelled) {
          setTransactions([]);
          setLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [limit, type, reloadTrigger]);

  /**
   * Kích hoạt làm mới danh sách giao dịch thủ công
   */
  const refetch = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch,
  };
}
