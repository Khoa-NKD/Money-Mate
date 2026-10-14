-- ============================================================================
-- MONEYMATE SQL MIGRATION: TỐI ƯU HÓA ROW LEVEL SECURITY (RLS) & INDEXES
-- Bảng: public.categories & public.transactions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BƯỚC 1: BẬT ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- BƯỚC 2: TỐI ƯU INDEXES TRÊN CỘT user_id ĐỂ TRUY VẤN RLS NHANH CHÓNG
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_categories_user_id 
  ON public.categories(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
  ON public.transactions(user_id);

-- ----------------------------------------------------------------------------
-- BƯỚC 3: POLICIES TỐI ƯU CHO BẢNG public.categories
-- (Áp dụng TO authenticated và bọc (SELECT auth.uid()))
-- ----------------------------------------------------------------------------

-- (1) SELECT: Chỉ người dùng đã xác thực mới đọc được danh mục của chính mình
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy"
  ON public.categories
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- (2) INSERT: Chỉ người dùng đã xác thực mới thêm được danh mục gán đúng user_id
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
CREATE POLICY "categories_insert_policy"
  ON public.categories
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- (3) UPDATE: Chỉ người dùng đã xác thực mới sửa được danh mục của mình (không đổi user_id)
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
CREATE POLICY "categories_update_policy"
  ON public.categories
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- (4) DELETE: Chỉ người dùng đã xác thực mới xóa được danh mục của mình
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;
CREATE POLICY "categories_delete_policy"
  ON public.categories
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- BƯỚC 4: POLICIES TỐI ƯU CHO BẢNG public.transactions
-- (Áp dụng TO authenticated và bọc (SELECT auth.uid()))
-- ----------------------------------------------------------------------------

-- (1) SELECT: Chỉ người dùng đã xác thực mới đọc được giao dịch của chính mình
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
CREATE POLICY "transactions_select_policy"
  ON public.transactions
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- (2) INSERT: Chỉ người dùng đã xác thực mới thêm được giao dịch gán đúng user_id
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
CREATE POLICY "transactions_insert_policy"
  ON public.transactions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- (3) UPDATE: Chỉ người dùng đã xác thực mới sửa được giao dịch của mình (không đổi user_id)
DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
CREATE POLICY "transactions_update_policy"
  ON public.transactions
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- (4) DELETE: Chỉ người dùng đã xác thực mới xóa được giao dịch của mình
DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;
CREATE POLICY "transactions_delete_policy"
  ON public.transactions
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);
