import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Globe, TrendingUp, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useBudget } from '@/hooks/useBudget';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Currency {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const Currency = () => {
  const navigate = useNavigate();
  const { currency, currencies, setCurrency, testDatabaseConnection } = useCurrency();
  const { budgetStatus, isLoading: isBudgetLoading } = useBudget();
  const { user } = useAuth();
  const [selectedCurrency, setSelectedCurrency] = useState(currency.code);
  const [isUpdating, setIsUpdating] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Update local state when currency hook changes
  useEffect(() => {
    setSelectedCurrency(currency.code);
  }, [currency.code]);

  // Filter currencies based on search term
  const filteredCurrencies = currencies.filter(curr =>
    curr.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curr.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    curr.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTestDatabase = async () => {
    try {
      const result = await testDatabaseConnection();
      setDbTestResult(result ? 'Database connection successful' : 'Database connection failed');
    } catch (error) {
      setDbTestResult(`Database test error: ${error.message}`);
    }
  };

  const handleCurrencySelect = async (newCurrency: Currency) => {
    // Don't allow multiple updates at once
    if (isUpdating) return;
    
    // Update local selection immediately for UI feedback
    setSelectedCurrency(newCurrency.code);
    setIsUpdating(true);
    
    try {
      // Update the currency in the database
      await setCurrency(newCurrency.code);
      
      // Show success message
      toast.success(`Currency changed to ${newCurrency.name}`);
      
      // Navigate back after a short delay to show the selection
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    } catch (error) {
      // Revert local selection on error
      setSelectedCurrency(currency.code);
      toast.error('Failed to update currency. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getBudgetStatus = () => {
    if (!budgetStatus) return null;
    
    const percent = budgetStatus.percent;
    if (percent >= 100) return { status: 'Over Budget', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', icon: <AlertTriangle className="w-4 h-4" /> };
    if (percent >= 80) return { status: 'Warning', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30', icon: <AlertTriangle className="w-4 h-4" /> };
    return { status: 'On Track', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', icon: <CheckCircle className="w-4 h-4" /> };
  };

  const budgetStatusInfo = getBudgetStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-700 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Currency</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred currency</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-3xl p-6 border border-blue-100 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Currency Settings</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Select your preferred currency for displaying expenses and budgets. This will be used throughout the app.
          </p>
        </div>

        {/* Budget Information */}
        {budgetStatus && budgetStatus.budget > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Budget</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currency.flag}</span>
                <span className="font-semibold text-gray-700 dark:text-gray-300">{currency.code}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-600 dark:text-gray-400 text-lg">{currency.symbol}</span>
                <span className="text-4xl font-black text-gray-900 dark:text-white">
                  {isBudgetLoading ? '...' : budgetStatus.budget.toLocaleString()}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Spent</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {currency.symbol}{budgetStatus.spent.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Remaining</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {currency.symbol}{budgetStatus.remaining.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{budgetStatus.percent.toFixed(1)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${
                      budgetStatus.percent >= 100 ? 'bg-gradient-to-r from-red-400 to-red-500' :
                      budgetStatus.percent >= 80 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' : 
                      'bg-gradient-to-r from-green-400 to-green-500'
                    }`}
                    style={{ width: `${Math.min(budgetStatus.percent, 100)}%` }}
                  />
                </div>
                {budgetStatusInfo && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${budgetStatusInfo.bg}`}>
                    <div className={budgetStatusInfo.color}>
                      {budgetStatusInfo.icon}
                    </div>
                    <span className={`font-semibold ${budgetStatusInfo.color}`}>
                      {budgetStatusInfo.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Currency Selection */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Available Currencies</h3>
          
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search currencies by name, code, or symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 text-base border-2 border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {searchTerm && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Found {filteredCurrencies.length} currency{filteredCurrencies.length !== 1 ? 'ies' : 'y'}
              </p>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCurrencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => handleCurrencySelect(curr)}
                disabled={isUpdating}
                className={`relative p-4 rounded-2xl border-2 transition-all duration-200 text-left group ${
                  selectedCurrency === curr.code 
                    ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 shadow-lg scale-105' 
                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-green-300 dark:hover:border-green-500 hover:bg-green-50/50 dark:hover:bg-green-900/20 hover:scale-102'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{curr.flag}</span>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{curr.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{curr.code}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{curr.symbol}</span>
                    {selectedCurrency === curr.code && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        {isUpdating ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Hover Effect */}
                {!selectedCurrency === curr.code && (
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">ℹ️</span>
            </div>
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Currency Conversion</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Changing your currency will update the display format. For accurate conversions, 
                consider updating your expense amounts manually if needed.
              </p>
            </div>
          </div>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-gray-600 dark:text-gray-400 text-sm">🐛</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Debug Info</h4>
                <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1">
                  <p>User ID: {user?.id || 'Not authenticated'}</p>
                  <p>Current Currency: {currency.code}</p>
                  <p>Selected Currency: {selectedCurrency}</p>
                  <p>Is Updating: {isUpdating ? 'Yes' : 'No'}</p>
                  <p>User Email: {user?.email || 'N/A'}</p>
                  {dbTestResult && <p>DB Test: {dbTestResult}</p>}
                </div>
                <button
                  onClick={handleTestDatabase}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                >
                  Test Database Connection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Currency;
