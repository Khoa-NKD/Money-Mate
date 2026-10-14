/**
 * Hàm định dạng số tiền sang tiền tệ Việt Nam dạng "1.500.000 đ"
 *
 * @param amount Số tiền cần định dạng
 * @returns Chuỗi số tiền đã định dạng kèm đơn vị "đ" (ví dụ: "1.500.000 đ")
 */
export function formatMoney(amount: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 đ';
  }
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

/**
 * Hàm định dạng chuỗi ngày tháng sang định dạng tiếng Việt ngày/tháng/năm
 *
 * @param dateString Chuỗi thời gian (ISO string hoặc YYYY-MM-DD)
 * @returns Chuỗi ngày định dạng DD/MM/YYYY
 */
export function formatDate(dateString?: string): string {
  if (!dateString) return 'Chưa ghi nhận ngày';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}
