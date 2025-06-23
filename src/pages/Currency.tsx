
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

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
  const { currency, updateCurrency } = useCurrency();
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code);

  // Update local state when currency hook changes
  useEffect(() => {
    setSelectedCurrency(currency.code);
  }, [currency.code]);

  const handleCurrencySelect = (newCurrency: Currency) => {
    // Update local selection immediately for UI feedback
    setSelectedCurrency(newCurrency.code);
    
    // Update the currency in the hook and localStorage
    updateCurrency(newCurrency);
    
    // Show success message
    toast.success(`Currency changed to ${newCurrency.name}`);
    
    // Navigate back after a short delay to show the selection
    setTimeout(() => {
      navigate('/dashboard');
    }, 500);
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
        <div className="mb-4">
          <p className="text-gray-600">Select a different currency for your expenses</p>
        </div>
        
        <div className="space-y-2">
          {currencies.map((curr) => (
            <button
              key={curr.code}
              onClick={() => handleCurrencySelect(curr)}
              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-colors ${
                selectedCurrency === curr.code 
                  ? 'bg-teal-50 border-2 border-teal-200' 
                  : 'bg-white hover:bg-gray-50 border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{curr.flag}</span>
                <div className="text-left">
                  <div className="font-medium">{curr.name}</div>
                  <div className="text-sm text-gray-500">{curr.code}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600 font-medium">{curr.symbol}</span>
                {selectedCurrency === curr.code && (
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
