/**
 * Phân loại giao dịch tài chính trong MoneyMate
 */
export type TransactionType = 'income' | 'expense';

/**
 * Entity Danh mục thu / chi (categories)
 */
export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  icon: string | null;
  created_at?: string;
}

/**
 * Entity Giao dịch tài chính (transactions)
 */
export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  occurred_at: string;
  created_at?: string;
}

/**
 * Giao dịch kèm dữ liệu chi tiết danh mục (Join query)
 */
export interface TransactionWithCategory extends Transaction {
  category: Category | null;
}

/**
 * Giao dịch kèm dữ liệu chi tiết danh mục và thuộc tính ngày occurred_on phụ trợ
 */
export interface TransactionListItem extends TransactionWithCategory {
  occurred_on: string;
}


/**
 * Dữ liệu đầu vào khi tạo mới Category
 */
export interface CreateCategoryInput {
  name: string;
  color?: string | null;
  icon?: string | null;
}

/**
 * Dữ liệu đầu vào khi cập nhật Category
 */
export interface UpdateCategoryInput {
  name?: string;
  color?: string | null;
  icon?: string | null;
}


/**
 * Dữ liệu đầu vào khi cập nhật Transaction
 */
export interface UpdateTransactionInput {
  category_id?: string | null;
  amount?: number;
  type?: TransactionType;
  note?: string | null;
  occurred_at?: string;
  occurred_on?: string | Date | null;
}

/**
 * Dữ liệu đầu vào cho hook useAddTransaction (hỗ trợ occurred_on)
 */
export interface AddTransactionInput {
  category_id?: string | null;
  amount: number;
  type: TransactionType;
  note?: string | null;
  occurred_on?: string | Date | null;
}

