import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getCurrentMonthString, getMonthBounds } from '../lib/dateFilter';
import type { TransactionListItem } from '../types/database';

/**
 * Tùy chọn cấu hình khi truy vấn danh sách giao dịch
 */
export interface UseTransactionsOptions {
  /** Giới hạn số lượng bản ghi tải về (mặc định: 50) */
  limit?: number;
  /** Lọc theo loại giao dịch: 'income' (thu nhập) hoặc 'expense' (chi phí) */
  type?: 'income' | 'expense';
  /**
   * Tháng cần lọc dạng YYYY-MM (ví dụ: "2026-10").
   * Mặc định là tháng hiện tại. Truyền chuỗi rỗng "" hoặc "all" để không lọc theo tháng.
   */
  month?: string;
  /**
   * ID danh mục cần lọc. Truyền chuỗi rỗng "" hoặc null hoặc "all" để không lọc theo danh mục.
   */
  categoryId?: string | null;
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
  /** Hàm kích hoạt tải lại danh sách giao dịch với bộ lọc hiện tại */
  refetch: () => void;
  /**
   * Hàm lọc giao dịch trực tiếp từ query Supabase bằng .gte/.lt trên occurred_at và .eq trên category_id.
   * KHÔNG tải hết rồi lọc ở client.
   *
   * @param filterMonth Tháng cần lọc dạng YYYY-MM (hoặc "" để xem tất cả tháng)
   * @param filterCategoryId ID danh mục cần lọc (hoặc "" để xem tất cả danh mục)
   */
  fetchFilteredTransactions: (
    filterMonth?: string,
    filterCategoryId?: string | null
  ) => Promise<void>;
  /** Tháng hiện tại đang được chọn lọc (YYYY-MM hoặc "") */
  selectedMonth: string;
  /** ID danh mục hiện tại đang được chọn lọc (UUID hoặc "") */
  selectedCategoryId: string;
  /** Set thủ công tháng lọc */
  setSelectedMonth: (month: string) => void;
  /** Set thủ công danh mục lọc */
  setSelectedCategoryId: (categoryId: string) => void;
}

/**
 * Hook quản lý và tải danh sách giao dịch của người dùng hiện tại từ Supabase
 * Hỗ trợ lọc trực tiếp trên query Supabase:
 * - .gte/.lt trên cột occurred_at khi lọc theo tháng
 * - .eq trên cột category_id khi lọc theo danh mục
 *
 * @param options Các tùy chọn truy vấn (limit, type, month, categoryId)
 */
