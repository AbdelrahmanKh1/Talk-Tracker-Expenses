import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 'https://rslwcgjgzezptoblckua.functions.supabase.co';

export interface BudgetStatus {
  month: string;
  budget: number;
  spent: number;
  remaining: number;
  percent: number;
  currency?: string;
}

export const useBudget = (selectedMonth?: string) => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();
  const { currency: localCurrency } = useCurrency();

  // Get current month in YYYY-MM format
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };

  // Convert selectedMonth from "Jun 2025" format to "2025-06" format
  const getMonthForQuery = () => {
    if (!selectedMonth) return getCurrentMonth();
    
    const [monthName, year] = selectedMonth.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthName);
    const targetYear = parseInt(year);
    
    if (monthIndex === -1) return getCurrentMonth();
    
    return `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  // Fetch budget status for a specific month
  const { data: budgetStatus, isLoading, error } = useQuery({
    queryKey: ['budget-status', user?.id, getMonthForQuery(), localCurrency.code],
    queryFn: async () => {
      if (!user || !session) return null;
      
      try {
        const month = getMonthForQuery();
        const res = await fetch(`${FUNCTIONS_URL}/get-budget-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id, month }),
        });
        
        if (!res.ok) throw new Error('Failed to fetch budget status');
        
        const data = await res.json();
        return data as BudgetStatus;
      } catch (error) {
        console.error('Error fetching budget status:', error);
        return null;
      }
    },
    enabled: !!user && !!session,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Set budget for a month
  const setBudgetMutation = useMutation({
    mutationFn: async ({ month, budgetAmount, budgetCurrency }: { month: string; budgetAmount: number; budgetCurrency?: string }) => {
      if (!user || !session) throw new Error('User not authenticated');

      const res = await fetch(`${FUNCTIONS_URL}/set-budget`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          month,
          budget_amount: budgetAmount,
          budget_currency: budgetCurrency || localCurrency.code
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to set budget');
      }

      return await res.json();
    },
    onSuccess: async (data, variables) => {
      // Immediately update the cache for the specific month
      const { month, budgetAmount, budgetCurrency } = variables;
      
      // Fetch fresh budget data from the server to get accurate spent amounts
      try {
        const res = await fetch(`${FUNCTIONS_URL}/get-budget-status`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ user_id: user.id, month }),
        });
        
        if (res.ok) {
          const freshData = await res.json();
          const queryKey = ['budget-status', user?.id, month, budgetCurrency || localCurrency.code];
          
          // Update the cache with fresh data from server
          queryClient.setQueryData(queryKey, freshData);
        }
      } catch (error) {
        console.error('Error fetching fresh budget data:', error);
      }
      
      // Small delay to ensure cache is updated before invalidating
      setTimeout(() => {
        // Invalidate and refetch all budget queries to ensure consistency
        queryClient.invalidateQueries({ 
          queryKey: ['budget-status'], 
          exact: false 
        });
        
        // Force refetch to ensure all components get updated data
        queryClient.refetchQueries({ 
          queryKey: ['budget-status'], 
          exact: false 
        });
      }, 100);
      
      toast.success('Budget updated successfully!');
    },
    onError: (error) => {
      console.error('Error setting budget:', error);
      toast.error('Failed to update budget');
    },
  });

  // Check budget notifications
  const checkNotificationsMutation = useMutation({
    mutationFn: async ({ month }: { month: string }) => {
      if (!user || !session) throw new Error('User not authenticated');

      const res = await fetch(`${FUNCTIONS_URL}/check-budget-notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id, month }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to check notifications');
      }

      return await res.json();
    },
    onSuccess: (data) => {
      if (data.notification) {
        toast(data.notification.body, { 
          description: data.notification.title,
          duration: 5000
        });
      }
    },
    onError: (error) => {
      console.error('Error checking notifications:', error);
    },
  });

  // Get budget for a specific month
  const getBudgetForMonth = async (month: string) => {
    if (!user || !session) return null;
    
    try {
      const res = await fetch(`${FUNCTIONS_URL}/get-budget-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id, month }),
      });
      
      if (!res.ok) throw new Error('Failed to fetch budget');
      
      return await res.json();
    } catch (error) {
      console.error('Error fetching budget for month:', error);
      return null;
    }
  };

  // Function to refresh all budget data
  const refreshAllBudgets = async () => {
    if (!user || !session) return;
    
    // Invalidate and refetch all budget queries
    await queryClient.invalidateQueries({ 
      queryKey: ['budget-status'], 
      exact: false 
    });
    await queryClient.refetchQueries({ 
      queryKey: ['budget-status'], 
      exact: false 
    });
  };

  // Function to prefetch budget data for multiple months
  const prefetchBudgetData = async (months: string[]) => {
    if (!user || !session) return;
    
    const prefetchPromises = months.map(async (month) => {
      const queryKey = ['budget-status', user.id, month, localCurrency.code];
      
      // Only prefetch if not already in cache
      if (!queryClient.getQueryData(queryKey)) {
        try {
          const res = await fetch(`${FUNCTIONS_URL}/get-budget-status`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ user_id: user.id, month }),
          });
          
          if (res.ok) {
            const data = await res.json();
            queryClient.setQueryData(queryKey, data);
          }
        } catch (error) {
          console.error(`Error prefetching budget for ${month}:`, error);
        }
      }
    });
    
    await Promise.all(prefetchPromises);
  };

  return {
    budgetStatus,
    isLoading,
    error,
    setBudget: setBudgetMutation.mutate,
    isSettingBudget: setBudgetMutation.isPending,
    checkNotifications: checkNotificationsMutation.mutate,
    isCheckingNotifications: checkNotificationsMutation.isPending,
    getBudgetForMonth,
    getCurrentMonth,
    refreshAllBudgets,
    prefetchBudgetData,
  };
}; 