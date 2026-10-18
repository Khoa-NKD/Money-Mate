import { useDeleteTransaction } from '../../hooks/useDeleteTransaction';
import { formatMoney, formatDate } from '../../lib/format';
import type { TransactionListItem } from '../../types/database';
import { TrashIcon, XIcon, AlertCircleIcon } from '../ui/Icons';

interface ConfirmDeleteModalProps {
  transaction: TransactionListItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConfirmDeleteModal({
  transaction,
  onClose,
  onSuccess,
}: ConfirmDeleteModalProps) {
  const { deleteTransaction, loading, error } = useDeleteTransaction();

  const isExpense = transaction.type === 'expense';

  const handleConfirmDelete = async () => {
    const success = await deleteTransaction(transaction.id);
    if (success) {
      onSuccess();
    }
  };

  return (
    <div className='mm-modal-backdrop' role='dialog' aria-modal='true' aria-labelledby='modal-delete-title'>
      <div className='mm-modal-container mm-confirm-modal'>
        {/* Header Modal */}
        <div className='mm-modal-header'>
          <div className='mm-modal-title-row'>
            <div className='mm-modal-icon-wrap danger'>
              <AlertCircleIcon size={20} />
            </div>
            <h3 id='modal-delete-title'>Xác Nhận Xóa Giao Dịch</h3>
          </div>
          <button
            type='button'
            className='mm-modal-close-btn'
            onClick={onClose}
            disabled={loading}
            aria-label='Đóng hộp thoại'
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body Modal */}
        <div className='mm-modal-body'>
          <p className='mm-confirm-desc'>
            Bạn có chắc chắn muốn xóa bản ghi giao dịch này không? Hành động này sẽ cập nhật số dư và không thể hoàn tác.
          </p>

          <div className='mm-confirm-item-preview'>
            <div className='mm-confirm-row'>
              <span className='mm-confirm-label'>Loại:</span>
              <span className={`mm-badge ${isExpense ? 'badge-danger-soft' : 'badge-success-soft'}`}>
                {isExpense ? 'Khoản Chi' : 'Khoản Thu'}
              </span>
            </div>
            <div className='mm-confirm-row'>
              <span className='mm-confirm-label'>Số tiền:</span>
              <span className={`mm-confirm-value tabular-nums ${isExpense ? 'text-danger' : 'text-success'}`}>
                {isExpense ? '-' : '+'}
                {formatMoney(transaction.amount)}
              </span>
            </div>
            {transaction.category && (
              <div className='mm-confirm-row'>
                <span className='mm-confirm-label'>Danh mục:</span>
                <span className='mm-confirm-value'>{transaction.category.name}</span>
              </div>
            )}
            {transaction.note && (
              <div className='mm-confirm-row'>
                <span className='mm-confirm-label'>Ghi chú:</span>
                <span className='mm-confirm-value'>{transaction.note}</span>
              </div>
            )}
            <div className='mm-confirm-row'>
              <span className='mm-confirm-label'>Thời gian:</span>
              <span className='mm-confirm-value'>
                {formatDate(transaction.occurred_at || transaction.created_at || '')}
              </span>
            </div>
          </div>

          {error && (
            <div className='mm-alert mm-alert-error' role='alert' style={{ marginTop: '1rem' }}>
              <AlertCircleIcon size={18} className='mm-alert-icon' />
              <div className='mm-alert-content'>{error}</div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className='mm-modal-footer'>
          <button
            type='button'
            className='mm-btn mm-btn-outline'
            onClick={onClose}
            disabled={loading}
          >
            Hủy bỏ
          </button>
          <button
            type='button'
            className='mm-btn mm-btn-danger'
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? (
              <span className='mm-btn-spinner-text'>
                <span className='mm-spinner'></span> Đang xóa...
              </span>
            ) : (
              <>
                <TrashIcon size={16} />
                <span>Xác Nhận Xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