export function useTransactions(
  options: UseTransactionsOptions = {}
): UseTransactionsReturn {
  const {
    limit = 50,
    type,
    month: initialMonth = getCurrentMonthString(),
    categoryId: initialCategoryId = '',
  } = options;

  // State bộ lọc hiện tại
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(initialCategoryId || '');

  // Danh sách giao dịch
  const [transactions, setTransactions] = useState<TransactionListItem[]>([]);
  // Trạng thái đang tải dữ liệu
  const [loading, setLoading] = useState<boolean>(true);
  // Thông báo lỗi (nếu có)
  const [error, setError] = useState<string | null>(null);
  // Biến đếm kích hoạt làm mới dữ liệu
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  // Lưu trữ giá trị filter mới nhất bằng Ref để tránh race condition trong effect
  const filterRef = useRef({
    month: selectedMonth,
    categoryId: selectedCategoryId,
    limit,
    type,
  });

  useEffect(() => {
    filterRef.current = {
      month: selectedMonth,
      categoryId: selectedCategoryId,
      limit,
      type,
    };
  }, [selectedMonth, selectedCategoryId, limit, type]);

  /**
   * Hàm thực hiện truy vấn Supabase với bộ lọc trực tiếp ở tầng database
   * Sử dụng .gte / .lt trên occurred_at và .eq trên category_id
   */
  const executeQuery = useCallback(
    async (targetMonth: string, targetCategoryId: string | null) => {
      setLoading(true);
      setError(null);

      try {
        // 1. Xác thực người dùng hiện tại
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentUser = session?.user;

        if (!currentUser) {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            setTransactions([]);
            setLoading(false);
            return;
          }
          currentUser = user;
        }

        // 2. Xây dựng câu truy vấn Supabase
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

        // Lọc theo loại thu/chi nếu có chỉ định
        if (type) {
          query = query.eq('type', type);
        }

        // 3. LỌC NGAY Ở QUERY SUPABASE BẰNG .gte / .lt TRÊN occurred_at
        if (targetMonth && targetMonth !== 'all' && targetMonth.trim() !== '') {
          const { startIso, endIso } = getMonthBounds(targetMonth);
          query = query.gte('occurred_at', startIso).lt('occurred_at', endIso);
        }

        // 4. LỌC NGAY Ở QUERY SUPABASE BẰNG .eq TRÊN category_id
        if (
          targetCategoryId &&
          targetCategoryId !== 'all' &&
          targetCategoryId.trim() !== ''
        ) {
          query = query.eq('category_id', targetCategoryId);
        }

        // 5. Thực thi câu truy vấn
        const { data, error: queryError } = await query;
        let effectiveError = queryError;
        let rawRows: any[] | null = data;

        // Fallback: nếu Supabase schema cache chưa nhận diện mối quan hệ join category
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

          // Lọc lại trên fallback query
          if (targetMonth && targetMonth !== 'all' && targetMonth.trim() !== '') {
            const { startIso, endIso } = getMonthBounds(targetMonth);
            fallbackQuery = fallbackQuery.gte('occurred_at', startIso).lt('occurred_at', endIso);
          }

          if (
            targetCategoryId &&
            targetCategoryId !== 'all' &&
            targetCategoryId.trim() !== ''
          ) {
            fallbackQuery = fallbackQuery.eq('category_id', targetCategoryId);
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

        // 6. Xử lý kết quả trả về
        if (effectiveError) {
          setError(effectiveError.message || 'Lỗi khi tải dữ liệu giao dịch từ máy chủ.');
          setTransactions([]);
        } else if (rawRows) {
          // Chuẩn hóa dữ liệu sang TransactionListItem
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
        const errMsg =
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi không xác định khi tải giao dịch.';
        setError(errMsg);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    },
    [limit, type]
  );

  /**
   * Hàm gọi khi người dùng thay đổi filter:
   * Lọc NGAY Ở QUERY Supabase, KHÔNG tải hết rồi lọc ở client
   */
  const fetchFilteredTransactions = useCallback(
    async (filterMonth?: string, filterCategoryId?: string | null) => {
      const nextMonth = filterMonth !== undefined ? filterMonth : selectedMonth;
      const nextCategory = filterCategoryId !== undefined ? (filterCategoryId || '') : selectedCategoryId;

      setSelectedMonth(nextMonth);
      setSelectedCategoryId(nextCategory);

      await executeQuery(nextMonth, nextCategory);
    },
    [selectedMonth, selectedCategoryId, executeQuery]
  );

  // Tự động load dữ liệu khi khởi tạo hoặc reloadTrigger thay đổi
  useEffect(() => {
    let isCancelled = false;

    async function initialLoad() {
      if (!isCancelled) {
        await executeQuery(filterRef.current.month, filterRef.current.categoryId);
      }
    }

    void initialLoad();

    // Lắng nghe thay đổi phiên đăng nhập
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (!isCancelled) {
          void executeQuery(filterRef.current.month, filterRef.current.categoryId);
        }
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
  }, [reloadTrigger, executeQuery]);

  /**
   * Kích hoạt làm mới danh sách giao dịch thủ công với bộ lọc hiện tại
   */
  const refetch = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch,
    fetchFilteredTransactions,
    selectedMonth,
    selectedCategoryId,
    setSelectedMonth,
    setSelectedCategoryId,
  };
}
