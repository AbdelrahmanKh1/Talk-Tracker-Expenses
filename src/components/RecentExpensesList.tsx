
import React from 'react';
import { Plus } from 'lucide-react';
import SwipeableExpenseItem from './SwipeableExpenseItem';
import { useCurrency } from '@/hooks/useCurrency';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface RecentExpensesListProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onEditExpense: (expense: any) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const RecentExpensesList = ({ 
  expenses, 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense 
}: RecentExpensesListProps) => {
  const { currency } = useCurrency();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Expenses</h3>
        <button 
          onClick={onAddExpense}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>
      
      {expenses.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-500">
          <p className="mb-2">No expenses found for this month.</p>
          <p className="text-sm">Add your first expense or try voice recording!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <SwipeableExpenseItem
              key={expense.id}
              expense={expense}
              onEdit={onEditExpense}
              onDelete={onDeleteExpense}
              currencySymbol={currency.symbol}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentExpensesList;
