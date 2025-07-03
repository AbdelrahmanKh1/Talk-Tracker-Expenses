import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';
import { currencyOptions } from '@/lib/currencies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CurrencySelectorProps {
  value: string;
  onChange: (currencyCode: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  onChange,
  placeholder = "Select currency",
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCurrency = currencyOptions.find(opt => opt.code === value);
  
  const filteredCurrencies = currencyOptions.filter(currency =>
    currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    currency.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        type="button"
        variant="outline"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full justify-between h-12 text-left font-normal border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
      >
        <div className="flex items-center gap-3">
          {selectedCurrency ? (
            <>
              <span className="text-lg">{selectedCurrency.flag}</span>
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900 dark:text-white">
                  {selectedCurrency.code}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedCurrency.name}
                </span>
              </div>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search currencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-200 dark:border-gray-600 focus:border-teal-500 focus:ring-teal-500/20 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
            </div>
          </div>

          {/* Currency List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredCurrencies.length > 0 ? (
              filteredCurrencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleSelect(currency.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150 flex items-center justify-between ${
                    value === currency.code ? 'bg-teal-50 dark:bg-teal-900/20 border-r-2 border-teal-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex flex-col items-start">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {currency.code}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {currency.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {currency.symbol}
                    </span>
                    {value === currency.code && (
                      <Check className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                No currencies found matching "{searchTerm}"
              </div>
            )}
          </div>

          {/* Popular Currencies Section */}
          {!searchTerm && (
            <div className="border-t border-gray-100 dark:border-gray-700 p-3">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
                Popular Currencies
              </div>
              <div className="flex flex-wrap gap-2">
                {['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'].map((code) => {
                  const currency = currencyOptions.find(opt => opt.code === code);
                  if (!currency) return null;
                  
                  return (
                    <button
                      key={code}
                      onClick={() => handleSelect(code)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-150 flex items-center gap-1 ${
                        value === code
                          ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <span>{currency.flag}</span>
                      <span>{code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 