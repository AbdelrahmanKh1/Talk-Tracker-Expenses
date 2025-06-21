
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';

interface CurrencyPlanInfoProps {
  expenseCount: number;
}

const CurrencyPlanInfo = ({ expenseCount }: CurrencyPlanInfoProps) => {
  const navigate = useNavigate();
  const { currency } = useCurrency();

  return (
    <div className="px-4 py-2 bg-white border-b">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <button 
          onClick={() => navigate('/currency')}
          className="flex items-center gap-1 hover:bg-gray-100 px-2 py-1 rounded"
        >
          <span className="text-lg">{currency.flag}</span>
          <span>{currency.code}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <span>FREE</span>
        <div className="flex items-center gap-1">
          <span>{expenseCount}/50</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default CurrencyPlanInfo;
