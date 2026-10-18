import { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { Navbar } from '../ui/Navbar';
import { StatCard } from '../ui/StatCard';
import {
  WalletIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  SparklesIcon,
} from '../ui/Icons';
import { TransactionList } from './TransactionList';
import { AddTransactionForm } from './AddTransactionForm';
import { CategoryManager } from './CategoryManager';
import { ExpensePieChart } from './ExpensePieChart';
import { MonthlyBarChart } from './MonthlyBarChart';
import { useTransactions } from '../../hooks/useTransactions';
import { formatMoney } from '../../lib/format';
import { aggregateByMonth } from '../../utils/analytics';
import type { TransactionListItem } from '../../types/database';

// Dữ liệu mẫu trực quan khi tài khoản mới chưa có giao dịch
const DEMO_TRANSACTIONS: TransactionListItem[] = [
  {
    id: 'demo-1',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 4800000,
    type: 'expense',
    category: { id: 'demo-cat-1', user_id: 'demo', name: 'Ăn uống', color: '#EF4444', icon: '🍔' },
    occurred_at: '2026-10-05T12:00:00Z',
    occurred_on: '2026-10-05',
  },
  {
    id: 'demo-2',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 2500000,
    type: 'expense',
    category: { id: 'demo-cat-2', user_id: 'demo', name: 'Mua sắm', color: '#F59E0B', icon: '🛒' },
    occurred_at: '2026-10-08T15:00:00Z',
    occurred_on: '2026-10-08',
  },
  {
    id: 'demo-3',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 1200000,
    type: 'expense',
    category: { id: 'demo-cat-3', user_id: 'demo', name: 'Di chuyển', color: '#3B82F6', icon: '🚗' },
    occurred_at: '2026-10-10T09:00:00Z',
    occurred_on: '2026-10-10',
  },
  {
    id: 'demo-4',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 1800000,
    type: 'expense',
    category: { id: 'demo-cat-4', user_id: 'demo', name: 'Hóa đơn & Tiện ích', color: '#F97316', icon: '⚡' },
    occurred_at: '2026-10-12T10:00:00Z',
    occurred_on: '2026-10-12',
  },
  {
    id: 'demo-5',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 950000,
    type: 'expense',
    category: { id: 'demo-cat-5', user_id: 'demo', name: 'Giải trí', color: '#EC4899', icon: '🎮' },
    occurred_at: '2026-10-14T20:00:00Z',
    occurred_on: '2026-10-14',
  },
  {
    id: 'demo-6',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 18000000,
    type: 'income',
    category: { id: 'demo-cat-6', user_id: 'demo', name: 'Lương', color: '#10B981', icon: '💰' },
    occurred_at: '2026-10-01T08:00:00Z',
    occurred_on: '2026-10-01',
  },
  {
    id: 'demo-7',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 17500000,
    type: 'income',
    category: { id: 'demo-cat-6', user_id: 'demo', name: 'Lương', color: '#10B981', icon: '💰' },
    occurred_at: '2026-09-01T08:00:00Z',
    occurred_on: '2026-09-01',
  },
  {
    id: 'demo-8',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 9800000,
    type: 'expense',
    category: { id: 'demo-cat-1', user_id: 'demo', name: 'Ăn uống', color: '#EF4444', icon: '🍔' },
    occurred_at: '2026-09-15T12:00:00Z',
    occurred_on: '2026-09-15',
  },
  {
    id: 'demo-9',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 17000000,
    type: 'income',
    category: { id: 'demo-cat-6', user_id: 'demo', name: 'Lương', color: '#10B981', icon: '💰' },
    occurred_at: '2026-08-01T08:00:00Z',
    occurred_on: '2026-08-01',
  },
  {
    id: 'demo-10',
    user_id: 'demo',
    category_id: null,
    note: null,
    amount: 8600000,
    type: 'expense',
    category: { id: 'demo-cat-1', user_id: 'demo', name: 'Ăn uống', color: '#EF4444', icon: '🍔' },
    occurred_at: '2026-08-18T12:00:00Z',
    occurred_on: '2026-08-18',
  },
];

export function UserDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'transactions' | 'categories'>('transactions');
  const [txRefreshTrigger, setTxRefreshTrigger] = useState<number>(0);
  const [catRefreshTrigger, setCatRefreshTrigger] = useState<number>(0);
  const formRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu giao dịch toàn thời gian để tính toán KPI và biểu đồ
  const { transactions: allTransactions, refetch: refetchChartData } = useTransactions({
    limit: 100,
    month: '', // Tải dữ liệu toàn thời gian
  });

  // Tự động làm mới dữ liệu khi có giao dịch mới hoặc danh mục thay đổi
  useEffect(() => {
    if (txRefreshTrigger > 0 || catRefreshTrigger > 0) {
      refetchChartData();
    }
  }, [txRefreshTrigger, catRefreshTrigger, refetchChartData]);

  // Nguồn dữ liệu giao dịch cho biểu đồ & KPI
  const effectiveTransactions = useMemo(() => {
    if (user && allTransactions && allTransactions.length > 0) {
      return allTransactions;
    }
    if (!user) {
      return DEMO_TRANSACTIONS;
    }
    return allTransactions || [];
  }, [user, allTransactions]);

  // Lấy thời điểm hiện tại từ state để đảm bảo tính thuần khiết (pure render)
  const [currentDate] = useState(() => new Date());

  // Tính toán 4 chỉ số tài chính KPI hàng đầu
  const kpis = useMemo(() => {
    const totalIncome = effectiveTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = effectiveTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    // Tính toán theo tháng hiện tại
    const currentMonthStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthTx = effectiveTransactions.filter((t) =>
      t.occurred_at?.startsWith(currentMonthStr)
    );

    const currentMonthIncome = currentMonthTx
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpense = currentMonthTx
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // Sử dụng số liệu tháng này nếu có, ngược lại lấy toàn kỳ
    const displayIncome = currentMonthIncome > 0 ? currentMonthIncome : totalIncome;
    const displayExpense = currentMonthExpense > 0 ? currentMonthExpense : totalExpense;
    const hasCurrentMonthData = currentMonthTx.length > 0;

    const baseIncome = hasCurrentMonthData ? currentMonthIncome : totalIncome;
    const baseExpense = hasCurrentMonthData ? currentMonthExpense : totalExpense;

    const savingsRate =
      baseIncome > 0
        ? Math.max(0, Math.min(100, Math.round(((baseIncome - baseExpense) / baseIncome) * 100)))
        : 0;

    return {
      netBalance,
      displayIncome,
      displayExpense,
      savingsRate,
      hasCurrentMonthData,
      currentMonthNum: currentDate.getMonth() + 1,
    };
  }, [effectiveTransactions, currentDate]);

  // Tính toán dữ liệu tỷ trọng chi tiêu (Pie Chart)
  const { chartData, realExpenseTotal } = useMemo(() => {
    const expenseList = effectiveTransactions.filter((t) => t.type === 'expense');

    if (expenseList.length === 0) {
      return {
        chartData: [],
        realExpenseTotal: 0,
      };
    }

    const map = new Map<string, { name: string; value: number; color: string }>();

    for (const item of expenseList) {
      const catName = item.category?.name || 'Chi tiêu khác';
      const catColor = item.category?.color || '#EF4444';
      const current = map.get(catName);
      if (current) {
        current.value += item.amount;
      } else {
        map.set(catName, { name: catName, value: item.amount, color: catColor });
      }
    }

    const aggregated = Array.from(map.values()).sort((a, b) => b.value - a.value);
    const total = aggregated.reduce((sum, item) => sum + item.value, 0);

    return {
      chartData: aggregated,
      realExpenseTotal: total,
    };
  }, [effectiveTransactions]);

  // Tổng hợp dữ liệu thu chi theo tháng cho MonthlyBarChart
  const { monthlyData } = useMemo(() => {
    const aggregated = aggregateByMonth(effectiveTransactions);
    return {
      monthlyData: aggregated,
    };
  }, [effectiveTransactions]);

  const handleQuickAddFocus = () => {
    setActiveTab('transactions');
    setTimeout(() => {
      const amountInput = document.getElementById('tx-amount') as HTMLInputElement | null;
      if (amountInput) {
        amountInput.focus();
        amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  return (
    <div className='mm-dashboard-layout'>
      {/* Top App Bar Navigation */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickAdd={handleQuickAddFocus}
      />

      <div className='mm-dashboard-content'>
        {/* Tab 1: Sổ Giao Dịch & Báo Cáo Phân Tích */}
        {activeTab === 'transactions' && (
          <div className='mm-tab-transactions'>
            {/* Bento KPI Row: 4 Thẻ chỉ số tài chính */}
            <section className='mm-kpi-grid' aria-label='Chỉ số tài chính chính'>
              <StatCard
                title='Tổng Số Dư Khả Dụng'
                amount={formatMoney(kpis.netBalance)}
                subtitle={kpis.netBalance >= 0 ? 'Dòng tiền thặng dư an toàn' : 'Cần cân đối dòng tiền'}
                type='balance'
                icon={<WalletIcon size={22} />}
              />

              <StatCard
                title={kpis.hasCurrentMonthData ? `Thu Nhập Tháng ${kpis.currentMonthNum}` : 'Tổng Thu Nhập'}
                amount={formatMoney(kpis.displayIncome)}
                subtitle={kpis.hasCurrentMonthData ? 'Ghi nhận tháng này' : 'Toàn thời gian'}
                type='income'
                trend={{ value: 'Dòng tiền vào', isPositive: true }}
                icon={<TrendingUpIcon size={22} />}
              />

              <StatCard
                title={kpis.hasCurrentMonthData ? `Chi Tiêu Tháng ${kpis.currentMonthNum}` : 'Tổng Chi Tiêu'}
                amount={formatMoney(kpis.displayExpense)}
                subtitle={kpis.hasCurrentMonthData ? 'Ghi nhận tháng này' : 'Toàn thời gian'}
                type='expense'
                trend={{ value: 'Dòng tiền ra', isPositive: false }}
                icon={<TrendingDownIcon size={22} />}
              />

              <StatCard
                title='Tỷ Lệ Tiết Kiệm'
                amount={`${kpis.savingsRate}%`}
                subtitle={kpis.savingsRate >= 20 ? 'Đạt chuẩn tích lũy (>20%)' : 'Mục tiêu tích lũy thêm'}
                type='savings'
                icon={<SparklesIcon size={22} />}
              />
            </section>

            {/* Bento Grid: Form Thêm Giao Dịch (Trái) + Biểu Đồ Phân Tích (Phải) */}
            <div className='mm-dashboard-top-grid' ref={formRef}>
              <div className='mm-form-column'>
                <AddTransactionForm
                  onSuccess={() => setTxRefreshTrigger((prev) => prev + 1)}
                  categoryRefreshTrigger={catRefreshTrigger}
                />
              </div>

              {/* Cột các biểu đồ phân tích trực quan */}
              <div className='mm-charts-column'>
                {/* Biểu đồ 1: Cơ cấu chi tiêu (Donut / Pie) */}
                <div className='mm-card mm-chart-card'>
                  <div className='mm-card-header'>
                    <div className='mm-tx-header-title'>
                      <div className='mm-header-icon-box'>
                        <TrendingDownIcon size={18} />
                      </div>
                      <div>
                        <h3>Cơ Cấu Chi Tiêu</h3>
                        <p className='mm-card-subtitle'>Tỷ trọng phân bổ theo danh mục</p>
                      </div>
                    </div>
                    {chartData.length > 0 && (
                      <span className='mm-badge badge-info'>
                        Tổng: {formatMoney(realExpenseTotal)}
                      </span>
                    )}
                  </div>
                  <div className='mm-card-body mm-chart-card-body'>
                    <ExpensePieChart data={chartData} />
                  </div>
                </div>

                {/* Biểu đồ 2: So sánh Thu nhập - Chi tiêu theo tháng */}
                <div className='mm-card mm-chart-card mm-monthly-chart-card'>
                  <div className='mm-card-header'>
                    <div className='mm-tx-header-title'>
                      <div className='mm-header-icon-box'>
                        <TrendingUpIcon size={18} />
                      </div>
                      <div>
                        <h3>Biến Động Dòng Tiền Theo Tháng</h3>
                        <p className='mm-card-subtitle'>So sánh dòng tiền vào và ra</p>
                      </div>
                    </div>
                    {monthlyData.length > 0 && (
                      <span className='mm-badge badge-success'>
                        {monthlyData.length} tháng gần nhất
                      </span>
                    )}
                  </div>
                  <div className='mm-card-body mm-monthly-chart-card-body'>
                    <MonthlyBarChart data={monthlyData} />
                  </div>
                </div>
              </div>
            </div>

            {/* Danh Sách Giao Dịch & Bộ Lọc Nâng Cao (Full Width) */}
            <div className='mm-transactions-bottom-section'>
              <TransactionList
                refreshTrigger={txRefreshTrigger}
                categoryRefreshTrigger={catRefreshTrigger}
                onAddNewTransaction={handleQuickAddFocus}
              />
            </div>
          </div>
        )}

        {/* Tab 2: Quản Lý Danh Mục */}
        {activeTab === 'categories' && (
          <div className='mm-tab-categories'>
            <CategoryManager
              onCategoriesChange={() => {
                setCatRefreshTrigger((prev) => prev + 1);
                setTxRefreshTrigger((prev) => prev + 1);
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
