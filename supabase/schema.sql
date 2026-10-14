-- ============================================================================
-- MONEYMATE MINIMAL DATABASE SCHEMA (PostgreSQL / Supabase)
-- ============================================================================

-- 1. BẢNG CATEGORIES (Danh mục thu / chi)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  icon text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categories_id_user_id_key UNIQUE (id, user_id)
);

-- 2. BẢNG TRANSACTIONS (Giao dịch tài chính)
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id uuid,
  amount numeric(15, 2) NOT NULL CHECK (amount > 0),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  note text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT transactions_category_same_owner_fkey FOREIGN KEY (category_id, user_id)
    REFERENCES categories (id, user_id) ON DELETE SET NULL
);

-- ============================================================================
-- CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_occurred ON transactions(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- ============================================================================
-- BẢO MẬT CẤP HÀNG (ROW LEVEL SECURITY - RLS)
-- ============================================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies cho bảng categories
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
CREATE POLICY "categories_select_policy"
  ON categories FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
CREATE POLICY "categories_insert_policy"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_update_policy" ON categories;
CREATE POLICY "categories_update_policy"
  ON categories FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "categories_delete_policy" ON categories;
CREATE POLICY "categories_delete_policy"
  ON categories FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Policies cho bảng transactions
DROP POLICY IF EXISTS "transactions_select_policy" ON transactions;
CREATE POLICY "transactions_select_policy"
  ON transactions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_insert_policy" ON transactions;
CREATE POLICY "transactions_insert_policy"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_update_policy" ON transactions;
CREATE POLICY "transactions_update_policy"
  ON transactions FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "transactions_delete_policy" ON transactions;
CREATE POLICY "transactions_delete_policy"
  ON transactions FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ============================================================================
-- TRIGGER TỰ ĐỘNG KHỞI TẠO DANH MỤC MẶC ĐỊNH KHI CÓ USER MỚI
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon)
  VALUES
    (NEW.id, 'Ăn uống', '#EF4444', 'utensils'),
    (NEW.id, 'Mua sắm', '#F59E0B', 'shopping-bag'),
    (NEW.id, 'Di chuyển', '#3B82F6', 'car'),
    (NEW.id, 'Tiền lương', '#10B981', 'wallet'),
    (NEW.id, 'Khác', '#8B5CF6', 'more-horizontal');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gắn trigger lắng nghe sau khi tạo user trong auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_categories();
