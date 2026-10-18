import type { TransactionListItem } from '../types/database';

/**
 * Cấu trúc phần tử so sánh Thu Nhập vs Chi Tiêu theo từng tháng
 */
export interface MonthlyComparisonItem {
  /** Mã tháng định dạng "YYYY-MM" (dùng làm key và sắp xếp) */
  month: string;
  /** Nhãn hiển thị trên trục hoành XAxis (ví dụ: "Thg 08/26", "Thg 09/26") */
  label: string;
  /** Tổng số tiền thu nhập trong tháng */
  income: number;
  /** Tổng số tiền chi tiêu trong tháng */
  expense: number;
}

/**
 * Định dạng nhãn tháng hiển thị trên biểu đồ
 * Ví dụ: "2026-10" -> "Thg 10/26"
 */
export function formatMonthAxisLabel(monthStr: string): string {
  if (!monthStr || !monthStr.includes('-')) return monthStr;
  const [year, month] = monthStr.split('-');
  const shortYear = year.slice(-2);
  return `Thg ${month}/${shortYear}`;
}

/**
 * Hàm gom nhóm các giao dịch tài chính theo từng tháng (YYYY-MM),
 * tính tổng riêng cho Income (Thu nhập) và Expense (Chi tiêu),
 * và sắp xếp kết quả theo thứ tự thời gian tăng dần.
 *
 * @param transactions Danh sách giao dịch từ hệ thống
 * @returns Mảng MonthlyComparisonItem đã sắp xếp theo tháng tăng dần
 */
export function aggregateByMonth(
  transactions: TransactionListItem[]
): MonthlyComparisonItem[] {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }

  const monthMap = new Map<string, { income: number; expense: number }>();

  for (const tx of transactions) {
    if (!tx) continue;

    // Xác định mốc tháng YYYY-MM từ occurred_at hoặc occurred_on
    const dateSource = tx.occurred_at || tx.occurred_on;
    if (!dateSource || typeof dateSource !== 'string') continue;

    const monthKey = dateSource.slice(0, 7); // Trích xuất "YYYY-MM"
    if (!/^\d{4}-\d{2}$/.test(monthKey)) continue;

    const amount = Number(tx.amount) || 0;
    if (amount <= 0) continue;

    const current = monthMap.get(monthKey) || { income: 0, expense: 0 };

    if (tx.type === 'income') {
      current.income += amount;
    } else if (tx.type === 'expense') {
      current.expense += amount;
    }

    monthMap.set(monthKey, current);
  }

  // Chuyển đổi Map sang mảng và sắp xếp tăng dần theo chuỗi YYYY-MM
  const sortedMonths = Array.from(monthMap.entries()).sort(([monthA], [monthB]) =>
    monthA.localeCompare(monthB)
  );

  return sortedMonths.map(([month, totals]) => ({
    month,
    label: formatMonthAxisLabel(month),
    income: totals.income,
    expense: totals.expense,
  }));
}
