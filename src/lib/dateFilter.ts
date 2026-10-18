/**
 * Tiện ích hỗ trợ lọc thời gian cho giao dịch tài chính trong MoneyMate
 */

export interface MonthOption {
  value: string;
  label: string;
}

/**
 * Lấy tháng hiện tại theo định dạng YYYY-MM (ví dụ: "2026-10")
 */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Tính toán mốc thời gian bắt đầu (startIso) và kết thúc (endIso) của một tháng
 * Dùng cho toán tử .gte và .lt trong câu truy vấn Supabase
 *
 * @param monthStr Chuỗi tháng dạng "YYYY-MM" (ví dụ: "2026-10")
 * @returns { startIso, endIso } Chuỗi ISO chuẩn
 */
export function getMonthBounds(monthStr: string): { startIso: string; endIso: string } {
  if (!monthStr || !monthStr.includes('-')) {
    throw new Error(`Định dạng tháng không hợp lệ: "${monthStr}". Yêu cầu định dạng YYYY-MM.`);
  }

  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-12

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    throw new Error(`Giá trị năm hoặc tháng không hợp lệ: "${monthStr}".`);
  }

  // Bắt đầu tháng (00:00:00.000 theo giờ địa phương)
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);

  // Bắt đầu tháng kế tiếp (00:00:00.000 theo giờ địa phương)
  const nextMonthDate = new Date(year, month, 1, 0, 0, 0, 0);

  return {
    startIso: startDate.toISOString(),
    endIso: nextMonthDate.toISOString(),
  };
}

/**
 * Sinh danh sách các tùy chọn tháng cho Dropdown chọn tháng
 * Mặc định gồm tháng hiện tại, các tháng trước đó và tùy chọn "Tất cả các tháng"
 *
 * @param pastMonths Số tháng quá khứ cần sinh (mặc định 12)
 * @param futureMonths Số tháng tương lai cần sinh (mặc định 1)
 */
export function generateMonthOptions(pastMonths = 12, futureMonths = 1): MonthOption[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth(); // 0-11
  const currentMonthValue = getCurrentMonthString();

  const options: MonthOption[] = [
    { value: '', label: 'Tất cả các tháng' },
  ];

  for (let offset = futureMonths; offset >= -pastMonths; offset--) {
    const d = new Date(currentYear, currentMonthIndex + offset, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${y}-${m}`;
    const isCurrent = value === currentMonthValue;

    options.push({
      value,
      label: `Tháng ${m}/${y}${isCurrent ? ' (Hiện tại)' : ''}`,
    });
  }

  return options;
}

/**
 * Định dạng nhãn hiển thị cho một giá trị tháng YYYY-MM
 */
export function formatMonthLabel(monthStr?: string): string {
  if (!monthStr) return 'Tất cả các tháng';
  const parts = monthStr.split('-');
  if (parts.length === 2) {
    return `Tháng ${parts[1]}/${parts[0]}`;
  }
  return monthStr;
}
