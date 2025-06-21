
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
    mutationFn: async ({ description, amount, category }: { description: string; amount: number; category?: string }) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          description,
          amount,
          category: category || 'Miscellaneous',
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
    mutationFn: async (expenses: { description: string; amount: number; category?: string }[]) => {
      if (!user) throw new Error('User not authenticated');

      const expensesToInsert = expenses.map(expense => ({
        user_id: user.id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category || 'Miscellaneous',
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
      items: { description: string; amount: number; category: string }[] 
    }) => {
      if (!user) throw new Error('User not authenticated');

      // First, delete the original expense
      const { error: deleteError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Then insert the new items
      const expensesToInsert = items.map(item => ({
        user_id: user.id,
        description: item.description,
        amount: item.amount,
        category: item.category,
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

  // Get monthly total for current month
  const getMonthlyTotal = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((total, expense) => total + Number(expense.amount), 0);
  };

  // Get recent expenses (last 5)
  const getRecentExpenses = () => {
    return expenses.slice(0, 5);
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
    getMonthlyTotal,
    getRecentExpenses,
  };
};
