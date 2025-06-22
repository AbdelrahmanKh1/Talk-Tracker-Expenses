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
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 flex flex-col items-center justify-center shadow-md">
          <svg width="48" height="48" fill="none" viewBox="0 0 24 24" className="mb-2 opacity-60">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="#0d9488" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="#0d9488" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="#0d9488" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="#0d9488" strokeWidth="2"/>
          </svg>
          <p className="mb-1 font-medium">No expenses for this month</p>
          <p className="text-xs text-gray-400">Start by adding your first expense!</p>
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
