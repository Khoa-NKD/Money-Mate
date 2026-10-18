import { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatMoney } from '../../lib/format';
import type { MonthlyComparisonItem } from '../../utils/analytics';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useTheme } from '../../context/useTheme';

export interface MonthlyBarChartProps {
  /** Mảng dữ liệu so sánh thu chi theo từng tháng */
  data: MonthlyComparisonItem[];
  /** Tiêu đề biểu đồ (tùy chọn) */
  title?: string;
  /** Class CSS tùy biến */
  className?: string;
  /** Chiều cao tùy biến (mặc định responsive: 220px trên mobile <640px, 230px trên desktop) */
  height?: number;
}

/**
 * Định dạng số tiền vắn tắt trên trục Y (ví dụ: 10.000.000 -> "10tr", 500.000 -> "500k")
 */
function formatShortCurrency(value: number): string {
  if (value === 0) return '0';
  if (value >= 1_000_000) {
    const millions = value / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}tr`;
  }
  if (value >= 1_000) {
    const thousands = value / 1_000;
    return `${thousands.toFixed(0)}k`;
  }
  return String(value);
}

/**
 * Custom Tooltip hiển thị Thu Nhập, Chi Tiêu và Chênh Lệch Dòng Tiền chuẩn VND
 */
interface TooltipPayloadEntry {
  dataKey: string;
  name: string;
  value: number;
  color: string;
  payload: MonthlyComparisonItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}

function CustomMonthlyBarTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0].payload;
    const netSavings = item.income - item.expense;

    return (
      <div className="mm-bar-tooltip">
        <div className="mm-bar-tooltip-header">
          <span className="mm-bar-tooltip-title">📅 {label || item.month}</span>
        </div>
        <div className="mm-bar-tooltip-body">
          <div className="mm-bar-tooltip-row text-success">
            <span className="mm-bar-tooltip-dot bg-success" />
            <span className="mm-bar-tooltip-label">Thu nhập:</span>
            <span className="mm-bar-tooltip-val">+{formatMoney(item.income)}</span>
          </div>
          <div className="mm-bar-tooltip-row text-danger">
            <span className="mm-bar-tooltip-dot bg-danger" />
            <span className="mm-bar-tooltip-label">Chi tiêu:</span>
            <span className="mm-bar-tooltip-val">-{formatMoney(item.expense)}</span>
          </div>
          <div className="mm-bar-tooltip-row mm-bar-tooltip-net">
            <span className="mm-bar-tooltip-label">Dòng tiền ròng:</span>
            <span className={`mm-bar-tooltip-val ${netSavings >= 0 ? 'text-success' : 'text-danger'}`}>
              {netSavings >= 0 ? '+' : ''}
              {formatMoney(netSavings)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Component biểu đồ cột so sánh Thu Nhập và Chi Tiêu theo tháng
 * - Sử dụng Recharts với hai Bar: income (xanh lá), expense (đỏ)
 * - Bọc trong ResponsiveContainer cao 300px
 * - Tooltip hiển thị số tiền VND chuẩn MoneyMate và Legend chú thích
 */
export function MonthlyBarChart({
  data,
  title,
  className = '',
  height,
}: MonthlyBarChartProps) {
  const isMobile = useIsMobile(640);
  const { theme } = useTheme();
  const chartHeight = height ?? (isMobile ? 220 : 230);
  const axisColor = theme === 'dark' ? '#94A3B8' : '#64748B';
  const gridStroke = theme === 'dark' ? 'rgba(148, 163, 184, 0.15)' : 'rgba(148, 163, 184, 0.2)';

  const validData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data;
  }, [data]);

  // Nhánh kiểm tra rỗng: khi mảng dữ liệu rỗng, thay vì render biểu đồ hãy hiện một khối giữa vùng biểu đồ
  if (!data || data.length === 0 || validData.length === 0) {
    return (
      <div className={`mm-monthly-barchart-wrapper ${className}`}>
        {title && (
          <div className="mm-chart-header-row">
            <h4 className="mm-chart-title">{title}</h4>
          </div>
        )}
        <div className="mm-chart-empty" style={{ height: chartHeight }}>
          <span className="mm-chart-empty-icon" role="img" aria-label="Không có dữ liệu">📊</span>
          <p className="mm-chart-empty-text">Chưa có dữ liệu cho khoảng thời gian này</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mm-monthly-barchart-wrapper ${className}`}>
      {title && (
        <div className="mm-chart-header-row">
          <h4 className="mm-chart-title">{title}</h4>
        </div>
      )}

      {/* Bọc trong ResponsiveContainer width 100%, chiều cao 220px trên mobile */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={validData}
          margin={{ top: 10, right: 8, left: isMobile ? -14 : -8, bottom: 2 }}
          barGap={isMobile ? 3 : 5}
          barCategoryGap="22%"
        >
          {/* Lưới tọa độ với nét đứt mờ */}
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={gridStroke}
            vertical={false}
          />

          {/* Trục hoành: Nhãn tháng với font nhỏ gọn trên mobile */}
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }}
            tick={{ fill: axisColor, fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
          />

          {/* Trục tung: Giá trị tiền tệ rút gọn với font nhỏ gọn trên mobile */}
          <YAxis
            tickFormatter={formatShortCurrency}
            tickLine={false}
            axisLine={false}
            tick={{ fill: axisColor, fontSize: isMobile ? 9 : 11 }}
            width={isMobile ? 36 : 44}
          />

          {/* Tooltip hiển thị số tiền VND chi tiết */}
          <Tooltip
            content={<CustomMonthlyBarTooltip />}
            cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
          />

          {/* Legend phân biệt màu sắc hai cột với font nhỏ gọn trên mobile */}
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            iconSize={isMobile ? 7 : 9}
            wrapperStyle={{
              paddingBottom: isMobile ? '4px' : '8px',
              fontSize: isMobile ? '0.725rem' : '0.825rem',
              fontWeight: 600,
            }}
          />

          {/* Cột 1: Thu Nhập (Màu xanh lá #10B981) */}
          <Bar
            dataKey='income'
            name='Thu Nhập'
            fill='#10B981'
            radius={[4, 4, 0, 0]}
            maxBarSize={isMobile ? 20 : 28}
            isAnimationActive={false}
          />

          {/* Cột 2: Chi Tiêu (Màu đỏ tươi #EF4444) */}
          <Bar
            dataKey='expense'
            name='Chi Tiêu'
            fill='#EF4444'
            radius={[4, 4, 0, 0]}
            maxBarSize={isMobile ? 20 : 28}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyBarChart;
