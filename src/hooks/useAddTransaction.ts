import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, TransactionType } from '../types/database';

/**
 * Dữ liệu đầu vào để tạo mới một giao dịch tài chính
 */
export interface AddTransactionInput {
  /** ID của danh mục thu / chi (tùy chọn, null nếu không có danh mục) */
  category_id?: string | null;
  /** Số tiền giao dịch (bắt buộc, phải lớn hơn 0) */
  amount: number;
  /** Loại giao dịch: 'income' (thu nhập) hoặc 'expense' (chi phí) */
  type: TransactionType;
  /** Ghi chú chi tiết về giao dịch (tùy chọn) */
  note?: string | null;
  /** Ngày diễn ra giao dịch (dạng chuỗi YYYY-MM-DD/ISO hoặc đối tượng Date) */
  occurred_on?: string | Date | null;
}

/**
 * Kết quả trả về từ hook useAddTransaction
 */
export interface UseAddTransactionReturn {
  /** Hàm thực thi thêm giao dịch vào database */
  addTransaction: (input?: Partial<AddTransactionInput>) => Promise<Transaction | null>;
  /** Trạng thái đang gửi yêu cầu và chờ phản hồi từ Supabase */
  loading: boolean;
  /** Thông báo lỗi nếu quá trình thêm thất bại (null nếu không có lỗi) */
  error: string | null;
}

/**
 * React hook thêm mới giao dịch vào bảng transactions trên Supabase
 *
 * @param initialInput Dữ liệu khởi tạo mặc định (tùy chọn).
 * Có thể truyền dữ liệu tại hook hoặc truyền trực tiếp vào hàm `addTransaction`.
 *
 * @example
 * ```tsx
 * const { addTransaction, loading, error } = useAddTransaction();
 *
 * const handleSubmit = async () => {
 *   const result = await addTransaction({
 *     category_id: selectedCategoryId,
 *     amount: 50000,
 *     type: 'expense',
 *     note: 'Ăn trưa',
 *     occurred_on: '2026-10-13',
 *   });
 *
 *   if (result) {
 *     console.log('Thêm giao dịch thành công:', result.id);
 *   }
 * };
 * ```
 */
export function useAddTransaction(
  initialInput?: Partial<AddTransactionInput>
): UseAddTransactionReturn {
  // Trạng thái đang tải (loading)
  const [loading, setLoading] = useState<boolean>(false);
  // Trạng thái thông báo lỗi (error message)
  const [error, setError] = useState<string | null>(null);

  // Sử dụng useRef để lưu dữ liệu khởi tạo, tránh việc hàm addTransaction bị re-create khi component re-render
  const initialInputRef = useRef(initialInput);
  useEffect(() => {
    initialInputRef.current = initialInput;
  }, [initialInput]);

  /**
   * Hàm xử lý thêm giao dịch vào bảng transactions
   */
  const addTransaction = useCallback(
    async (overrideInput?: Partial<AddTransactionInput>): Promise<Transaction | null> => {
      // Bắt đầu quá trình: reset lỗi trước đó và bật loading
      setLoading(true);
      setError(null);

      try {
        // Hợp nhất dữ liệu khởi tạo ban đầu và dữ liệu truyền khi gọi hàm
        const payload: Partial<AddTransactionInput> = {
          ...initialInputRef.current,
          ...overrideInput,
        };

        // 1. Kiểm tra số tiền (amount)
        if (payload.amount === undefined || payload.amount === null) {
          const errMsg = 'Vui lòng nhập số tiền giao dịch.';
          setError(errMsg);
          return null;
        }

        const numericAmount = Number(payload.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
          const errMsg = 'Số tiền giao dịch phải là một số dương lớn hơn 0.';
          setError(errMsg);
          return null;
        }

        // 2. Kiểm tra loại giao dịch (type)
        if (!payload.type || (payload.type !== 'income' && payload.type !== 'expense')) {
          const errMsg = 'Loại giao dịch không hợp lệ. Vui lòng chọn "income" hoặc "expense".';
          setError(errMsg);
          return null;
        }

        // 3. Chuẩn hóa ngày diễn ra giao dịch (occurred_on -> occurred_at)
        let occurredAt: string;
        if (payload.occurred_on) {
          const dateObj =
            payload.occurred_on instanceof Date
              ? payload.occurred_on
              : new Date(payload.occurred_on);

          if (isNaN(dateObj.getTime())) {
            const errMsg = 'Ngày diễn ra giao dịch (occurred_on) không hợp lệ.';
            setError(errMsg);
            return null;
          }
          occurredAt = dateObj.toISOString();
        } else {
          // Mặc định lấy thời điểm hiện tại nếu người dùng không truyền ngày
          occurredAt = new Date().toISOString();
        }

        // 4. Lấy thông tin user.id của người dùng đang đăng nhập
        // Kiểm tra phiên làm việc hiện tại (session) từ Supabase Auth
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentUserId = session?.user?.id;

        // Nếu session cache chưa có sẵn, truy vấn trực tiếp từ supabase.auth.getUser()
        if (!currentUserId) {
          const {
            data: { user },
            error: getUserError,
          } = await supabase.auth.getUser();

          if (getUserError || !user) {
            const errMsg = 'Người dùng chưa đăng nhập. Vui lòng đăng nhập để thực hiện giao dịch.';
            setError(errMsg);
            return null;
          }

          currentUserId = user.id;
        }

        // 5. Thêm giao dịch vào bảng transactions kèm user_id tự động
        const { data: insertedTransaction, error: insertError } = await supabase
          .from('transactions')
          .insert({
            user_id: currentUserId,
            category_id: payload.category_id || null,
            amount: numericAmount,
            type: payload.type,
            note: payload.note ? payload.note.trim() : null,
            occurred_at: occurredAt,
          })
          .select()
          .single();

        // 6. Xử lý lỗi phản hồi từ Supabase
        if (insertError) {
          let friendlyError = insertError.message;

          // Bắt các mã lỗi thông dụng trong PostgreSQL
          if (insertError.code === '23503') {
            // Ràng buộc Composite FK: (category_id, user_id) phải trùng khớp
            friendlyError = 'Danh mục đã chọn không tồn tại hoặc không thuộc quyền sở hữu của bạn.';
          } else if (insertError.code === '42501') {
            // Vi phạm chính sách RLS
            friendlyError = 'Bạn không có quyền thêm giao dịch này (vi phạm chính sách Row Level Security).';
          } else if (insertError.code === '23514') {
            // Ràng buộc CHECK constraint (ví dụ amount <= 0)
            friendlyError = 'Dữ liệu giao dịch không thỏa mãn ràng buộc của cơ sở dữ liệu.';
          }

          setError(friendlyError);
          return null;
        }

        // 7. Thêm thành công, trả về bản ghi giao dịch vừa tạo
        return insertedTransaction as Transaction;
      } catch (err) {
        // Bắt các ngoại lệ phát sinh ngoài ý muốn (mất mạng, lỗi runtime...)
        const unexpectedError =
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi không xác định khi thêm giao dịch.';
        setError(unexpectedError);
        return null;
      } finally {
        // Tắt trạng thái loading sau khi kết thúc tác vụ
        setLoading(false);
      }
    },
    []
  );

  return {
    addTransaction,
    loading,
    error,
  };
}
