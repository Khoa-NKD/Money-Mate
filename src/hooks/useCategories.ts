import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../types/database';

/**
 * Kết quả trả về từ hook useCategories
 */
export interface UseCategoriesReturn {
  /** Danh sách danh mục của người dùng hiện tại, sắp xếp theo tên */
  categories: Category[];
  /** Trạng thái đang tải dữ liệu */
  loading: boolean;
  /** Thông báo lỗi nếu có */
  error: string | null;
  /** Hàm kích hoạt tải lại danh sách danh mục thủ công */
  refetch: () => void;
  /** Thêm mới danh mục */
  addCategory: (input: CreateCategoryInput) => Promise<{ data: Category | null; error: string | null }>;
  /** Cập nhật danh mục theo id */
  updateCategory: (id: string, updates: UpdateCategoryInput) => Promise<{ data: Category | null; error: string | null }>;
  /** Kiểm tra số lượng giao dịch đang tham chiếu đến danh mục này */
  checkCategoryReferences: (id: string) => Promise<number>;
  /** Xóa danh mục (từ chối xóa nếu có giao dịch tham chiếu) */
  deleteCategory: (id: string) => Promise<{ success: boolean; error: string | null; referencedCount?: number }>;
  /** Chuyển giao dịch sang danh mục mới rồi xóa danh mục cũ */
  reassignAndDeleteCategory: (
    targetDeleteId: string,
    replacementCategoryId: string | null
  ) => Promise<{ success: boolean; error: string | null }>;
}

/**
 * Hook quản lý CRUD danh mục (categories) của người dùng hiện tại từ Supabase
 * Sử dụng anon key và tuân thủ chặt chẽ RLS policy (SELECT auth.uid()) = user_id
 */
