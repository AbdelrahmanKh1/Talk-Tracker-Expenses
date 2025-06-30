import React, { useState } from 'react';
import { Pencil, Target, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import SetBudgetModal from './SetBudgetModal';

export const BudgetSummary = ({
  spent,
  budget,
  percent,
  remaining,
  onEditBudget,
  monthlyTotal,
  selectedMonth
}: {
  spent: number,
  budget: number,
  percent: number,
  remaining: number,
  onEditBudget: (newBudget: number) => Promise<void>,
  monthlyTotal: number,
  selectedMonth: string
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { currency } = useCurrency();

  let status = 'On Track', statusColor = 'text-green-600 dark:text-green-400', statusIcon = <CheckCircle className="w-4 h-4" />;
  if (percent >= 100) { 
    status = 'Over Budget'; 
    statusColor = 'text-red-600 dark:text-red-400'; 
    statusIcon = <AlertTriangle className="w-4 h-4" />;
  }
  else if (percent >= 80) { 
    status = 'Warning'; 
    statusColor = 'text-orange-500 dark:text-orange-400'; 
    statusIcon = <AlertTriangle className="w-4 h-4" />;
  }

  let barColor = 'bg-gradient-to-r from-green-400 to-green-500';
  if (percent >= 100) barColor = 'bg-gradient-to-r from-red-400 to-red-500';
  else if (percent >= 80) barColor = 'bg-gradient-to-r from-orange-400 to-orange-500';

  // Extract month and year from selectedMonth string
  const [monthName, year] = selectedMonth.split(' ');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Budget Overview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{selectedMonth}</p>
          </div>
        </div>
        <button
          className="p-2 hover:bg-purple-50 dark:hover:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl transition-colors duration-200"
          onClick={() => setIsModalOpen(true)}
          aria-label="Edit budget"
        >
          <Pencil className="w-5 h-5" />
        </button>
      </div>

      {/* Main Amount Display */}
      <div className="mb-6">
        <div className="flex items-end gap-2 mb-2">
          <span className="text-gray-600 dark:text-gray-400 text-2xl font-medium">{currency.symbol}</span>
          <span className="text-6xl font-black text-gray-900 dark:text-white leading-none">{monthlyTotal.toLocaleString()}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Total spent this month</p>
      </div>

      {/* Budget Progress */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Budget Progress</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{currency.symbol}{budget.toLocaleString()}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{percent.toFixed(1)}%</span>
        </div>
        
        <div className="relative">
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-700 ease-out ${barColor} shadow-sm`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          {/* Progress markers */}
          <div className="absolute top-0 left-0 w-full h-3 flex justify-between items-center px-1">
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Status and Remaining */}
      <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${statusColor.replace('text-', 'bg-').replace('-600', '-100').replace('-500', '-100').replace('dark:text-green-400', 'dark:bg-green-900/30').replace('dark:text-red-400', 'dark:bg-red-900/30').replace('dark:text-orange-400', 'dark:bg-orange-900/30')}`}>
              {statusIcon}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</p>
              <p className={`font-bold ${statusColor}`}>{status}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</p>
              <p className="font-bold text-green-600 dark:text-green-400">{currency.symbol}{remaining.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <SetBudgetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={async (newBudget) => { 
          try {
            await onEditBudget(newBudget);
            setIsModalOpen(false); // Close modal after successful save
          } catch (error) {
            // Keep modal open if there's an error
            console.error('Error updating budget:', error);
          }
        }}
        initialBudget={budget}
        month={monthName}
        monthlyTotal={monthlyTotal}
      />
    </div>
  );
}; 