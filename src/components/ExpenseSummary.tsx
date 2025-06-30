import React from 'react';
import { useCurrency } from '@/hooks/useCurrency';

interface ExpenseSummaryProps {
  monthlyTotal: number;
  selectedMonth: string;
}

const ExpenseSummary = ({ monthlyTotal, selectedMonth }: ExpenseSummaryProps) => {
  const { currency } = useCurrency();

  // Extract month and year from the selectedMonth string
  const [monthName, year] = selectedMonth.split(' ');

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-gray-800 mb-2 text-3xl font-extrabold tracking-tight">{monthName} {year}</h2>
    </div>
  );
};

export default ExpenseSummary;
