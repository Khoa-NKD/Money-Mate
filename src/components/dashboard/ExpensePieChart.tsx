import { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { formatMoney } from '../../lib/format';

import { useIsMobile } from '../../hooks/useIsMobile';
import { useTheme } from '../../context/useTheme';

/**
 * Kiểu dữ liệu từng phần tử trong mảng data của ExpensePieChart
 */
export interface ExpensePieChartItem {
  /** Tên danh mục chi tiêu */
  name: string;
  /** Số tiền chi tiêu */
  value: number;
  /** Mã màu hiển thị trên biểu đồ (hex/rgb/hsl) */
  color?: string;
}

/**
 * Props của component ExpensePieChart
 */
export interface ExpensePieChartProps {
  /** Mảng dữ liệu các danh mục chi tiêu: { name, value, color } */
  data: ExpensePieChartItem[];
  /** Tiêu đề biểu đồ (tùy chọn) */
  title?: string;
  /** Class CSS tùy biến (tùy chọn) */
  className?: string;
  /** Chiều cao tùy biến (mặc định responsive: 220px trên mobile <640px, 230px trên desktop) */
  height?: number;
}

/** Bảng màu dự phòng hài hòa khi phần tử không có color */
const FALLBACK_COLORS = [
  '#EF4444', // Đỏ - Ăn uống
  '#F59E0B', // Cam - Mua sắm
  '#3B82F6', // Xanh dương - Di chuyển
  '#10B981', // Xanh lá - Lương / Thu nhập
  '#8B5CF6', // Tím - Khác
  '#EC4899', // Hồng - Giải trí
  '#06B6D4', // Cyan - Dịch vụ
  '#F97316', // Cam đậm - Hóa đơn
  '#14B8A6', // Teal - Y tế
  '#6366F1', // Indigo - Giáo dục
];

/**
 * Custom Tooltip hiển thị tên danh mục và số tiền định dạng VND chuẩn MoneyMate
 */
interface TooltipPayloadItem {
  name: string;
  value: number;
  payload: ExpensePieChartItem;
  color?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function CustomExpenseTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    const dataItem = item.payload;
    const sliceColor = item.color || dataItem.color || '#10B981';

    return (
      <div className="mm-pie-tooltip">
        <div className="mm-pie-tooltip-header">
          <span
            className="mm-pie-tooltip-dot"
            style={{ backgroundColor: sliceColor }}
          />
          <span className="mm-pie-tooltip-name">{dataItem.name}</span>
        </div>
        <div className="mm-pie-tooltip-body">
          <span className="mm-pie-tooltip-amount">
            {formatMoney(dataItem.value)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Component biểu đồ tròn phân tích cơ cấu chi tiêu dùng Recharts
 * - Nhận prop data: mảng { name, value, color }
 * - Vẽ PieChart với Pie (dataKey=value, nameKey=name), mỗi lát dùng Cell tô màu theo color
 * - Tooltip hiển thị tên danh mục + số tiền định dạng VND, và Legend
 * - Bọc trong ResponsiveContainer cao đúng 320px
 */
export function ExpensePieChart({
  data,
  title,
  className = '',
  height,
}: ExpensePieChartProps) {
  const isMobile = useIsMobile(640);
  const { theme } = useTheme();
  const chartHeight = height ?? (isMobile ? 220 : 230);

  // Lọc các bản ghi có giá trị hợp lệ (> 0)
  const validData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((item) => typeof item.value === 'number' && item.value > 0);
  }, [data]);

  // Tính tổng số tiền chi tiêu
  const totalAmount = useMemo(() => {
    return validData.reduce((sum, item) => sum + item.value, 0);
  }, [validData]);

  // Nhánh kiểm tra rỗng: khi mảng dữ liệu rỗng, thay vì render biểu đồ hãy hiện một khối giữa vùng biểu đồ
  if (!data || data.length === 0 || validData.length === 0) {
    return (
      <div className={`mm-pie-chart-wrapper ${className}`}>
        {title && <h4 className="mm-chart-title">{title}</h4>}
        <div className="mm-chart-empty" style={{ height: chartHeight }}>
          <span className="mm-chart-empty-icon" role="img" aria-label="Không có dữ liệu">📊</span>
          <p className="mm-chart-empty-text">Chưa có dữ liệu cho khoảng thời gian này</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mm-pie-chart-wrapper ${className}`}>
      {title && (
        <div className="mm-chart-header-row">
          <h4 className="mm-chart-title">{title}</h4>
          <span className="mm-badge badge-info">
            Tổng chi: {formatMoney(totalAmount)}
          </span>
        </div>
      )}

      {/* Bọc trong ResponsiveContainer width 100%, chiều cao 220px trên mobile */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <PieChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Pie
            data={validData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            outerRadius={isMobile ? 65 : 78}
            innerRadius={isMobile ? 35 : 44}
            paddingAngle={3}
            isAnimationActive={false}
          >
            {validData.map((entry, index) => {
              const fillColor =
                entry.color && entry.color.trim() !== ''
                  ? entry.color
                  : FALLBACK_COLORS[index % FALLBACK_COLORS.length];

              return (
                <Cell
                  key={`slice-${entry.name}-${index}`}
                  fill={fillColor}
                  stroke={theme === 'dark' ? '#1e293b' : '#ffffff'}
                  strokeWidth={2}
                />
              );
            })}
          </Pie>

          {/* Tooltip hiển thị tên danh mục + số tiền định dạng VND */}
          <Tooltip content={<CustomExpenseTooltip />} />

          {/* Legend hiển thị chú thích danh mục với font nhỏ gọn trên mobile */}
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={isMobile ? 8 : 10}
            wrapperStyle={{
              paddingTop: isMobile ? '6px' : '10px',
              fontSize: isMobile ? '0.725rem' : '0.825rem',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
export default ExpensePieChart;
