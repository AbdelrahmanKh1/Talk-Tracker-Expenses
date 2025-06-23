
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
  symbol: 'ج.م',
  flag: '🇪🇬'
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>(defaultCurrency);

  useEffect(() => {
    const stored = localStorage.getItem('selectedCurrency');
    if (stored) {
      try {
        const parsedCurrency = JSON.parse(stored);
        // Validate the stored currency has all required fields
        if (parsedCurrency.code && parsedCurrency.name && parsedCurrency.symbol && parsedCurrency.flag) {
          setCurrency(parsedCurrency);
        } else {
          // If stored currency is invalid, reset to default
          localStorage.setItem('selectedCurrency', JSON.stringify(defaultCurrency));
        }
      } catch (error) {
        console.error('Error parsing stored currency:', error);
        // Reset to default if parsing fails
        localStorage.setItem('selectedCurrency', JSON.stringify(defaultCurrency));
      }
    }
  }, []);

  const updateCurrency = (newCurrency: Currency) => {
    // Validate the new currency has all required fields
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol || !newCurrency.flag) {
      console.error('Invalid currency object:', newCurrency);
      return;
    }

    // Update state immediately
    setCurrency(newCurrency);
    
    // Store in localStorage
    try {
      localStorage.setItem('selectedCurrency', JSON.stringify(newCurrency));
      console.log('Currency updated and saved:', newCurrency);
    } catch (error) {
      console.error('Error saving currency to localStorage:', error);
    }
  };

  return {
    currency,
    updateCurrency
  };
};
