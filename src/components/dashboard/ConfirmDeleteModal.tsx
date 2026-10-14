import { useDeleteTransaction } from '../../hooks/useDeleteTransaction';
import { formatMoney, formatDate } from '../../lib/format';
import type { TransactionListItem } from '../../types/database';

interface ConfirmDeleteModalProps {
  /** Thông tin giao dịch được chọn để xóa */
  transaction: TransactionListItem;
  /** Hàm đóng hộp thoại xác nhận */
  onClose: () => void;
  /** Hàm callback sau khi xóa thành công để làm mới UI */
  onSuccess: () => void;
}

/**
 * Hộp thoại xác nhận trước khi xóa giao dịch tài chính
 */
export function ConfirmDeleteModal({
  transaction,
  onClose,
  onSuccess,
}: ConfirmDeleteModalProps) {
  const { deleteTransaction, loading, error } = useDeleteTransaction();

  const isExpense = transaction.type === 'expense';

  /**
   * Xử lý xác nhận xóa
   */
  const handleConfirmDelete = async () => {
    const success = await deleteTransaction(transaction.id);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className="mm-modal-backdrop" role="dialog" aria-modal="true">
      <div className="mm-modal-container mm-confirm-modal">
        {/* Header Modal */}
        <div className="mm-modal-header">
          <div className="mm-modal-title-row">
            <span className="mm-modal-icon-danger">⚠️</span>
            <h3>Xác Nhận Xóa Giao Dịch</h3>
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

        {/* Nội dung thông tin giao dịch cần xóa */}
        <div className="mm-modal-body">
          <p className="mm-confirm-desc">
            Bạn có chắc chắn muốn xóa bản ghi giao dịch này khỏi MoneyMate không?
            Hành động này không thể hoàn tác.
          </p>

          <div className="mm-confirm-item-preview">
            <div className="mm-confirm-row">
              <span className="mm-confirm-label">Loại giao dịch:</span>
              <span
                className={`mm-badge ${isExpense ? 'badge-danger-soft' : 'badge-success-soft'}`}
              >
                {isExpense ? 'Chi Tiêu' : 'Thu Nhập'}
              </span>
            </div>

            <div className="mm-confirm-row">
              <span className="mm-confirm-label">Số tiền:</span>
              <span className={`mm-confirm-amount ${isExpense ? 'amount-expense' : 'amount-income'}`}>
                {isExpense ? '-' : '+'}
                {formatMoney(transaction.amount)}
              </span>
            </div>

            {transaction.note && (
              <div className="mm-confirm-row">
                <span className="mm-confirm-label">Ghi chú:</span>
                <span className="mm-confirm-value">{transaction.note}</span>
              </div>
            )}

            {transaction.category && (
              <div className="mm-confirm-row">
                <span className="mm-confirm-label">Danh mục:</span>
                <span className="mm-confirm-value">
                  {transaction.category.icon ? `${transaction.category.icon} ` : ''}
                  {transaction.category.name}
                </span>
              </div>
            )}

            <div className="mm-confirm-row">
              <span className="mm-confirm-label">Ngày giao dịch:</span>
              <span className="mm-confirm-value">
                {formatDate(transaction.occurred_at || transaction.occurred_on)}
              </span>
            </div>
          </div>

          {/* Cảnh báo lỗi nếu xóa thất bại */}
          {error && (
            <div className="mm-alert mm-alert-error" role="alert" style={{ marginTop: '1rem' }}>
              <span className="mm-alert-icon">⚠️</span>
              <div className="mm-alert-content">{error}</div>
            </div>
          )}
        </div>

        {/* Footer Hành động */}
        <div className="mm-modal-footer">
          <button
            type="button"
            className="mm-btn mm-btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            className="mm-btn mm-btn-danger"
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? (
              <span className="mm-btn-spinner-text">
                <span className="mm-spinner"></span> Đang xóa...
              </span>
            ) : (
              '🗑️ Xác Nhận Xóa'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
