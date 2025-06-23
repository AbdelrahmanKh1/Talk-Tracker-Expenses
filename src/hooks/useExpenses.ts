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
}

export const useExpenses = () => {
  const { user } = useAuth();
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

      // Convert selected month to date if provided
      let expenseDate = new Date().toISOString().split('T')[0]; // default to today
      
      if (selectedMonth) {
        const [monthName, year] = selectedMonth.split(' ');
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const targetYear = parseInt(year);
        expenseDate = new Date(targetYear, monthIndex, 1).toISOString().split('T')[0];
      }

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description,
          amount,
          category: category || 'Miscellaneous',
          date: expenseDate,
          created_at: created_at || new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense added successfully!');
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

      // Convert selected month to date if provided
      let expenseDate = new Date().toISOString().split('T')[0]; // default to today
      
      if (selectedMonth) {
        const [monthName, year] = selectedMonth.split(' ');
        const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
        const targetYear = parseInt(year);
        expenseDate = new Date(targetYear, monthIndex, 1).toISOString().split('T')[0];
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success(`${data.length} expenses added successfully!`);
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
      items: { description: string; amount: number; category: string; created_at?: string; date?: string }[] 
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
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const targetYear = parseInt(year);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.created_at);
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === targetYear;
      })
      .reduce((total, expense) => total + Number(expense.amount), 0);
  };

  // Get expenses for selected month with proper date filtering
  const getExpensesForMonth = (monthYear?: string) => {
    if (!monthYear) return [];
    
    // Parse the month-year format (e.g., "Dec 2024")
    const [monthName, year] = monthYear.split(' ');
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
    const targetYear = parseInt(year);
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.created_at);
        return expenseDate.getMonth() === monthIndex && expenseDate.getFullYear() === targetYear;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  // Get recent expenses (last 10) - KEEP AS FALLBACK
  const getRecentExpenses = () => {
    return expenses.slice(0, 10);
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
  };
};
