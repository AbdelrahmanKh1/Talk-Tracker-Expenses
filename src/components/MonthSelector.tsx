
import React from 'react';
import { Button } from '@/components/ui/button';

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthSelect: (month: string) => void;
}

const MonthSelector = ({ selectedMonth, onMonthSelect }: MonthSelectorProps) => {
  const months = [
    { label: 'Jun', year: '2025', active: selectedMonth === 'Jun 2025' },
    { label: 'May', year: '2025', active: selectedMonth === 'May 2025' },
    { label: 'Apr', year: '2025', active: selectedMonth === 'Apr 2025' },
    { label: 'Mar', year: '2025', active: selectedMonth === 'Mar 2025' },
  ];

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
      
      <div className="flex gap-3 overflow-x-auto pb-2">
        {months.map((month, index) => (
          <Button
            key={index}
            variant={month.active ? "default" : "outline"}
            className={`flex-shrink-0 rounded-2xl px-6 py-3 ${
              month.active 
                ? "bg-teal-500 hover:bg-teal-600 text-white" 
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
            }`}
            onClick={() => onMonthSelect(`${month.label} ${month.year}`)}
          >
            <div className="text-center">
              <div className="font-medium">{month.label}</div>
              <div className="text-sm opacity-80">{month.year}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default MonthSelector;
