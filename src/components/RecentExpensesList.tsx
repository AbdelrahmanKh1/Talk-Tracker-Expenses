import React, { useState } from 'react';
import { Plus, Receipt, TrendingUp, Calendar } from 'lucide-react';
import SwipeableExpenseItem from './SwipeableExpenseItem';
import { useCurrency } from '@/hooks/useCurrency';
import { Expense } from '@/types';

interface RecentExpensesListProps {
  expenses: Expense[];
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  isSearchResults?: boolean;
  searchTerm?: string;
}

const RecentExpensesList = ({ 
  expenses, 
  onAddExpense, 
  onEditExpense, 
  onDeleteExpense,
  isSearchResults = false,
  searchTerm = ''
}: RecentExpensesListProps) => {
  const { currency } = useCurrency();
  const [openActionId, setOpenActionId] = useState<string | null>(null);

  const handleToggle = (id: string): void => {
    setOpenActionId((prev) => (prev === id ? null : id));
  };

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageAmount = expenses.length > 0 ? totalAmount / expenses.length : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {isSearchResults ? 'Search Results' : 'Recent Expenses'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isSearchResults 
                ? `${expenses.length} result${expenses.length !== 1 ? 's' : ''} found`
                : `${expenses.length} expense${expenses.length !== 1 ? 's' : ''} this month`
              }
            </p>
          </div>
        </div>
        <button 
          onClick={onAddExpense}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </button>
      </div>

      {/* Quick Stats */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl">
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {currency.symbol} {totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {currency.symbol} {averageAmount.toFixed(0)}
            </p>
          </div>
        </div>
      )}
      
      {/* Scrollable Expenses List Container */}
      <div className="max-h-[500px] overflow-y-auto pr-2 scrollable-container">
        {expenses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isSearchResults ? 'No matching expenses found' : 'No expenses yet'}
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
              {isSearchResults 
                ? `No expenses found matching "${searchTerm}". Try adjusting your search terms or filters.`
                : 'Start tracking your expenses by adding your first transaction or try our voice recording feature!'
              }
            </p>
            {!isSearchResults && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button 
                  onClick={onAddExpense}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add First Expense
                </button>
                <button className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-200 font-medium">
                  <TrendingUp className="w-4 h-4" />
                  Try Voice Input
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <SwipeableExpenseItem
                key={expense.id}
                expense={expense}
                onEdit={onEditExpense}
                onDelete={onDeleteExpense}
                isOpen={openActionId === expense.id}
                onToggle={() => handleToggle(expense.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {expenses.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Showing {expenses.length} expense{expenses.length !== 1 ? 's' : ''} for this month
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentExpensesList;
