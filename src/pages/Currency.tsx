
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const currencies: Currency[] = [
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م', flag: '🇪🇬' },
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', flag: '🇸🇦' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', flag: '🇶🇦' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', flag: '🇰🇼' },
];

const Currency = () => {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState('EGP');

  const handleCurrencySelect = (currency: Currency) => {
    setSelectedCurrency(currency.code);
    // Store selected currency in localStorage
    localStorage.setItem('selectedCurrency', JSON.stringify(currency));
    // Navigate back after a short delay
    setTimeout(() => {
      navigate('/dashboard');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center gap-3 border-b">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-semibold">Currency</h1>
      </div>

      <div className="px-4 py-6">
        <div className="space-y-2">
          {currencies.map((currency) => (
            <button
              key={currency.code}
              onClick={() => handleCurrencySelect(currency)}
              className="w-full flex items-center justify-between p-4 bg-white rounded-2xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currency.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{currency.name}</div>
                  <div className="text-sm text-gray-500">{currency.code}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">{currency.symbol}</span>
                {selectedCurrency === currency.code && (
                  <Check className="w-5 h-5 text-teal-500" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Currency;
