
import React from 'react';
import { Button } from '@/components/ui/button';
import { useExpenses } from '@/hooks/useExpenses';
import { useCurrency } from '@/hooks/useCurrency';

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
        active: selectedMonth === monthYear
      });
    }
    
    return months;
  };

  const months = generateMonths();

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-6 h-6 bg-teal-500 rounded flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="white" strokeWidth="2"/>
            <line x1="16" y1="2" x2="16" y2="6" stroke="white" strokeWidth="2"/>
            <line x1="8" y1="2" x2="8" y2="6" stroke="white" strokeWidth="2"/>
            <line x1="3" y1="10" x2="21" y2="10" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold">Select Month</h3>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {months.map((month, index) => (
          <Button
            key={index}
            variant={month.active ? "default" : "outline"}
            className={`flex-shrink-0 rounded-2xl px-3 py-4 min-w-[85px] h-auto ${
              month.active 
                ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onMonthSelect(month.monthYear)}
          >
            <div className="text-center flex flex-col items-center">
              <div className="font-medium text-sm">{month.label}</div>
              <div className="text-xs opacity-75 mb-1">{month.year}</div>
              <div className={`text-xs font-bold ${
                month.active ? "text-white" : "text-teal-600"
              }`}>
                {month.total > 0 ? `${currency.symbol}${month.total.toFixed(0)}` : `${currency.symbol}0`}
              </div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MonthSelector;
