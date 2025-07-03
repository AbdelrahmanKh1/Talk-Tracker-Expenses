import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  created_at: string;
  updated_at: string;
  source: 'manual' | 'voice' | 'wallet';
}

export const useExpenses = () => {
  const { user, session } = useAuth();
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading, error } = useQuery({
    queryKey: ['expenses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching expenses:', error);
        throw error;
      }

      return data as Expense[];
    },
    enabled: !!user,
  });

  // Helper function to check budget notifications
  const checkBudgetNotifications = async (selectedMonth?: string) => {
    if (!session || !user) return;
    
    try {
      const month = selectedMonth ? 
        `${new Date(selectedMonth + ' 1').getFullYear()}-${String(new Date(selectedMonth + ' 1').getMonth() + 1).padStart(2, '0')}` :
        `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

      const response = await fetch('/functions/v1/check-budget-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ user_id: user.id, month }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.notification) {
          toast(result.notification.body, { 
            description: result.notification.title,
            duration: 5000
          });
        }
      }
    } catch (error) {
      console.error('Error checking budget notifications:', error);
    }
  };

  const addExpenseMutation = useMutation({
    mutationFn: async ({ 
      description, 
      amount, 
      category, 
      selectedMonth, 
      created_at 
    }: { 
      description: string; 
      amount: number; 
      category?: string;
      selectedMonth?: string;
      created_at?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate the expense date based on selectedMonth
      let expenseDate: string;
      if (selectedMonth) {
        // Parse the month-year format (e.g., "Dec 2024")
        const [monthName, year] = selectedMonth.split(' ');
        const targetYear = parseInt(year);
        
        // Create a more reliable date parsing using month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex === -1) {
          throw new Error(`Invalid month name: ${monthName}`);
        }
        
        const now = new Date();
        // If selected month and year match current month and year, use today's date
        if (monthIndex === now.getMonth() && targetYear === now.getFullYear()) {
          expenseDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
        } else {
          // For past or future months, use the 15th day of the month (middle of month)
          // This provides a more natural date assignment
          const monthDate = new Date(targetYear, monthIndex, 15);
          expenseDate = monthDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
        }
      } else {
        // Fallback to today's date if no month is selected
        expenseDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
      }

      // Use the provided created_at date or default to today
      const createdAtDate = created_at ? new Date(created_at).toISOString() : new Date().toISOString();

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description,
          amount,
          category: category || 'Miscellaneous',
          date: expenseDate,
          created_at: createdAtDate,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added successfully!');
      
      // Check budget notifications after adding expense
      checkBudgetNotifications(variables.selectedMonth);
    },
    onError: (error) => {
      console.error('Error adding expense:', error);
      toast.error('Failed to add expense');
    },
  });

  const addBulkExpensesMutation = useMutation({
    mutationFn: async ({ 
      expenses, 
      selectedMonth 
    }: { 
      expenses: { description: string; amount: number; category?: string }[];
      selectedMonth?: string;
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Calculate the expense date based on selectedMonth
      let expenseDate: string;
      if (selectedMonth) {
        // Parse the month-year format (e.g., "Dec 2024")
        const [monthName, year] = selectedMonth.split(' ');
        const targetYear = parseInt(year);
        
        // Create a more reliable date parsing using month names
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthName);
        
        if (monthIndex === -1) {
          throw new Error(`Invalid month name: ${monthName}`);
        }
        
        const now = new Date();
        // If selected month and year match current month and year, use today's date
        if (monthIndex === now.getMonth() && targetYear === now.getFullYear()) {
          expenseDate = now.toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
        } else {
          // For past or future months, use the 15th day of the month (middle of month)
          // This provides a more natural date assignment
          const monthDate = new Date(targetYear, monthIndex, 15);
          expenseDate = monthDate.toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
        }
      } else {
        // Fallback to today's date if no month is selected
        expenseDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format, timezone-safe
      }

      const expensesToInsert = expenses.map(expense => ({
        user_id: user.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category || 'Miscellaneous',
        date: expenseDate,
      }));

      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(`${data.length} expenses added successfully!`);
      
      // Check budget notifications after adding bulk expenses
      checkBudgetNotifications(variables.selectedMonth);
    },
    onError: (error) => {
      console.error('Error adding bulk expenses:', error);
      toast.error('Failed to add expenses');
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: async ({ 
      expenseId, 
      items 
    }: { 
      expenseId: string; 
      items: { description: string; amount: number; category: string; date?: string }[] 
    }) => {
      if (!user) throw new Error('User not authenticated');

      // Fetch the original expense to preserve created_at and date
      const { data: originalExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('created_at, date')
        .eq('id', expenseId)
        .eq('user_id', user.id)
        .single();
      if (fetchError) throw fetchError;

      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      const expensesToInsert = items.map(item => ({
        user_id: user.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
        date: item.date || originalExpense.date,
        created_at: item.created_at || originalExpense.created_at,
      }));

      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(`Expense updated with ${data.length} items!`);
      
      // Check budget notifications after updating expense
      checkBudgetNotifications();
    },
    onError: (error) => {
      console.error('Error updating expense:', error);
      toast.error('Failed to update expense');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (error) throw error;
      return expenseId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully!');
      
      // Check budget notifications after deleting expense
      checkBudgetNotifications();
    },
    onError: (error) => {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    },
  });

  // Get monthly total for selected month with proper date parsing
  const getMonthlyTotal = (monthYear?: string) => {
    if (!monthYear) return 0;
    
    // Parse the month-year format (e.g., "Dec 2024")
    const [monthName, year] = monthYear.split(' ');
    const targetYear = parseInt(year);
    
    // Create a more reliable date parsing using month names
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthName);
    
    if (monthIndex === -1) {
      console.error(`Invalid month name: ${monthName}`);
      return 0;
    }
    
    return expenses
      .filter(expense => {
        // Use the date field for filtering (this is the month the expense belongs to)
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.getUTCMonth();
        const expenseYear = expenseDate.getUTCFullYear();
        
        // Only show expenses from the exact selected month
        return expenseMonth === monthIndex && expenseYear === targetYear;
      })
      .reduce((total, expense) => total + Number(expense.amount), 0);
  };

  // Get expenses for selected month with proper date filtering
  const getExpensesForMonth = (monthYear?: string, sourceFilter?: 'wallet' | 'manual' | 'voice') => {
    if (!expenses) return [];

    let filtered = expenses;

    if (monthYear) {
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        const expenseMonth = expenseDate.toLocaleString('en-US', { month: 'short' });
        const expenseYear = expenseDate.getFullYear();
        return `${expenseMonth} ${expenseYear}` === monthYear;
      });
    }

    if (sourceFilter) {
      filtered = filtered.filter(expense => expense.source === sourceFilter);
    }
    
    return filtered;
  };

  // Get recent expenses (last 10) - KEEP AS FALLBACK
  const getRecentExpenses = () => {
    if (!expenses) return [];
    return expenses.slice(0, 10);
  };

  // Search expenses by description, category, amount, or date
  const searchExpenses = (searchTerm: string, monthYear?: string, filters?: {
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    dateRange?: {
      start: Date | null;
      end: Date | null;
    };
  }) => {
    let filteredExpenses = monthYear ? getExpensesForMonth(monthYear) : expenses;
    
    // Apply text search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      
      filteredExpenses = filteredExpenses.filter(expense => {
        // Search in description
        if (expense.description.toLowerCase().includes(term)) return true;
        
        // Search in category
        if (expense.category.toLowerCase().includes(term)) return true;
        
        // Search in amount (exact match or partial)
        if (expense.amount.toString().includes(term)) return true;
        
        // Search in date
        const expenseDate = new Date(expense.date || expense.created_at);
        const dateString = expenseDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }).toLowerCase();
        if (dateString.includes(term)) return true;
        
        // Search in formatted amount (e.g., "1000" matches "1,000")
        const formattedAmount = expense.amount.toLocaleString();
        if (formattedAmount.includes(term)) return true;
        
        return false;
      });
    }
    
    // Apply filters
    if (filters) {
      // Category filter
      if (filters.category) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.category.toLowerCase() === filters.category!.toLowerCase()
        );
      }
      
      // Amount range filter
      if (filters.minAmount !== undefined) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.amount >= filters.minAmount!
        );
      }
      
      if (filters.maxAmount !== undefined) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.amount <= filters.maxAmount!
        );
      }
      
      // Date range filter
      if (filters.dateRange?.start) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date || expense.created_at);
          return expenseDate >= filters.dateRange!.start!;
        });
      }
      
      if (filters.dateRange?.end) {
        filteredExpenses = filteredExpenses.filter(expense => {
          const expenseDate = new Date(expense.date || expense.created_at);
          return expenseDate <= filters.dateRange!.end!;
        });
      }
    }
    
    return filteredExpenses;
  };

  return {
    expenses,
    isLoading,
    error,
    addExpense: addExpenseMutation.mutate,
    isAddingExpense: addExpenseMutation.isPending,
    addBulkExpenses: addBulkExpensesMutation.mutate,
    isAddingBulkExpenses: addBulkExpensesMutation.isPending,
    updateExpense: updateExpenseMutation.mutate,
    isUpdatingExpense: updateExpenseMutation.isPending,
    deleteExpense: deleteExpenseMutation.mutate,
    isDeletingExpense: deleteExpenseMutation.isPending,
    getMonthlyTotal,
    getExpensesForMonth,
    getRecentExpenses,
    searchExpenses,
    invalidateQueries: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  };
};