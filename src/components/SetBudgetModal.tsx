import React, { useState, useEffect, useRef } from 'react';
import { Target, TrendingUp, X, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface SetBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: number) => Promise<void>;
  initialBudget: number;
  month: string;
  monthlyTotal: number;
}

const SetBudgetModal: React.FC<SetBudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialBudget,
  month,
  monthlyTotal,
}) => {
  const [budget, setBudget] = useState(initialBudget.toString());
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { currency } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      setBudget(initialBudget.toString());
      setIsSaving(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialBudget]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const value = parseFloat(budget);
    if (!isNaN(value) && value >= 0) {
      setIsSaving(true);
      try {
        await onSave(value);
        // Modal will be closed by the parent component after successful save
      } catch (error) {
        console.error('Error saving budget:', error);
        // Keep modal open if there's an error
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSaving) {
      handleSave();
    }
  };

  const getBudgetStatus = () => {
    const budgetValue = parseFloat(budget) || 0;
    const spending = monthlyTotal;
    const percentage = budgetValue > 0 ? (spending / budgetValue) * 100 : 0;
    
    if (percentage >= 90) return { status: 'danger', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' };
    if (percentage >= 75) return { status: 'warning', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/30' };
    return { status: 'safe', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30' };
  };

  const budgetStatus = getBudgetStatus();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col mx-4 sm:mx-0 animate-in zoom-in-95 duration-300 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Monthly Budget</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Plan your spending for {month}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Current Spending Info */}
        {monthlyTotal > 0 && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Spending</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {currency.symbol} {monthlyTotal.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  budgetStatus.status === 'danger' ? 'bg-red-500' :
                  budgetStatus.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((monthlyTotal / (parseFloat(budget) || 1)) * 100, 100)}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Budget Input */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Monthly Budget Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 font-medium text-lg">
                {currency.symbol}
              </span>
              <input
                ref={inputRef}
                type="number"
                min="0"
                step="0.01"
                className="w-full h-14 text-2xl font-semibold pl-16 pr-4 border-2 border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500/20 rounded-2xl transition-all duration-200 dark:bg-gray-700 dark:text-white"
                value={budget}
                onChange={e => setBudget(e.target.value.replace(/[^\d.]/g, ''))}
                placeholder={monthlyTotal ? monthlyTotal.toString() : '0'}
                aria-label="Monthly budget amount"
                onKeyDown={handleKeyPress}
              />
            </div>
          </div>

          {/* Quick Budget Suggestions */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Quick Suggestions</label>
            <div className="flex gap-2 flex-wrap">
              {[1000, 2000, 5000, 10000].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setBudget(suggestion.toString())}
                  className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 rounded-xl transition-all duration-200"
                >
                  {currency.symbol} {suggestion.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Insights */}
        {parseFloat(budget) > 0 && monthlyTotal > 0 && (
          <div className={`mb-6 p-4 rounded-2xl ${budgetStatus.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-4 h-4 ${budgetStatus.color}`} />
              <span className={`text-sm font-medium ${budgetStatus.color}`}>
                Budget Status
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Spent:</span>
                <span className="font-medium text-gray-900 dark:text-white">{currency.symbol} {monthlyTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {currency.symbol} {Math.max(parseFloat(budget) - monthlyTotal, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Percentage:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.min((monthlyTotal / parseFloat(budget)) * 100, 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-4 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onClose}
            type="button"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            onClick={handleSave}
            type="button"
            disabled={budget === '' || isNaN(Number(budget)) || isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Set Budget'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SetBudgetModal; 