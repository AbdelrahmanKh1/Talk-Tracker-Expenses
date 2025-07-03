import { useUserSettings } from '@/hooks/useUserSettings';
import { getExchangeRate } from '@/lib/exchangeRate';
import { useState, useEffect } from 'react';

interface ExpenseSummaryProps {
  monthlyTotal: number;
  selectedMonth: string;
}

const ExpenseSummary = ({ monthlyTotal, selectedMonth }: ExpenseSummaryProps) => {
  const { settings } = useUserSettings();
  const [preferredTotal, setPreferredTotal] = useState<number | null>(null);

  useEffect(() => {
    if (
      settings?.preferred_currency &&
      settings?.base_currency &&
      settings.preferred_currency !== settings.base_currency
    ) {
      getExchangeRate(settings.base_currency, settings.preferred_currency)
        .then(rate => {
          if (rate) {
            setPreferredTotal(monthlyTotal * rate);
          } else {
            setPreferredTotal(null);
          }
        });
    } else {
      setPreferredTotal(null);
    }
  }, [settings, monthlyTotal]);

  // Extract month and year from the selectedMonth string
  const [monthName, year] = selectedMonth.split(' ');

  return (
    <div className="bg-white rounded-2xl p-6">
      <h2 className="text-gray-800 mb-2 text-3xl font-extrabold tracking-tight">{monthName} {year}</h2>
      <div className="text-2xl font-bold">
        {monthlyTotal} {settings?.base_currency}
        {preferredTotal && (
          <span className="ml-2 text-gray-500">
            (~{preferredTotal.toFixed(2)} {settings?.preferred_currency})
          </span>
        )}
      </div>
    </div>
  );
};

export default ExpenseSummary;
