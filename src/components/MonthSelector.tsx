import React from 'react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/hooks/useCurrency';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ selectedMonth, onMonthSelect }: MonthSelectorProps) => {
  const { getMonthlyTotal } = useExpenses();
  const { currency } = useCurrency();

  // Generate last 12 months dynamically
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
      const year = date.getFullYear().toString();
      const monthYear = `${monthName} ${year}`;
      const total = getMonthlyTotal(monthYear);
      
      months.push({
        label: monthName,
        year: year,
        monthYear: monthYear,
        total: total,
        active: selectedMonth === monthYear,
        isCurrentMonth: i === 0
      });
    }
    
    return months;
  };

  const months = generateMonths();

  // Find current month index
  const currentMonthIndex = months.findIndex(month => month.active);

  // Navigation handlers
  const handlePreviousMonth = () => {
    if (currentMonthIndex < months.length - 1) {
      onMonthSelect(months[currentMonthIndex + 1].monthYear);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      onMonthSelect(months[currentMonthIndex - 1].monthYear);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Month</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Select period</p>
          </div>
        </div>
        
        {/* Compact Navigation Controls */}
        <div className="flex items-center gap-1">
          <button 
            className={`p-1.5 rounded-lg transition-colors duration-200 ${
              currentMonthIndex < months.length - 1 
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            onClick={handlePreviousMonth}
            disabled={currentMonthIndex >= months.length - 1}
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          <button 
            className={`p-1.5 rounded-lg transition-colors duration-200 ${
              currentMonthIndex > 0 
                ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300' 
                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            onClick={handleNextMonth}
            disabled={currentMonthIndex <= 0}
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Compact Month Cards - 6 columns on larger screens */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {months.map((month, index) => (
          <button
            key={index}
            className={`relative p-2 rounded-lg border-2 transition-all duration-200 text-left group ${
              month.active 
                ? 'border-indigo-500 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md scale-105' 
                : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20'
            }`}
            onClick={() => onMonthSelect(month.monthYear)}
          >
            {/* Current Month Indicator */}
            {month.isCurrentMonth && (
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
            )}
            
            <div className="space-y-0.5">
              <div className={`font-bold text-xs ${month.active ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {month.label}
              </div>
              <div className={`font-semibold text-xs ${month.active ? 'text-indigo-100' : 'text-gray-600 dark:text-gray-400'}`}>
                {month.year}
              </div>
              <div className={`font-bold text-xs ${month.active ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`}>
                {currency.symbol} {month.total.toLocaleString()}
              </div>
            </div>
            
            {/* Hover Effect */}
            {!month.active && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            )}
          </button>
        ))}
      </div>
      
      {/* Compact Selected Month Info */}
      <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Selected</p>
            <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedMonth}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              {currency.symbol} {getMonthlyTotal(selectedMonth).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthSelector;
