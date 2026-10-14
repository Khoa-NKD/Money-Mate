import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Transaction, UpdateTransactionInput } from '../types/database';

/**
 * Kết quả trả về từ hook useUpdateTransaction
 */
export interface UseUpdateTransactionReturn {
  /** Hàm thực thi cập nhật giao dịch theo id */
  updateTransaction: (
    id: string,
    updates: UpdateTransactionInput
  ) => Promise<Transaction | null>;
  /** Trạng thái đang gửi yêu cầu và chờ phản hồi từ Supabase */
  loading: boolean;
  /** Thông báo lỗi nếu quá trình sửa thất bại (null nếu không có lỗi) */
  error: string | null;
}

/**
 * React hook sửa (update) một giao dịch tài chính theo id
 * Tuân thủ RLS policy WITH CHECK ((SELECT auth.uid()) = user_id)
 */
export function useUpdateTransaction(): UseUpdateTransactionReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cập nhật thông tin giao dịch theo id
   */
  const updateTransaction = useCallback(
    async (
      id: string,
      updates: UpdateTransactionInput
    ): Promise<Transaction | null> => {
      if (!id) {
        setError('ID giao dịch không hợp lệ.');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Kiểm tra phiên đăng nhập của người dùng
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let currentUserId = session?.user?.id;

        if (!currentUserId) {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
            return null;
          }
          currentUserId = user.id;
        }

        // 2. Validate và chuẩn bị payload cập nhật
        const updatePayload: Record<string, unknown> = {};

        // Kiểm tra số tiền (nếu có cập nhật)
        if (updates.amount !== undefined) {
          const numericAmount = Number(updates.amount);
          if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('Số tiền giao dịch phải là một số dương lớn hơn 0.');
            return null;
          }
          updatePayload.amount = numericAmount;
        }

        // Kiểm tra loại giao dịch
        if (updates.type !== undefined) {
          if (updates.type !== 'income' && updates.type !== 'expense') {
            setError('Loại giao dịch không hợp lệ. Chỉ chấp nhận "income" hoặc "expense".');
            return null;
          }
          updatePayload.type = updates.type;
        }

        // Danh mục
        if (updates.category_id !== undefined) {
          updatePayload.category_id = updates.category_id || null;
        }

        // Ghi chú
        if (updates.note !== undefined) {
          updatePayload.note = updates.note ? updates.note.trim() : null;
        }

        // Chuẩn hóa ngày diễn ra giao dịch
        if (updates.occurred_on !== undefined && updates.occurred_on !== null) {
          const parsedDate =
            updates.occurred_on instanceof Date
              ? updates.occurred_on
              : new Date(updates.occurred_on);

          if (isNaN(parsedDate.getTime())) {
            setError('Ngày diễn ra giao dịch (occurred_on) không hợp lệ.');
            return null;
          }
          updatePayload.occurred_at = parsedDate.toISOString();
        } else if (updates.occurred_at !== undefined) {
          updatePayload.occurred_at = updates.occurred_at;
        }

        // Lưu ý: Tuyệt đối không thay đổi `user_id` để tuân thủ WITH CHECK ((SELECT auth.uid()) = user_id)

        // 3. Thực hiện UPDATE theo id trên bảng transactions
        const { data, error: updateError } = await supabase
          .from('transactions')
          .update(updatePayload)
          .eq('id', id)
          .select()
          .single();

        // 4. Xử lý phản hồi lỗi từ Supabase
        if (updateError) {
          let friendlyError = updateError.message;

          if (updateError.code === '23503') {
            friendlyError = 'Danh mục đã chọn không tồn tại hoặc không thuộc quyền sở hữu của bạn.';
          } else if (updateError.code === '42501') {
            friendlyError = 'Bạn không có quyền cập nhật giao dịch này (vi phạm chính sách Row Level Security).';
          } else if (updateError.code === '23514') {
            friendlyError = 'Dữ liệu giao dịch không thỏa mãn ràng buộc của cơ sở dữ liệu.';
          }

          setError(friendlyError);
          return null;
        }

        // 5. Cập nhật thành công, trả về bản ghi giao dịch đã cập nhật
        return data as Transaction;
      } catch (err) {
        const unexpectedError =
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi không xác định khi cập nhật giao dịch.';
        setError(unexpectedError);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    updateTransaction,
    loading,
    error,
  };
}
