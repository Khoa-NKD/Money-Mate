-- ============================================================================
-- MONEYMATE SQL MIGRATION: COMPOSITE UNIQUE & COMPOSITE FOREIGN KEY
-- Đảm bảo giao dịch chỉ có thể liên kết với danh mục thuộc CÙNG một người dùng
-- ============================================================================

-- 1. Thêm ràng buộc UNIQUE trên bộ đôi (id, user_id) của bảng categories
-- Cho phép Foreign Key tham chiếu đồng thời cả (id, user_id)
ALTER TABLE public.categories
  DROP CONSTRAINT IF EXISTS categories_id_user_id_key;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_id_user_id_key UNIQUE (id, user_id);

-- 2. Xóa ràng buộc Foreign Key đơn cũ trên bảng transactions
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_category_id_fkey;

-- 3. Tạo Composite Foreign Key: (category_id, user_id) -> categories(id, user_id)
-- Đảm bảo mỗi giao dịch chỉ có thể tham chiếu tới danh mục của CHÍNH người dùng đó
ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_category_same_owner_fkey;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_category_same_owner_fkey
  FOREIGN KEY (category_id, user_id)
  REFERENCES public.categories (id, user_id)
  ON DELETE SET NULL;
