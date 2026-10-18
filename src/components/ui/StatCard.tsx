import type { ReactNode } from 'react';

export interface StatCardProps {
  title: string;
  amount: string;
  subtitle?: string;
  type?: 'balance' | 'income' | 'expense' | 'savings';
  trend?: {
    value: string;
    label?: string;
    isPositive?: boolean;
  };
  icon: ReactNode;
}

export function StatCard({
  title,
  amount,
  subtitle,
  type = 'balance',
  trend,
  icon,
}: StatCardProps) {
  const typeClassMap = {
    balance: 'mm-stat-balance',
    income: 'mm-stat-income',
    expense: 'mm-stat-expense',
    savings: 'mm-stat-savings',
  };

  return (
    <div className={`mm-card mm-stat-card ${typeClassMap[type]}`}>
      <div className='mm-stat-card-header'>
        <span className='mm-stat-title'>{title}</span>
        <div className={`mm-stat-icon-wrap mm-stat-icon-${type}`}>
          {icon}
        </div>
      </div>

      <div className='mm-stat-card-body'>
        <div className='mm-stat-amount'>{amount}</div>
        
        {(trend || subtitle) && (
          <div className='mm-stat-footer'>
            {trend && (
              <span
                className={`mm-stat-trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
            )}
            {subtitle && <span className='mm-stat-subtitle'>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