export function useCategories(): UseCategoriesReturn {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  /**
   * Lấy ID người dùng hiện tại
   */
  const getCurrentUserId = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user?.id) return session.user.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user?.id || null;
  };

  /**
   * Tải danh sách danh mục sắp xếp theo tên (order by name)
   */
  useEffect(() => {
    let isCancelled = false;

    async function loadCategories() {
      setLoading(true);
      setError(null);

      try {
        const userId = await getCurrentUserId();

        if (!userId) {
          if (!isCancelled) {
            setCategories([]);
            setLoading(false);
          }
          return;
        }

        // Truy vấn bảng categories với RLS filter (order by name)
        const { data, error: queryError } = await supabase
          .from('categories')
          .select('id, user_id, name, color, icon, created_at')
          .eq('user_id', userId)
          .order('name', { ascending: true });

        if (isCancelled) return;

        if (queryError) {
          setError(queryError.message || 'Lỗi khi tải danh mục thu chi.');
          setCategories([]);
        } else if (data) {
          setCategories(data as Category[]);
        }
      } catch (err) {
        if (!isCancelled) {
          const errMsg =
            err instanceof Error
              ? err.message
              : 'Đã xảy ra lỗi không xác định khi tải danh mục.';
          setError(errMsg);
          setCategories([]);
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadCategories();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        void loadCategories();
      } else if (event === 'SIGNED_OUT') {
        if (!isCancelled) {
          setCategories([]);
          setLoading(false);
        }
      }
    });

    return () => {
      isCancelled = true;
      subscription.unsubscribe();
    };
  }, [reloadTrigger]);

  const refetch = useCallback(() => {
    setReloadTrigger((prev) => prev + 1);
  }, []);

  /**
   * 1. Thêm danh mục mới
   */
  const addCategory = useCallback(
    async (input: CreateCategoryInput): Promise<{ data: Category | null; error: string | null }> => {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        return { data: null, error: 'Tên danh mục không được để trống.' };
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: null, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
      }

      try {
        const { data, error: insertError } = await supabase
          .from('categories')
          .insert({
            user_id: userId,
            name: trimmedName,
            color: input.color || '#10B981',
            icon: input.icon || '📁',
          })
          .select()
          .single();

        if (insertError) {
          let msg = insertError.message;
          if (insertError.code === '23505') {
            msg = 'Danh mục với tên này đã tồn tại trong tài khoản của bạn.';
          } else if (insertError.code === '42501') {
            msg = 'Bạn không có quyền thêm danh mục (vi phạm chính sách RLS).';
          }
          return { data: null, error: msg };
        }

        refetch();
        return { data: data as Category, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Lỗi không xác định khi thêm danh mục.',
        };
      }
    },
    [refetch]
  );

  /**
   * 2. Sửa danh mục theo id
   */
  const updateCategory = useCallback(
    async (
      id: string,
      updates: UpdateCategoryInput
    ): Promise<{ data: Category | null; error: string | null }> => {
      if (!id) {
        return { data: null, error: 'ID danh mục không hợp lệ.' };
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        return { data: null, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
      }

      const updatePayload: Record<string, unknown> = {};
      if (updates.name !== undefined) {
        const trimmed = updates.name.trim();
        if (!trimmed) {
          return { data: null, error: 'Tên danh mục không được để trống.' };
        }
        updatePayload.name = trimmed;
      }
      if (updates.color !== undefined) {
        updatePayload.color = updates.color;
      }
      if (updates.icon !== undefined) {
        updatePayload.icon = updates.icon;
      }

      try {
        const { data, error: updateError } = await supabase
          .from('categories')
          .update(updatePayload)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (updateError) {
          let msg = updateError.message;
          if (updateError.code === '23505') {
            msg = 'Tên danh mục này đã tồn tại.';
          } else if (updateError.code === '42501') {
            msg = 'Bạn không có quyền sửa danh mục này.';
          }
          return { data: null, error: msg };
        }

        refetch();
        return { data: data as Category, error: null };
      } catch (err) {
        return {
          data: null,
          error: err instanceof Error ? err.message : 'Lỗi không xác định khi sửa danh mục.',
        };
      }
    },
    [refetch]
  );

  /**
   * 3. Kiểm tra số lượng giao dịch đang tham chiếu đến danh mục này
   */
  const checkCategoryReferences = useCallback(async (id: string): Promise<number> => {
    const userId = await getCurrentUserId();
    if (!userId) return 0;

    try {
      const { count, error: countError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', id)
        .eq('user_id', userId);

      if (countError) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  }, []);

  /**
   * 4. Xóa danh mục
   * Yêu cầu: KHÔNG xóa cứng khi có giao dịch tham chiếu, báo lỗi thân thiện
   */
  const deleteCategory = useCallback(
    async (id: string): Promise<{ success: boolean; error: string | null; referencedCount?: number }> => {
      if (!id) {
        return { success: false, error: 'ID danh mục không hợp lệ.' };
      }

      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
      }

      try {
        // Kiểm tra xem có giao dịch nào đang tham chiếu danh mục này không
        const referencedCount = await checkCategoryReferences(id);
        if (referencedCount > 0) {
          return {
            success: false,
            referencedCount,
            error: `Không thể xóa: Danh mục này đang được sử dụng bởi ${referencedCount} giao dịch. Vui lòng chuyển các giao dịch sang danh mục khác trước khi xóa.`,
          };
        }

        // An toàn xóa khi không có giao dịch tham chiếu
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        refetch();
        return { success: true, error: null };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Lỗi không xác định khi xóa danh mục.',
        };
      }
    },
    [checkCategoryReferences, refetch]
  );

  /**
   * 5. Chuyển đổi giao dịch sang danh mục khác và xóa danh mục cũ
   */
  const reassignAndDeleteCategory = useCallback(
    async (
      targetDeleteId: string,
      replacementCategoryId: string | null
    ): Promise<{ success: boolean; error: string | null }> => {
      const userId = await getCurrentUserId();
      if (!userId) {
        return { success: false, error: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.' };
      }

      try {
        // Cập nhật toàn bộ các giao dịch đang tham chiếu sang danh mục mới (hoặc null)
        const { error: updateTxError } = await supabase
          .from('transactions')
          .update({ category_id: replacementCategoryId })
          .eq('category_id', targetDeleteId)
          .eq('user_id', userId);

        if (updateTxError) {
          return {
            success: false,
            error: `Lỗi khi chuyển đổi giao dịch: ${updateTxError.message}`,
          };
        }

        // Sau khi đã chuyển đổi thành công, thực hiện xóa danh mục cũ
        const { error: deleteError } = await supabase
          .from('categories')
          .delete()
          .eq('id', targetDeleteId)
          .eq('user_id', userId);

        if (deleteError) {
          return {
            success: false,
            error: `Lỗi khi xóa danh mục: ${deleteError.message}`,
          };
        }

        refetch();
        return { success: true, error: null };
      } catch (err) {
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Lỗi không xác định khi chuyển đổi và xóa.',
        };
      }
    },
    [refetch]
  );

  return {
    categories,
    loading,
    error,
    refetch,
    addCategory,
    updateCategory,
    checkCategoryReferences,
    deleteCategory,
    reassignAndDeleteCategory,
  };
}
