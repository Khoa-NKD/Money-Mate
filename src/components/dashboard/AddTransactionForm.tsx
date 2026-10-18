import { useState, useEffect, type FormEvent } from 'react';
import { useAddTransaction } from '../../hooks/useAddTransaction';
import { useCategories } from '../../hooks/useCategories';
import type { TransactionType } from '../../types/database';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
  CalendarIcon,
  TagIcon,
  EditIcon,
  CheckIcon,
  AlertCircleIcon,
} from '../ui/Icons';
import { formatMoney } from '../../lib/format';

interface AddTransactionFormProps {
  /** Callback được gọi khi thêm giao dịch thành công */
  onSuccess?: () => void;
  /** Trigger làm mới danh mục khi danh mục thay đổi */
  categoryRefreshTrigger?: number;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000];

export function AddTransactionForm({
  onSuccess,
  categoryRefreshTrigger,
}: AddTransactionFormProps) {
  const { addTransaction, loading, error } = useAddTransaction();
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useCategories();

  useEffect(() => {
    if (categoryRefreshTrigger !== undefined && categoryRefreshTrigger > 0) {
      refetchCategories();
    }
  }, [categoryRefreshTrigger, refetchCategories]);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [occurredOn, setOccurredOn] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const parsedAmount = parseFloat(amount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const handleQuickAddAmount = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    if (!isValidAmount) {
      setFormError('Vui lòng nhập số tiền hợp lệ và lớn hơn 0.');
      return;
    }

    if (!occurredOn) {
      setFormError('Vui lòng chọn ngày diễn ra giao dịch.');
      return;
    }

    const result = await addTransaction({
      category_id: categoryId ? categoryId : null,
      amount: parsedAmount,
      type,
      note: note.trim() || null,
      occurred_on: occurredOn,
    });

    if (result) {
      setSuccessMessage(`Đã thêm thành công giao dịch: ${formatMoney(parsedAmount)}!`);
      setAmount('');
      setNote('');

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }
  };

  return (
    <div className='mm-card mm-add-tx-card'>
      <div className='mm-card-header'>
        <div className='mm-tx-header-title'>
          <div className='mm-header-icon-box'>
            <PlusIcon size={18} />
          </div>
          <div>
            <h3>Thêm Giao Dịch Mới</h3>
            <p className='mm-card-subtitle mm-header-subtitle'>
              Ghi chép thu chi chính xác &amp; tức thì
            </p>
          </div>
        </div>
        <span
          className={`mm-badge ${type === 'expense' ? 'badge-danger-soft' : 'badge-success-soft'}`}
        >
          {type === 'expense' ? 'Khoản Chi' : 'Khoản Thu'}
        </span>
      </div>

      {/* Thông báo lỗi */}
      {(formError || error) && (
        <div className='mm-alert mm-alert-error' role='alert'>
          <AlertCircleIcon size={18} className='mm-alert-icon' />
          <div className='mm-alert-content'>{formError || error}</div>
        </div>
      )}

      {/* Thông báo thành công */}
      {successMessage && (
        <div className='mm-alert mm-alert-success' role='status' aria-live='polite'>
          <CheckIcon size={18} className='mm-alert-icon' />
          <div className='mm-alert-content'>{successMessage}</div>
        </div>
      )}

      <form className='mm-tx-form' onSubmit={handleSubmit}>
        {/* Segmented Type Toggle */}
        <div className='mm-form-group'>
          <label className='mm-form-label'>Loại giao dịch</label>
          <div className='mm-segmented-control' role='radiogroup' aria-label='Loại giao dịch'>
            <button
              type='button'
              role='radio'
              aria-checked={type === 'expense'}
              className={`mm-segment-btn ${type === 'expense' ? 'active expense' : ''}`}
              onClick={() => {
                setType('expense');
                setSuccessMessage(null);
              }}
            >
              <ArrowDownLeftIcon size={16} />
              <span>Khoản Chi Tiêu</span>
            </button>
            <button
              type='button'
              role='radio'
              aria-checked={type === 'income'}
              className={`mm-segment-btn ${type === 'income' ? 'active income' : ''}`}
              onClick={() => {
                setType('income');
                setSuccessMessage(null);
              }}
            >
              <ArrowUpRightIcon size={16} />
              <span>Khoản Thu Nhập</span>
            </button>
          </div>
        </div>

        {/* Input Số Tiền */}
        <div className='mm-form-group'>
          <div className='mm-form-label-row'>
            <label htmlFor='tx-amount' className='mm-form-label'>
              Số tiền <span className='text-danger'>*</span>
            </label>
            {isValidAmount && (
              <span className='mm-amount-preview'>
                {formatMoney(parsedAmount)}
              </span>
            )}
          </div>
          <div className='mm-amount-input-wrapper'>
            <input
              id='tx-amount'
              type='number'
              inputMode='decimal'
              min='1'
              step='any'
              className='mm-input mm-amount-input'
              placeholder='0'
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setFormError(null);
                setSuccessMessage(null);
              }}
              disabled={loading}
              autoComplete='off'
              required
            />
            <span className='mm-currency-suffix'>₫</span>
          </div>

          {/* Quick presets */}
          <div className='mm-quick-amounts' aria-label='Thêm nhanh số tiền'>
            {QUICK_AMOUNTS.map((val) => (
              <button
                key={val}
                type='button'
                className='mm-quick-amount-btn'
                onClick={() => handleQuickAddAmount(val)}
                disabled={loading}
              >
                +{val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Danh Mục */}
        <div className='mm-form-group'>
          <label htmlFor='tx-category' className='mm-form-label'>
            Danh mục <span className='mm-label-optional'>(tùy chọn)</span>
          </label>
          <div className='mm-select-wrapper'>
            <select
              id='tx-category'
              className='mm-input mm-select'
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              disabled={loading || categoriesLoading}
            >
              <option value=''>-- Chọn danh mục --</option>
              {categoriesLoading ? (
                <option disabled>Đang tải danh mục...</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
            <div className='mm-select-icon-right'>
              <TagIcon size={16} />
            </div>
          </div>
        </div>

        {/* Ghi chú & Ngày */}
        <div className='mm-form-row-2col'>
          <div className='mm-form-group'>
            <label htmlFor='tx-note' className='mm-form-label'>
              Ghi chú <span className='mm-label-optional'>(tùy chọn)</span>
            </label>
            <div className='mm-input-wrapper'>
              <input
                id='tx-note'
                type='text'
                className='mm-input'
                placeholder='Ví dụ: Cà phê, Lương tháng...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={loading}
                autoComplete='off'
              />
              <div className='mm-input-icon-right'>
                <EditIcon size={16} />
              </div>
            </div>
          </div>

          <div className='mm-form-group'>
            <label htmlFor='tx-occurred-on' className='mm-form-label'>
              Ngày diễn ra <span className='text-danger'>*</span>
            </label>
            <div className='mm-input-wrapper'>
              <input
                id='tx-occurred-on'
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
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          className={`mm-btn mm-btn-primary mm-btn-full mm-submit-btn ${type === 'expense' ? 'btn-expense' : 'btn-income'}`}
          disabled={loading}
        >
          {loading ? (
            <span className='mm-btn-spinner-text'>
              <span className='mm-spinner'></span> Đang ghi nhận...
            </span>
          ) : (
            <>
              <PlusIcon size={18} />
              <span>{type === 'expense' ? 'Thêm Khoản Chi' : 'Thêm Khoản Thu'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
