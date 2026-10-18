import { useState, type FormEvent } from 'react';
import { useUpdateTransaction } from '../../hooks/useUpdateTransaction';
import { useCategories } from '../../hooks/useCategories';
import type { TransactionListItem, TransactionType } from '../../types/database';
import {
  EditIcon,
  XIcon,
  AlertCircleIcon,
  CheckIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  CalendarIcon,
  TagIcon,
} from '../ui/Icons';
import { formatMoney } from '../../lib/format';

interface EditTransactionModalProps {
  transaction: TransactionListItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditTransactionModal({
  transaction,
  onClose,
  onSuccess,
}: EditTransactionModalProps) {
  const { updateTransaction, loading, error } = useUpdateTransaction();
  const { categories, loading: categoriesLoading } = useCategories();

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
    <div className='mm-modal-backdrop' role='dialog' aria-modal='true' aria-labelledby='modal-edit-title'>
      <div className='mm-modal-container mm-edit-modal'>
        {/* Header Modal */}
        <div className='mm-modal-header'>
          <div className='mm-modal-title-row'>
            <div className='mm-modal-icon-wrap primary'>
              <EditIcon size={20} />
            </div>
            <h3 id='modal-edit-title'>Chỉnh Sửa Giao Dịch</h3>
          </div>
          <button
            type='button'
            className='mm-modal-close-btn'
            onClick={onClose}
            disabled={loading}
            aria-label='Đóng'
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Body Modal Form */}
        <form className='mm-modal-body' onSubmit={handleSubmit}>
          {(formError || error) && (
            <div className='mm-alert mm-alert-error' role='alert' style={{ marginBottom: '1.25rem' }}>
              <AlertCircleIcon size={18} className='mm-alert-icon' />
              <div className='mm-alert-content'>{formError || error}</div>
            </div>
          )}

          {/* Segmented Type Toggle */}
          <div className='mm-form-group'>
            <label className='mm-form-label'>Loại giao dịch</label>
            <div className='mm-segmented-control' role='radiogroup'>
              <button
                type='button'
                role='radio'
                aria-checked={type === 'expense'}
                className={`mm-segment-btn ${type === 'expense' ? 'active expense' : ''}`}
                onClick={() => setType('expense')}
              >
                <ArrowDownLeftIcon size={16} />
                <span>Chi Tiêu</span>
              </button>
              <button
                type='button'
                role='radio'
                aria-checked={type === 'income'}
                className={`mm-segment-btn ${type === 'income' ? 'active income' : ''}`}
                onClick={() => setType('income')}
              >
                <ArrowUpRightIcon size={16} />
                <span>Thu Nhập</span>
              </button>
            </div>
          </div>

          {/* Số tiền */}
          <div className='mm-form-group'>
            <div className='mm-form-label-row'>
              <label htmlFor='edit-amount' className='mm-form-label'>
                Số tiền (VNĐ) <span className='text-danger'>*</span>
              </label>
              {isValidAmount && (
                <span className='mm-amount-preview'>
                  {formatMoney(parsedAmount)}
                </span>
              )}
            </div>
            <div className='mm-amount-input-wrapper'>
              <input
                id='edit-amount'
                type='number'
                inputMode='decimal'
                min='1'
                step='any'
                className='mm-input mm-amount-input'
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={loading}
                required
              />
              <span className='mm-currency-suffix'>₫</span>
            </div>
          </div>

          {/* Danh mục */}
          <div className='mm-form-group'>
            <label htmlFor='edit-category' className='mm-form-label'>
              Danh mục
            </label>
            <div className='mm-select-wrapper'>
              <select
                id='edit-category'
                className='mm-input mm-select'
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading || categoriesLoading}
              >
                <option value=''>-- Không chọn danh mục --</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className='mm-select-icon-right'>
                <TagIcon size={16} />
              </div>
            </div>
          </div>

          {/* Ghi chú */}
          <div className='mm-form-group'>
            <label htmlFor='edit-note' className='mm-form-label'>
              Ghi chú
            </label>
            <div className='mm-input-wrapper'>
              <input
                id='edit-note'
                type='text'
                className='mm-input'
                placeholder='Nhập ghi chú giao dịch...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={loading}
              />
              <div className='mm-input-icon-right'>
                <EditIcon size={16} />
              </div>
            </div>
          </div>

          {/* Ngày diễn ra */}
          <div className='mm-form-group'>
            <label htmlFor='edit-occurred-on' className='mm-form-label'>
              Ngày diễn ra <span className='text-danger'>*</span>
            </label>
            <div className='mm-input-wrapper'>
              <input
                id='edit-occurred-on'
                type='date'
                className='mm-input'
                value={occurredOn}
                onChange={(e) => setOccurredOn(e.target.value)}
                disabled={loading}
                required
              />
              <div className='mm-input-icon-right'>
                <CalendarIcon size={16} />
              </div>
            </div>
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
              type='submit'
              className='mm-btn mm-btn-primary'
              disabled={loading}
            >
              {loading ? (
                <span className='mm-btn-spinner-text'>
                  <span className='mm-spinner'></span> Đang lưu...
                </span>
              ) : (
                <>
                  <CheckIcon size={16} />
                  <span>Lưu Thay Đổi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
