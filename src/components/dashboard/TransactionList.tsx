import { useEffect, useState } from 'react';
import { useTransactions } from '../../hooks/useTransactions';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { EditTransactionModal } from './EditTransactionModal';
import { formatMoney, formatDate } from '../../lib/format';
import type { TransactionListItem } from '../../types/database';

interface TransactionListProps {
  /** Số lượng giao dịch tối đa cần tải (mặc định 50) */
  limit?: number;
  /** Bộ lọc loại giao dịch (tùy chọn) */
  typeFilter?: 'income' | 'expense';
  /** Trigger làm mới danh sách từ bên ngoài (ví dụ sau khi thêm giao dịch) */
  refreshTrigger?: number;
  /** Callback kích hoạt hành động thêm giao dịch mới (khi danh sách rỗng) */
  onAddNewTransaction?: () => void;
}

/**
 * 1. Component SkeletonList hiển thị khi loading=true (đúng 4 dòng theo yêu cầu)
 */
function SkeletonList() {
  return (
    <div
      className="mm-skeleton-list"
      role="status"
      aria-busy="true"
      aria-label="Đang tải danh sách giao dịch..."
    >
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="mm-skeleton-item">
          <div className="mm-skeleton-icon" />
          <div className="mm-skeleton-content">
            <div className="mm-skeleton-line mm-skeleton-title" />
            <div className="mm-skeleton-line mm-skeleton-subtitle" />
          </div>
          <div className="mm-skeleton-amount" />
        </div>
      ))}
    </div>
  );
}

/**
 * 2. Component EmptyState hiển thị khi mảng giao dịch rỗng kèm nút "Thêm giao dịch đầu tiên"
 */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="mm-tx-empty-state">
      <span className="mm-empty-icon">🍃</span>
      <h4>Chưa có giao dịch nào</h4>
      <p style={{ marginBottom: '1.25rem' }}>
        Sổ thu chi của bạn hiện chưa có dữ liệu. Hãy thêm giao dịch đầu tiên để bắt đầu theo dõi dòng tiền!
      </p>
      <button
        type="button"
        className="mm-btn mm-btn-primary mm-empty-add-btn"
        onClick={onAddClick}
      >
        ➕ Thêm giao dịch đầu tiên
      </button>
    </div>
  );
}

/**
 * Component hiển thị danh sách giao dịch tài chính cá nhân MoneyMate
 * Đã xử lý đủ 3 trạng thái: Loading (SkeletonList 4 dòng), Empty (EmptyState với nút thêm), List (formatMoney 1.500.000 đ)
 */
