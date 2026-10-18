import { useContext } from 'react';
import { ThemeContext, type ThemeContextType } from './theme-context';

/**
 * Hook sử dụng Theme trong MoneyMate
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme phải được sử dụng bên trong ThemeProvider');
  }
  return context;
}
