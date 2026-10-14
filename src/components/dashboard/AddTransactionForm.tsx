import { useState, useEffect, type FormEvent } from 'react';
import { useAddTransaction } from '../../hooks/useAddTransaction';
import { useCategories } from '../../hooks/useCategories';
import type { TransactionType } from '../../types/database';

interface AddTransactionFormProps {
  /** Callback được gọi khi thêm giao dịch thành công (ví dụ: làm mới danh sách) */
  onSuccess?: () => void;
  /** Trigger làm mới danh mục khi danh mục được tạo/sửa/xóa từ CategoryManager */
  categoryRefreshTrigger?: number;
}

/**
 * Form thêm mới giao dịch tài chính cá nhân trong MoneyMate
 */
export function AddTransactionForm({
  onSuccess,
  categoryRefreshTrigger,
}: AddTransactionFormProps) {
  // Hook thêm mới giao dịch
  const { addTransaction, loading, error } = useAddTransaction();
  // Hook tải danh mục của người dùng
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();

  // Tự động tải lại danh mục nếu có thay đổi từ CategoryManager
  useEffect(() => {
    if (categoryRefreshTrigger !== undefined && categoryRefreshTrigger > 0) {
      refetchCategories();
    }
  }, [categoryRefreshTrigger, refetchCategories]);

  // State các trường trong form
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [occurredOn, setOccurredOn] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );

  // State thông báo nội bộ
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Lọc danh mục theo loại (nếu muốn) hoặc hiển thị toàn bộ danh mục của người dùng
  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  /**
   * Thêm nhanh số tiền theo các nút gợi ý
   */
  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
    setSuccessMessage(null);
  };

  /**
   * Xử lý gửi biểu mẫu
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    // 1. Kiểm tra số tiền
    if (!isValidAmount) {
      setFormError('Vui lòng nhập số tiền hợp lệ và lớn hơn 0.');
      return;
    }

    // 2. Kiểm tra ngày
    if (!occurredOn) {
      setFormError('Vui lòng chọn ngày diễn ra giao dịch.');
      return;
    }

    // 3. Gọi hook addTransaction
    const result = await addTransaction({
      category_id: categoryId ? categoryId : null,
      amount: parsedAmount,
      type,
      note: note.trim() || null,
      occurred_on: occurredOn,
    });

    if (result) {
      const formatted = new Intl.NumberFormat('vi-VN').format(parsedAmount);
      setSuccessMessage(`Đã thêm thành công giao dịch: ${formatted} ₫!`);

      // Reset các trường nhập liệu
      setAmount('');
      setNote('');

      // Gọi callback thông báo thành công cho component cha
      if (onSuccess) {
        onSuccess();
      }

      // Tự động ẩn thông báo sau 4 giây
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }
  };

  return (
    <div className="mm-card mm-add-tx-card">
      <div className="mm-card-header">
        <div className="mm-tx-header-title">
          <span className="mm-header-icon">✍️</span>
          <h3>Thêm Giao Dịch Mới</h3>
        </div>
        <span className={`mm-badge ${type === 'expense' ? 'badge-danger-soft' : 'badge-success-soft'}`}>
          {type === 'expense' ? 'Chi Tiêu' : 'Thu Nhập'}
        </span>
      </div>

      {/* Thông báo lỗi từ form hoặc từ Supabase */}
      {(formError || error) && (
        <div className="mm-alert mm-alert-error" role="alert">
          <span className="mm-alert-icon">⚠️</span>
          <div className="mm-alert-content">{formError || error}</div>
        </div>
      )}

      {/* Thông báo thêm thành công */}
      {successMessage && (
        <div className="mm-alert mm-alert-success" role="alert">
          <span className="mm-alert-icon">✅</span>
          <div className="mm-alert-content">{successMessage}</div>
        </div>
      )}

      <form className="mm-tx-form" onSubmit={handleSubmit}>
        {/* 1. Chọn loại giao dịch: Thu nhập / Chi tiêu */}
        <div className="mm-form-group">
          <label className="mm-form-label">Loại giao dịch</label>
          <div className="mm-type-toggle-group">
            <button
              type="button"
              className={`mm-type-btn mm-type-expense ${type === 'expense' ? 'active' : ''}`}
              onClick={() => {
                setType('expense');
                setSuccessMessage(null);
              }}
            >
              <span className="type-icon">🛒</span> Chi Tiêu
            </button>
            <button
              type="button"
              className={`mm-type-btn mm-type-income ${type === 'income' ? 'active' : ''}`}
              onClick={() => {
                setType('income');
                setSuccessMessage(null);
              }}
            >
              <span className="type-icon">💰</span> Thu Nhập
            </button>
          </div>
        </div>

        {/* 2. Nhập số tiền */}
        <div className="mm-form-group">
          <div className="mm-form-label-row">
            <label htmlFor="tx-amount" className="mm-form-label">
              Số tiền (VNĐ) <span className="text-danger">*</span>
            </label>
            {isValidAmount && (
              <span className="mm-amount-preview">
                {new Intl.NumberFormat('vi-VN').format(parsedAmount)} ₫
              </span>
            )}
          </div>
          <div className="mm-amount-input-wrapper">
            <input
              id="tx-amount"
              type="number"
              min="1"
              step="any"
              className="mm-input mm-amount-input"
              placeholder="0"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setFormError(null);
                setSuccessMessage(null);
              }}
              disabled={loading}
              required
            />
            <span className="mm-currency-suffix">₫</span>
          </div>

          {/* Nút cộng nhanh số tiền */}
          <div className="mm-quick-amounts">
            <button
              type="button"
              className="mm-quick-amount-btn"
              onClick={() => handleQuickAddAmount(20000)}
            >
              +20k
            </button>
            <button
              type="button"
              className="mm-quick-amount-btn"
              onClick={() => handleQuickAddAmount(50000)}
            >
              +50k
            </button>
            <button
              type="button"
              className="mm-quick-amount-btn"
              onClick={() => handleQuickAddAmount(100000)}
            >
              +100k
            </button>
            <button
              type="button"
              className="mm-quick-amount-btn"
              onClick={() => handleQuickAddAmount(500000)}
            >
              +500k
            </button>
          </div>
        </div>

        {/* 3. Chọn danh mục từ bảng categories */}
        <div className="mm-form-group">
          <label htmlFor="tx-category" className="mm-form-label">
            Danh mục <span className="mm-label-optional">(tùy chọn)</span>
          </label>
          <div className="mm-select-wrapper">
            <select
              id="tx-category"
              className="mm-input mm-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading || categoriesLoading}
            >
              <option value="">-- Không chọn danh mục --</option>
              {categoriesLoading ? (
                <option disabled>Đang tải danh mục...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : '📁 '}
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* 4. Ghi chú */}
        <div className="mm-form-group">
          <label htmlFor="tx-note" className="mm-form-label">
            Ghi chú <span className="mm-label-optional">(tùy chọn)</span>
          </label>
          <input
            id="tx-note"
            type="text"
            className="mm-input"
            placeholder={
              type === 'expense'
                ? 'Ví dụ: Cơm trưa, Xăng xe, Mua sắm siêu thị...'
                : 'Ví dụ: Lương tháng, Thưởng dự án, Tiền lãi...'
            }
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={loading}
            maxLength={255}
          />
        </div>

        {/* 5. Chọn ngày */}
        <div className="mm-form-group">
          <label htmlFor="tx-occurred-on" className="mm-form-label">
            Ngày diễn ra <span className="text-danger">*</span>
          </label>
          <input
            id="tx-occurred-on"
            type="date"
            className="mm-input"
            value={occurredOn}
            onChange={(e) => setOccurredOn(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {/* Nút Submit */}
        <div className="mm-form-actions">
          <button
            type="submit"
            className={`mm-btn ${type === 'expense' ? 'mm-btn-danger-gradient' : 'mm-btn-primary'}`}
            disabled={loading || !isValidAmount}
          >
            {loading ? (
              <span className="mm-btn-spinner-text">
                <span className="mm-spinner"></span> Đang lưu giao dịch...
              </span>
            ) : (
              <>
                <span>➕</span> Thêm {type === 'expense' ? 'Khoản Chi' : 'Khoản Thu'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
