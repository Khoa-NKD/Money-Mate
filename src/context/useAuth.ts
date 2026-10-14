import { useContext } from 'react';
import { AuthContext } from './auth-context';
import type { AuthContextType } from '../types/auth';

/**
 * Custom hook truy cập AuthContext
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
