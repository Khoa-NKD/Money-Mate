import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Kết quả trả về từ hook useDeleteTransaction
 */
export interface UseDeleteTransactionReturn {
  /** Hàm thực thi xóa giao dịch theo id */
  deleteTransaction: (id: string) => Promise<boolean>;
  /** Trạng thái đang gửi yêu cầu xóa tới Supabase */
  loading: boolean;
  /** Thông báo lỗi nếu quá trình xóa thất bại (null nếu không có lỗi) */
  error: string | null;
}

/**
 * React hook xóa một giao dịch tài chính theo id
 * Tuân thủ RLS policy DELETE USING ((SELECT auth.uid()) = user_id)
 */
export function useDeleteTransaction(): UseDeleteTransactionReturn {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Xóa giao dịch theo id
   */
  const deleteTransaction = useCallback(async (id: string): Promise<boolean> => {
    if (!id) {
      setError('ID giao dịch cần xóa không hợp lệ.');
      return false;
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
          return false;
        }
        currentUserId = user.id;
      }

      // 2. Thực hiện xóa bản ghi theo ID trên bảng transactions
      // Supabase RLS sẽ kiểm tra USING ((SELECT auth.uid()) = user_id)
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (deleteError) {
        let friendlyError = deleteError.message;
        if (deleteError.code === '42501') {
          friendlyError = 'Bạn không có quyền xóa giao dịch này (vi phạm chính sách Row Level Security).';
        }
        setError(friendlyError);
        return false;
      }

      // 3. Xóa thành công
      return true;
    } catch (err) {
      const unexpectedError =
        err instanceof Error
          ? err.message
          : 'Đã xảy ra lỗi không xác định khi xóa giao dịch.';
      setError(unexpectedError);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteTransaction,
    loading,
    error,
  };
}
