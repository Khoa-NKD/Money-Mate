import { useState, type FormEvent } from 'react';
import { useUpdateTransaction } from '../../hooks/useUpdateTransaction';
import { useCategories } from '../../hooks/useCategories';
import type { TransactionListItem, TransactionType } from '../../types/database';

interface EditTransactionModalProps {
  /** Thông tin giao dịch đang được chỉnh sửa */
  transaction: TransactionListItem;
  /** Hàm đóng modal chỉnh sửa */
  onClose: () => void;
  /** Callback sau khi cập nhật thành công */
  onSuccess: () => void;
}

/**
 * Modal chỉnh sửa thông tin giao dịch tài chính
 */
export function EditTransactionModal({
  transaction,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const { updateTransaction, loading, error } = useUpdateTransaction();
  const { categories, loading: categoriesLoading } = useCategories();

  // Khởi tạo state từ dữ liệu giao dịch hiện tại
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [categoryId, setCategoryId] = useState<string>(transaction.category_id || '');
  const [note, setNote] = useState<string>(transaction.note || '');
  const [occurredOn, setOccurredOn] = useState<string>(() => {
    if (transaction.occurred_on) return transaction.occurred_on;
    if (transaction.occurred_at) return transaction.occurred_at.split('T')[0] || '';
    return new Date().toISOString().split('T')[0] || '';
  });

  const [formError, setFormError] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  /**
   * Xử lý lưu các thay đổi
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!isValidAmount) {
      setFormError('Vui lòng nhập số tiền hợp lệ và lớn hơn 0.');
      return;
    }

    if (!occurredOn) {
      setFormError('Vui lòng chọn ngày diễn ra giao dịch.');
      return;
    }

    const updated = await updateTransaction(transaction.id, {
      amount: parsedAmount,
      type,
      category_id: categoryId ? categoryId : null,
      note: note.trim() || null,
      occurred_on: occurredOn,
    });

    if (updated) {
      onSuccess();
    }
  };

  return (
    <div className="mm-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mm-modal-container mm-edit-modal">
        {/* Header Modal */}
        <div className="mm-modal-header">
          <div className="mm-modal-title-row">
            <span className="mm-header-icon">✏️</span>
            <h3>Chỉnh Sửa Giao Dịch</h3>
          </div>
          <button
            type="button"
            className="mm-modal-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Cảnh báo lỗi */}
        {(formError || error) && (
          <div className="mm-alert mm-alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
            <span className="mm-alert-icon">⚠️</span>
            <div className="mm-alert-content">{formError || error}</div>
          </div>
        )}

        {/* Form chỉnh sửa */}
        <form className="mm-modal-body mm-tx-form" onSubmit={handleSubmit}>
          {/* 1. Chọn loại giao dịch */}
          <div className="mm-form-group">
            <label className="mm-form-label">Loại giao dịch</label>
            <div className="mm-type-toggle-group">
              <button
                type="button"
                className={`mm-type-btn mm-type-expense ${type === 'expense' ? 'active' : ''}`}
                onClick={() => setType('expense')}
              >
                <span>🛒</span> Chi Tiêu
              </button>
              <button
                type="button"
                className={`mm-type-btn mm-type-income ${type === 'income' ? 'active' : ''}`}
                onClick={() => setType('income')}
              >
                <span>💰</span> Thu Nhập
              </button>
            </div>
          </div>

          {/* 2. Số tiền */}
          <div className="mm-form-group">
            <div className="mm-form-label-row">
              <label htmlFor="edit-tx-amount" className="mm-form-label">
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
                id="edit-tx-amount"
                type="number"
                min="1"
                step="any"
                className="mm-input mm-amount-input"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFormError(null);
                }}
                disabled={loading}
                required
              />
              <span className="mm-currency-suffix">₫</span>
            </div>
          </div>

          {/* 3. Danh mục */}
          <div className="mm-form-group">
            <label htmlFor="edit-tx-category" className="mm-form-label">
              Danh mục <span className="mm-label-optional">(tùy chọn)</span>
            </label>
            <select
              id="edit-tx-category"
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

          {/* 4. Ghi chú */}
          <div className="mm-form-group">
            <label htmlFor="edit-tx-note" className="mm-form-label">
              Ghi chú <span className="mm-label-optional">(tùy chọn)</span>
            </label>
            <input
              id="edit-tx-note"
              type="text"
              className="mm-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              placeholder="Ghi chú chi tiết..."
              maxLength={255}
            />
          </div>

          {/* 5. Ngày giao dịch */}
          <div className="mm-form-group">
            <label htmlFor="edit-tx-date" className="mm-form-label">
              Ngày diễn ra <span className="text-danger">*</span>
            </label>
            <input
              id="edit-tx-date"
              type="date"
              className="mm-input"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {/* Footer nút bấm */}
          <div className="mm-modal-footer" style={{ padding: '1rem 0 0', margin: 0, border: 'none' }}>
            <button
              type="button"
              className="mm-btn mm-btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="mm-btn mm-btn-primary"
              disabled={loading || !isValidAmount}
            >
              {loading ? (
                <span className="mm-btn-spinner-text">
                  <span className="mm-spinner"></span> Đang lưu...
                </span>
              ) : (
                '💾 Lưu Thay Đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
