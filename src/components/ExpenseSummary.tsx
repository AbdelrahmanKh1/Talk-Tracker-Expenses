
import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface ExpenseSummaryProps {
  monthlyTotal: number;
  selectedMonth: string;
}

const ExpenseSummary = ({ monthlyTotal, selectedMonth }: ExpenseSummaryProps) => {
  const { currency } = useCurrency();

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-gray-600 mb-2">My expenses in {selectedMonth.split(' ')[0]}</h2>
      <div className="flex items-baseline gap-2">
        <span className="text-gray-600">{currency.code}</span>
        <span className="text-5xl font-bold">{monthlyTotal.toFixed(0)}</span>
      </div>
    </div>
  );
};

export default ExpenseSummary;
