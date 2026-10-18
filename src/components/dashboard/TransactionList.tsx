import { useEffect, useState, useMemo } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { useCategories } from '../../hooks/useCategories';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { EditTransactionModal } from './EditTransactionModal';
import { formatMoney, formatDate } from '../../lib/format';
import {
  getCurrentMonthString,
  generateMonthOptions,
  formatMonthLabel,
} from '../../lib/dateFilter';
import type { TransactionListItem } from '../../types/database';
import {
  SearchIcon,
  FilterIcon,
  CalendarIcon,
  TagIcon,
  RefreshCwIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  CheckIcon,
  AlertCircleIcon,
  DynamicCategoryIcon,
} from '../ui/Icons';

interface TransactionListProps {
  limit?: number;
  typeFilter?: 'income' | 'expense';
  refreshTrigger?: number;
  onAddNewTransaction?: () => void;
  categoryRefreshTrigger?: number;
}

function SkeletonList() {
  return (
    <div
      className='mm-skeleton-list'
      role='status'
      aria-busy='true'
      aria-label='Đang tải danh sách giao dịch...'
    >
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className='mm-skeleton-item'>
          <div className='mm-skeleton-icon' />
          <div className='mm-skeleton-content'>
            <div className='mm-skeleton-line mm-skeleton-title' />
            <div className='mm-skeleton-line mm-skeleton-subtitle' />
          </div>
          <div className='mm-skeleton-amount' />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  onAddClick,
  hasActiveFilter,
}: {
  onAddClick: () => void;
  hasActiveFilter?: boolean;
}) {
  return (
    <div className='mm-tx-empty-state'>
      <div className='mm-empty-icon-wrap'>
        <SearchIcon size={32} />
      </div>
      <h4>{hasActiveFilter ? 'Không tìm thấy giao dịch phù hợp' : 'Chưa có giao dịch nào'}</h4>
      <p>
        {hasActiveFilter
          ? 'Không có giao dịch nào thỏa mãn bộ lọc hiện tại. Thử chọn tháng khác, đổi danh mục hoặc đặt lại bộ lọc.'
          : 'Sổ thu chi của bạn hiện đang trống. Hãy thêm giao dịch đầu tiên để bắt đầu quản lý tài chính!'}
      </p>
      <button
        type='button'
        className='mm-btn mm-btn-primary mm-empty-add-btn'
        onClick={onAddClick}
      >
        <PlusIcon size={16} />
        <span>Thêm giao dịch mới</span>
      </button>
    </div>
  );
}

