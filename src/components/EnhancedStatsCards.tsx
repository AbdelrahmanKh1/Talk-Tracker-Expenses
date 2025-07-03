import React from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useUserSettings } from '@/hooks/useUserSettings';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Calendar, Target, AlertTriangle, CheckCircle, Clock, BarChart3 } from 'lucide-react';
import { formatCompactNumber } from '@/lib/utils';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface EnhancedStatsCardsProps {
  expenses: Expense[];
  budget: number;
  spent: number;
  selectedMonth: string;
}

export const EnhancedStatsCards = ({ 
  expenses, 
  budget, 
  spent, 
  selectedMonth 
}: EnhancedStatsCardsProps) => {
  const { settings } = useUserSettings();
  const { getMonthlyTotal, getExpensesForMonth } = useExpenses();

  const stats = React.useMemo(() => {
    const totalExpenses = expenses.length;
    const monthExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      const expMonth = expDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return expMonth === selectedMonth;
    });

    const totalSpent = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averagePerDay = totalSpent / new Date().getDate();
    const budgetPercentage = budget > 0 ? (spent / budget) * 100 : 0;
    const remainingBudget = budget - spent;
    
    // Calculate spending trend (compare to previous period)
    const currentDay = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - currentDay;
    const projectedSpending = averagePerDay * remainingDays;
    const projectedTotal = totalSpent + projectedSpending;

    // Category breakdown for top category
    const categorySpending = monthExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalExpenses,
      monthExpenses: monthExpenses.length,
      totalSpent,
      averagePerDay,
      budgetPercentage,
      remainingBudget,
      projectedTotal,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      isOverBudget: spent > budget,
      isNearBudget: budgetPercentage >= 80 && budgetPercentage < 100,
      isOnTrack: budgetPercentage <= 50
    };
  }, [expenses, budget, spent, selectedMonth]);

  const cards = [
    {
      title: 'Total Spent',
      value: `${settings?.base_currency || 'USD'} ${formatCompactNumber(stats.totalSpent)}`,
      subtitle: `${stats.monthExpenses} expenses this month`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      trend: stats.averagePerDay > 0 ? `${settings?.base_currency || 'USD'} ${stats.averagePerDay.toFixed(0)}/day` : 'No spending yet'
    },
    {
      title: 'Budget Status',
      value: `${stats.budgetPercentage.toFixed(1)}%`,
      subtitle: stats.isOverBudget 
        ? `Over by ${settings?.base_currency || 'USD'} ${formatCompactNumber(spent - budget)}`
        : `${settings?.base_currency || 'USD'} ${formatCompactNumber(stats.remainingBudget)} remaining`,
      icon: stats.isOverBudget ? <AlertTriangle className="w-6 h-6" /> : 
            stats.isNearBudget ? <AlertTriangle className="w-6 h-6" /> : 
            <CheckCircle className="w-6 h-6" />,
      color: stats.isOverBudget ? 'red' : stats.isNearBudget ? 'orange' : 'green',
      gradient: stats.isOverBudget ? 'from-red-500 to-red-600' : 
                stats.isNearBudget ? 'from-orange-500 to-orange-600' : 
                'from-green-500 to-green-600',
      bgGradient: stats.isOverBudget ? 'from-red-50 to-red-100' : 
                  stats.isNearBudget ? 'from-orange-50 to-orange-100' : 
                  'from-green-50 to-green-100',
      trend: stats.isOverBudget ? 'Exceeded budget' : 
             stats.isNearBudget ? 'Approaching limit' : 
             'On track'
    },
    {
      title: 'Projected Total',
      value: `${settings?.base_currency || 'USD'} ${formatCompactNumber(stats.projectedTotal)}`,
      subtitle: `Based on current pace`,
      icon: <TrendingUp className="w-6 h-6" />,
      color: stats.projectedTotal > budget ? 'red' : 'green',
      gradient: stats.projectedTotal > budget ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600',
      bgGradient: stats.projectedTotal > budget ? 'from-red-50 to-red-100' : 'from-green-50 to-green-100',
      trend: stats.projectedTotal > budget ? 
        `Will exceed by ${settings?.base_currency || 'USD'} ${(stats.projectedTotal - budget).toLocaleString()}` : 
        `Will save ${settings?.base_currency || 'USD'} ${(budget - stats.projectedTotal).toLocaleString()}`
    },
    {
      title: 'Top Category',
      value: stats.topCategory ? stats.topCategory.name : 'None',
      subtitle: stats.topCategory ? 
        `${settings?.base_currency || 'USD'} ${formatCompactNumber(stats.topCategory.amount)}` : 
        'No expenses yet',
      icon: <BarChart3 className="w-6 h-6" />,
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      trend: stats.topCategory ? 
        `${((stats.topCategory.amount / stats.totalSpent) * 100).toFixed(1)}% of spending` : 
        'Add expenses to see'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card, index) => (
        <div 
          key={index}
          className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between mb-3">
            <div className={`w-8 h-8 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center text-white shadow-md`}>
              {card.icon}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium
              ${card.color === 'red' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' :
                card.color === 'orange' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' :
                card.color === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' :
                'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}
            `}>
              {card.trend}
            </div>
          </div>

          {/* Compact Content */}
          <div className="space-y-1">
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.title}</h3>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.subtitle}</p>
          </div>

          {/* Progress Bar for Budget Status */}
          {card.title === 'Budget Status' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full transition-all duration-500 ease-out
                    ${stats.isOverBudget ? 'bg-red-500' :
                      stats.isNearBudget ? 'bg-orange-500' :
                      'bg-green-500'}
                  `}
                  style={{ width: `${Math.min(stats.budgetPercentage, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 