export function TransactionList({
  limit = 50,
  typeFilter,
  refreshTrigger,
  onAddNewTransaction,
}: TransactionListProps) {
  // Hook truy vấn Supabase (giữ nguyên logic và RLS)
  const { transactions, loading, error, refetch } = useTransactions({
    limit,
    type: typeFilter,
  });

  // State quản lý việc sửa và xóa giao dịch
  const [editingTransaction, setEditingTransaction] = useState<TransactionListItem | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionListItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tự động làm mới danh sách khi component cha kích hoạt refreshTrigger
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Xử lý chuyển hướng / focus khi bấm "Thêm giao dịch đầu tiên"
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

  // Xử lý sau khi xóa thành công
  const handleDeleteSuccess = () => {
    setDeletingTransaction(null);
    refetch();
    setToastMessage('Đã xóa giao dịch thành công!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Xử lý sau khi sửa thành công
  const handleEditSuccess = () => {
    setEditingTransaction(null);
    refetch();
    setToastMessage('Đã cập nhật thông tin giao dịch thành công!');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tính toán thống kê nhanh từ danh sách giao dịch
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  return (
    <div className="mm-card mm-transaction-card">
      {/* Tiêu đề & Công cụ điều khiển */}
      <div className="mm-card-header">
        <div className="mm-tx-header-title">
          <h3>Lịch Sử Giao Dịch</h3>
          <span className="mm-badge badge-info">{transactions.length} bản ghi</span>
        </div>
        <button
          type="button"
          className="mm-btn mm-btn-sm mm-btn-outline"
          onClick={() => refetch()}
          disabled={loading}
          title="Tải lại danh sách"
        >
          {loading ? '⏳ Đang tải...' : '🔄 Làm mới'}
        </button>
      </div>

      {/* Thông báo cập nhật / xóa thành công */}
      {toastMessage && (
        <div className="mm-alert mm-alert-success" role="alert" style={{ marginBottom: '1rem' }}>
          <span className="mm-alert-icon">✅</span>
          <div className="mm-alert-content">{toastMessage}</div>
        </div>
      )}

      {/* Thông báo lỗi nếu có */}
      {error && (
        <div className="mm-alert mm-alert-error" role="alert">
          <span className="mm-alert-icon">⚠️</span>
          <div className="mm-alert-content">
            <p>{error}</p>
            <button
              type="button"
              className="mm-btn mm-btn-sm mm-btn-outline-danger"
              onClick={() => refetch()}
              style={{ marginTop: '0.5rem' }}
            >
              Thử lại ngay
            </button>
          </div>
        </div>
      )}

      {/* Thanh thống kê tóm tắt nhanh (dùng formatMoney từ lib/format) */}
      {!loading && transactions.length > 0 && (
        <div className="mm-tx-summary-bar">
          <div className="mm-tx-summary-item summary-income">
            <span className="summary-label">Tổng thu:</span>
            <span className="summary-value">+{formatMoney(totalIncome)}</span>
          </div>
          <div className="mm-tx-summary-item summary-expense">
            <span className="summary-label">Tổng chi:</span>
            <span className="summary-value">-{formatMoney(totalExpense)}</span>
          </div>
          <div className="mm-tx-summary-item summary-balance">
            <span className="summary-label">Dòng tiền ròng:</span>
            <span className={`summary-value ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
              {balance >= 0 ? '+' : ''}
              {formatMoney(balance)}
            </span>
          </div>
        </div>
      )}

      {/* 3 TRẠNG THÁI CỦA DANH SÁCH */}
      {loading ? (
        /* 1. Khi loading=true: Hiển thị SkeletonList đúng 4 dòng */
        <SkeletonList />
      ) : transactions.length === 0 ? (
        /* 2. Khi mảng giao dịch rỗng: Hiển thị EmptyState kèm nút "Thêm giao dịch đầu tiên" */
        <EmptyState onAddClick={handleAddNewTransaction} />
      ) : (
        /* 3. Danh sách giao dịch: Dùng formatMoney dạng "1.500.000 đ" */
        <ul className="mm-tx-list">
          {transactions.map((tx: TransactionListItem) => {
            const isExpense = tx.type === 'expense';
            const categoryColor = tx.category?.color || (isExpense ? '#ef4444' : '#10b981');

            return (
              <li key={tx.id} className="mm-tx-item">
                {/* Icon phân biệt danh mục hoặc loại giao dịch */}
                <div
                  className="mm-tx-icon-wrap"
                  style={{
                    backgroundColor: `${categoryColor}1a`,
                    color: categoryColor,
                    borderColor: `${categoryColor}40`,
                  }}
                >
                  <span>{tx.category?.icon || (isExpense ? '🛒' : '💰')}</span>
                </div>

                {/* Nội dung chi tiết: Ghi chú, Danh mục, Ngày */}
                <div className="mm-tx-info">
                  <div className="mm-tx-title-row">
                    <span className="mm-tx-note">
                      {tx.note?.trim() || (isExpense ? 'Khoản chi tiêu' : 'Khoản thu nhập')}
                    </span>
                    {tx.category && (
                      <span
                        className="mm-badge mm-tx-category-badge"
                        style={{
                          backgroundColor: `${categoryColor}20`,
                          color: categoryColor,
                          border: `1px solid ${categoryColor}40`,
                        }}
                      >
                        {tx.category.name}
                      </span>
                    )}
                  </div>
                  <span className="mm-tx-date">
                    📅 {formatDate(tx.occurred_at || tx.occurred_on)}
                  </span>
                </div>

                {/* 3. Số tiền thu (+) hoặc chi (-) hiển thị dạng "1.500.000 đ" qua formatMoney */}
                <div className="mm-tx-amount-wrap">
                  <span className={`mm-tx-amount ${isExpense ? 'amount-expense' : 'amount-income'}`}>
                    {isExpense ? '-' : '+'}
                    {formatMoney(tx.amount)}
                  </span>
                </div>

                {/* Nhóm nút thao tác: Sửa & Xóa */}
                <div className="mm-tx-actions">
                  <button
                    type="button"
                    className="mm-action-btn mm-edit-btn"
                    title="Chỉnh sửa giao dịch"
                    onClick={() => setEditingTransaction(tx)}
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    className="mm-action-btn mm-delete-btn"
                    title="Xóa giao dịch"
                    onClick={() => setDeletingTransaction(tx)}
                  >
                    🗑️
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal Xác nhận trước khi xóa */}
      {deletingTransaction && (
        <ConfirmDeleteModal
          transaction={deletingTransaction}
          onClose={() => setDeletingTransaction(null)}
          onSuccess={handleDeleteSuccess}
        />
      )}

      {/* Modal Chỉnh sửa giao dịch */}
      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
}
