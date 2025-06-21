
import { useState, useEffect } from 'react';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const defaultCurrency: Currency = {
  code: 'EGP',
  name: 'Egyptian Pound',
  symbol: 'EGP',
  flag: '🇪🇬'
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  useEffect(() => {
    const stored = localStorage.getItem('selectedCurrency');
    if (stored) {
      try {
        const parsedCurrency = JSON.parse(stored);
        setCurrency(parsedCurrency);
      } catch (error) {
        console.error('Error parsing stored currency:', error);
      }
    }
  }, []);

  const updateCurrency = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    localStorage.setItem('selectedCurrency', JSON.stringify(newCurrency));
  };

  return {
    currency,
    updateCurrency
  };
};