export function TransactionList({
  limit = 50,
  typeFilter: initialTypeFilter,
  refreshTrigger,
  onAddNewTransaction,
  categoryRefreshTrigger,
}: TransactionListProps) {
  const {
    categories,
    loading: categoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  useEffect(() => {
    if (categoryRefreshTrigger !== undefined && categoryRefreshTrigger > 0) {
      refetchCategories();
    }
  }, [categoryRefreshTrigger, refetchCategories]);

  const defaultMonth = useMemo(() => getCurrentMonthString(), []);
  const {
    transactions,
    loading,
    error,
    refetch,
    fetchFilteredTransactions,
    selectedMonth,
    selectedCategoryId,
  } = useTransactions({
    limit,
    type: initialTypeFilter,
    month: defaultMonth,
    categoryId: '',
  });

  const [activeTypeTab, setActiveTypeTab] = useState<'all' | 'expense' | 'income'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTransaction, setEditingTransaction] = useState<TransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionListItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const monthOptions = useMemo(() => generateMonthOptions(12, 1), []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const handleAddNewTransaction = () => {
    if (onAddNewTransaction) {
      onAddNewTransaction();
    } else {
      const amountInput = document.getElementById('tx-amount') as HTMLInputElement | null;
      if (amountInput) {
        amountInput.focus();
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleDeleteSuccess = () => {
    setDeletingTransaction(null);
    refetch();
    setToastMessage('Đã xóa giao dịch thành công!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    refetch();
    setToastMessage('Đã cập nhật giao dịch thành công!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMonthChange = (newMonth: string) => {
    void fetchFilteredTransactions(newMonth, selectedCategoryId);
  };

  const handleCategoryChange = (newCatId: string) => {
    void fetchFilteredTransactions(selectedMonth, newCatId);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTypeTab('all');
    void fetchFilteredTransactions(defaultMonth, '');
  };

  const isCustomFiltered =
    selectedMonth !== defaultMonth || selectedCategoryId !== '' || searchQuery !== '' || activeTypeTab !== 'all';

  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId]
  );

  // Lọc ở client cho search query và type tab (all / expense / income)
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (activeTypeTab !== 'all') {
      result = result.filter((t) => t.type === activeTypeTab);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (t) =>
          (t.note && t.note.toLowerCase().includes(q)) ||
          (t.category?.name && t.category.name.toLowerCase().includes(q))
      );
    }

    return result;
  }, [transactions, activeTypeTab, searchQuery]);

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className='mm-card mm-transaction-card'>
      {/* Header */}
      <div className='mm-card-header'>
        <div className='mm-tx-header-title'>
          <div className='mm-header-icon-box'>
            <FilterIcon size={18} />
          </div>
          <div>
            <h3>Sổ Giao Dịch Thu / Chi</h3>
            <p className='mm-header-subtitle'>
              {filteredTransactions.length} giao dịch được hiển thị
            </p>
          </div>
        </div>
        <div className='mm-tx-header-actions'>
          <button
            type='button'
            className='mm-btn mm-btn-sm mm-btn-outline'
            onClick={() => refetch()}
            disabled={loading}
            title='Tải lại danh sách'
          >
            <RefreshCwIcon size={14} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className='mm-tx-filter-bar'>
        <div className='mm-filter-controls'>
          {/* Search Input */}
          <div className='mm-filter-item mm-filter-search'>
            <div className='mm-input-wrapper'>
              <input
                type='text'
                className='mm-input mm-search-input'
                placeholder='Tìm theo ghi chú, danh mục...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete='off'
              />
              <div className='mm-input-icon-right'>
                <SearchIcon size={16} />
              </div>
            </div>
          </div>

          {/* Month Dropdown */}
          <div className='mm-filter-item'>
            <div className='mm-select-wrapper'>
              <select
                id='filter-month-select'
                className='mm-input mm-select mm-filter-select'
                value={selectedMonth}
                onChange={(e) => handleMonthChange(e.target.value)}
                disabled={loading}
                aria-label='Chọn tháng để lọc'
              >
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className='mm-select-icon-right'>
                <CalendarIcon size={14} />
              </div>
            </div>
          </div>

          {/* Category Dropdown */}
          <div className='mm-filter-item'>
            <div className='mm-select-wrapper'>
              <select
                id='filter-category-select'
                className='mm-input mm-select mm-filter-select'
                value={selectedCategoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                disabled={loading || categoriesLoading}
                aria-label='Chọn danh mục để lọc'
              >
                <option value=''>Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className='mm-select-icon-right'>
                <TagIcon size={14} />
              </div>
            </div>
          </div>

          {/* Type Toggle Pills: Tất cả | Thu | Chi */}
          <div className='mm-filter-type-pills' role='tablist' aria-label='Lọc loại giao dịch'>
            <button
              type='button'
              className={`mm-type-pill ${activeTypeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTypeTab('all')}
            >
              Tất cả
            </button>
            <button
              type='button'
              className={`mm-type-pill ${activeTypeTab === 'expense' ? 'active expense' : ''}`}
              onClick={() => setActiveTypeTab('expense')}
            >
              Chi tiêu
            </button>
            <button
              type='button'
              className={`mm-type-pill ${activeTypeTab === 'income' ? 'active income' : ''}`}
              onClick={() => setActiveTypeTab('income')}
            >
              Thu nhập
            </button>
          </div>

          {/* Reset Filters Button */}
          {isCustomFiltered && (
            <button
              type='button'
              className='mm-btn mm-btn-sm mm-btn-outline mm-filter-reset-btn'
              onClick={handleResetFilters}
              disabled={loading}
              title='Đặt lại bộ lọc'
            >
              Đặt lại
            </button>
          )}
        </div>

        {/* Filter Status Badge */}
        <div className='mm-filter-status-info'>
          <span className='mm-filter-status-tag'>
            Lọc theo: <strong>{formatMonthLabel(selectedMonth)}</strong>
            {selectedCategoryObj ? (
              <>
                {' '}• Danh mục: <strong>{selectedCategoryObj.name}</strong>
              </>
            ) : (
              ' • Tất cả danh mục'
            )}
            {activeTypeTab !== 'all' && (
              <> • Loại: <strong>{activeTypeTab === 'expense' ? 'Chi tiêu' : 'Thu nhập'}</strong></>
            )}
            {searchQuery && (
              <> • Tìm kiếm: &ldquo;<strong>{searchQuery}</strong>&rdquo;</>
            )}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className='mm-alert mm-alert-success' role='status' aria-live='polite'>
          <CheckIcon size={18} className='mm-alert-icon' />
          <div className='mm-alert-content'>{toastMessage}</div>
        </div>
      )}

      {error && (
        <div className='mm-alert mm-alert-error' role='alert'>
          <AlertCircleIcon size={18} className='mm-alert-icon' />
          <div className='mm-alert-content'>
            <p>{error}</p>
            <button
              type='button'
              className='mm-btn mm-btn-sm mm-btn-outline-danger'
              onClick={() => refetch()}
              style={{ marginTop: '0.5rem' }}
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Mini Summary Bar */}
      {!loading && transactions.length > 0 && (
        <div className='mm-tx-summary-bar'>
          <div className='mm-tx-summary-item summary-income'>
            <span className='summary-label'>Tổng thu tháng:</span>
            <span className='summary-value tabular-nums'>+{formatMoney(totalIncome)}</span>
          </div>
          <div className='mm-tx-summary-item summary-expense'>
            <span className='summary-label'>Tổng chi tháng:</span>
            <span className='summary-value tabular-nums'>-{formatMoney(totalExpense)}</span>
          </div>
          <div className='mm-tx-summary-item summary-balance'>
            <span className='summary-label'>Dòng tiền ròng:</span>
            <span className={`summary-value tabular-nums ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {balance >= 0 ? '+' : ''}
              {formatMoney(balance)}
            </span>
          </div>
        </div>
      )}

      {/* List States */}
      {loading ? (
        <SkeletonList />
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          onAddClick={handleAddNewTransaction}
          hasActiveFilter={isCustomFiltered}
        />
      ) : (
        <ul className='mm-tx-list' aria-label='Danh sách giao dịch'>
          {filteredTransactions.map((tx: TransactionListItem) => {
            const isExpense = tx.type === 'expense';
            const categoryColor = tx.category?.color || (isExpense ? '#f43f5e' : '#10b981');

            return (
              <li key={tx.id} className='mm-tx-item'>
                <div
                  className='mm-tx-icon-wrap'
                  style={{
                    backgroundColor: `${categoryColor}15`,
                    color: categoryColor,
                    borderColor: `${categoryColor}30`,
                  }}
                >
                  <DynamicCategoryIcon name={tx.category?.name || tx.category?.icon} size={18} />
                </div>

                <div className='mm-tx-info'>
                  <div className='mm-tx-title-row'>
                    <span className='mm-tx-note'>
                      {tx.note?.trim() || (isExpense ? 'Chi tiêu' : 'Thu nhập')}
                    </span>
                    {tx.category && (
                      <span
                        className='mm-badge mm-tx-category-badge'
                        style={{
                          backgroundColor: `${categoryColor}15`,
                          color: categoryColor,
                          borderColor: `${categoryColor}30`,
                        }}
                      >
                        {tx.category.name}
                      </span>
                    )}
                  </div>
                  <div className='mm-tx-date-row'>
                    <CalendarIcon size={12} className='mm-date-icon' />
                    <time dateTime={tx.occurred_at || tx.created_at || ''}>
                      {formatDate(tx.occurred_at || tx.created_at || '')}
                    </time>
                  </div>
                </div>

                <div className='mm-tx-amount-section'>
                  <span
                    className={`mm-tx-amount tabular-nums ${isExpense ? 'amount-expense' : 'amount-income'}`}
                  >
                    {isExpense ? '-' : '+'}
                    {formatMoney(tx.amount)}
                  </span>

                  <div className='mm-tx-actions'>
                    <button
                      type='button'
                      className='mm-icon-btn mm-btn-edit'
                      onClick={() => setEditingTransaction(tx)}
                      aria-label={`Sửa giao dịch ${tx.note || ''}`}
                      title='Sửa giao dịch'
                    >
                      <EditIcon size={15} />
                    </button>
                    <button
                      type='button'
                      className='mm-icon-btn mm-btn-delete'
                      onClick={() => setDeletingTransaction(tx)}
                      aria-label={`Xóa giao dịch ${tx.note || ''}`}
                      title='Xóa giao dịch'
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Confirm Delete Modal */}
      {deletingTransaction && (
        <ConfirmDeleteModal
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
