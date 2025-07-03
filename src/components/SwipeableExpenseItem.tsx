import React, { useState, useRef } from 'react';
import { Edit, Trash2, Utensils, Car, ShoppingBag, HeartPulse, Gamepad2, Receipt, Wallet as WalletIcon, Box } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Expense } from '@/types';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { formatCompactNumber } from '@/lib/utils';

interface SwipeableExpenseItemProps {
  expense: Expense;
  onEdit: (expense: Expense) => void;
  onDelete: (expenseId: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Food: <Utensils size={24} strokeWidth={2.2} className="text-teal-600" />,
  Transport: <Car size={24} strokeWidth={2.2} className="text-teal-600" />,
  Shopping: <ShoppingBag size={24} strokeWidth={2.2} className="text-teal-600" />,
  Health: <HeartPulse size={24} strokeWidth={2.2} className="text-teal-600" />,
  Entertainment: <Gamepad2 size={24} strokeWidth={2.2} className="text-teal-600" />,
  Bills: <Receipt size={24} strokeWidth={2.2} className="text-teal-600" />,
  Education: <WalletIcon size={24} strokeWidth={2.2} className="text-teal-600" />,
  Travel: <WalletIcon size={24} strokeWidth={2.2} className="text-teal-600" />,
  Miscellaneous: <Box size={24} strokeWidth={2.2} className="text-teal-600" />,
};

const SwipeableExpenseItem: React.FC<SwipeableExpenseItemProps> = ({
  expense,
  onEdit,
  onDelete,
  isOpen = false,
  onToggle
}) => {
  const { settings } = useUserSettings();

  const handleEditClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onEdit(expense);
    if (onToggle) onToggle();
  };

  const handleDeleteClick = (e: React.MouseEvent): void => {
    e.stopPropagation();
    onDelete(expense.id);
    if (onToggle) onToggle();
  };

  return (
    <TooltipProvider>
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl mb-2 overflow-hidden group border border-gray-100 dark:border-gray-700">
        {/* Action bar slides in from the right */}
        <div
          className={`absolute top-0 right-0 h-full flex items-center gap-2 pr-4 transition-all duration-300 z-10 ${isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}
          style={{ height: '100%' }}
        >
          <button
            onClick={handleEditClick}
            className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base font-medium transition"
            aria-label="Edit expense"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 text-base font-medium transition"
            aria-label="Delete expense"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        {/* Main content shifts left when actions are shown */}
        <div
          className={`p-4 flex items-center justify-between cursor-pointer transition-all duration-300 bg-white dark:bg-gray-800 ${isOpen ? '-translate-x-32' : 'translate-x-0'}`}
          onClick={onToggle}
          tabIndex={0}
          aria-label="Show actions"
        >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-full flex items-center justify-center">
              <span className="text-xl">
                {CATEGORY_ICONS[expense.category] || CATEGORY_ICONS['Miscellaneous']}
              </span>
              </div>
              <div>
                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  {expense.description}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{expense.category}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900 dark:text-white">{settings?.base_currency || 'USD'} {formatCompactNumber(expense.amount)}</div>
              {expense.original_amount && expense.original_currency && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-gray-500 dark:text-gray-400 underline cursor-help">
                      {formatCompactNumber(expense.original_amount)} {expense.original_currency}
                      {expense.rate && (
                        <> @ {expense.rate.toFixed(4)}</>
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {expense.rate
                      ? `Conversion rate: 1 ${expense.original_currency} = ${expense.rate.toFixed(4)} ${expense.base_currency}`
                      : 'Original value'}
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="text-xs text-gray-500 dark:text-gray-400">{expense.date || expense.created_at}</div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SwipeableExpenseItem;
