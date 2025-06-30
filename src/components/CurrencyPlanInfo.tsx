import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '@/hooks/useCurrency';
import { Globe, Crown, Zap, ChevronDown } from 'lucide-react';

interface CurrencyPlanInfoProps {
  expenseCount: number;
}

const CurrencyPlanInfo = ({ expenseCount }: CurrencyPlanInfoProps) => {
  const navigate = useNavigate();
  const { currency } = useCurrency();

  const planLimit = 50;
  const usagePercentage = (expenseCount / planLimit) * 100;
  const isNearLimit = usagePercentage >= 80;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Currency Selector */}
          <button 
            onClick={() => navigate('/currency')}
            className="flex items-center gap-2 hover:bg-white/50 dark:hover:bg-gray-800/50 px-3 py-2 rounded-xl transition-all duration-200 group self-start sm:self-auto"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">{currency.flag}</span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{currency.code}</span>
              <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
            </div>
          </button>

          {/* Plan Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            {/* Plan Badge */}
            <div className="flex items-center gap-2 bg-white/70 dark:bg-gray-800/70 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-700">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">FREE PLAN</span>
            </div>

            {/* Usage Progress */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  {expenseCount}/{planLimit} expenses
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Monthly limit</p>
              </div>
              
              <div className="relative">
                <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-white/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                  <div 
                    className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                      isNearLimit ? 'bg-red-400' : 'bg-green-400'
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
                {isNearLimit && (
                  <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
              </div>
            </div>

            {/* Upgrade Button */}
            <button 
              onClick={() => navigate('/currency')}
              className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-medium text-xs sm:text-sm shadow-lg hover:shadow-xl self-start sm:self-auto"
            >
              <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
              Upgrade
            </button>
          </div>
        </div>

        {/* Usage Warning */}
        {isNearLimit && (
          <div className="mt-3 p-2 sm:p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></div>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 font-medium">
                You're approaching your monthly limit! Consider upgrading for unlimited expenses.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrencyPlanInfo;
