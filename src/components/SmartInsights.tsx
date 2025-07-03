import React, { useMemo } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Calendar,
  DollarSign,
  Zap
} from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatCompactNumber } from '@/lib/utils';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface SmartInsightsProps {
  expenses: Expense[];
  budget: number;
  spent: number;
  selectedMonth: string;
}

interface Insight {
  type: 'positive' | 'warning' | 'info' | 'achievement';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

export const SmartInsights = ({ expenses, budget, spent, selectedMonth }: SmartInsightsProps) => {
  const { settings } = useUserSettings();

  const insights = useMemo(() => {
    const insightsList: Insight[] = [];
    
    if (!expenses.length) {
      return [{
        type: 'info',
        title: 'Start Tracking',
        description: 'Begin your financial journey by adding your first expense. We\'ll help you understand your spending patterns.',
        icon: <Target className="w-5 h-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30'
      }];
    }

    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const averagePerDay = totalSpent / new Date().getDate();
    const remainingDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate();
    const projectedSpending = averagePerDay * remainingDays;
    const projectedTotal = totalSpent + projectedSpending;
    
    // Budget insights
    const budgetPercentage = (spent / budget) * 100;
    const remainingBudget = budget - spent;
    
    if (budgetPercentage >= 100) {
      insightsList.push({
        type: 'warning',
        title: 'Over Budget',
        description: `You've exceeded your budget by ${settings?.base_currency || 'USD'} ${formatCompactNumber(spent - budget)}`,
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/30'
      });
    } else if (budgetPercentage >= 80) {
      insightsList.push({
        type: 'warning',
        title: 'Budget Warning',
        description: `You've used ${budgetPercentage.toFixed(1)}% of your budget. Only ${settings?.base_currency || 'USD'} ${formatCompactNumber(remainingBudget)} remaining.`,
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-orange-600 dark:text-orange-400',
        bgColor: 'bg-orange-50 dark:bg-orange-900/30'
      });
    } else if (budgetPercentage <= 50) {
      insightsList.push({
        type: 'positive',
        title: 'Great Progress',
        description: `You're only ${budgetPercentage.toFixed(1)}% through your budget. You're on track for a great month!`,
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30'
      });
    }

    // Spending pattern insights
    const categorySpending = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categorySpending)
      .sort(([,a], [,b]) => b - a)[0];

    if (topCategory) {
      const [category, amount] = topCategory;
      const categoryPercentage = (amount / totalSpent) * 100;
      
      if (categoryPercentage > 50) {
        insightsList.push({
          type: 'warning',
          title: 'High Category Concentration',
          description: `${category} accounts for ${categoryPercentage.toFixed(1)}% of your spending. Consider diversifying your expenses.`,
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-50 dark:bg-orange-900/30'
        });
      }
    }

    // Daily spending insights
    const dailySpending = expenses.reduce((acc, expense) => {
      const date = new Date(expense.date).getDate();
      acc[date] = (acc[date] || 0) + expense.amount;
      return acc;
    }, {} as Record<number, number>);

    const highestDay = Math.max(...Object.values(dailySpending));
    const averageDaily = totalSpent / Object.keys(dailySpending).length;
    
    if (highestDay > averageDaily * 2) {
      insightsList.push({
        type: 'info',
        title: 'High Spending Day Detected',
        description: `Your highest spending day was ${highestDay.toLocaleString()} ${settings?.base_currency || 'USD'}, ${(highestDay / averageDaily).toFixed(1)}x your average.`,
        icon: <Calendar className="w-5 h-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30'
      });
    }

    // Projection insights
    if (projectedTotal > budget) {
      insightsList.push({
        type: 'warning',
        title: 'Projected Over Budget',
        description: `At current pace, you'll spend ${settings?.base_currency || 'USD'} ${formatCompactNumber(projectedTotal)} this month, exceeding your budget by ${formatCompactNumber(projectedTotal - budget)}`,
        icon: <TrendingUp className="w-5 h-5" />,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-900/30'
      });
    } else if (projectedTotal < budget * 0.8) {
      insightsList.push({
        type: 'positive',
        title: 'Under Budget Projection',
        description: `Great! You're projected to stay under budget by ${formatCompactNumber(budget - projectedTotal)}`,
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-50 dark:bg-green-900/30'
      });
    }

    // Savings opportunity
    if (averagePerDay > 0) {
      const potentialSavings = averagePerDay * 0.1; // 10% reduction
      insightsList.push({
        type: 'info',
        title: 'Savings Opportunity',
        description: `Reducing daily spending by 10% could save you ${settings?.base_currency || 'USD'} ${formatCompactNumber(potentialSavings)} per day, or ${settings?.base_currency || 'USD'} ${formatCompactNumber(potentialSavings * 30)} per month.`,
        icon: <DollarSign className="w-5 h-5" />,
        color: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-50 dark:bg-blue-900/30'
      });
    }

    // Achievement insights
    if (expenses.length >= 10) {
      insightsList.push({
        type: 'achievement',
        title: 'Consistent Tracking',
        description: `You've tracked ${expenses.length} expenses this month. Great job staying on top of your finances!`,
        icon: <Zap className="w-5 h-5" />,
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-50 dark:bg-purple-900/30'
      });
    }

    return insightsList.slice(0, 4); // Limit to 4 insights
  }, [expenses, budget, spent, settings?.base_currency]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center">
          <Lightbulb className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Insights</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered financial recommendations</p>
        </div>
      </div>

      {/* Insights List */}
      <div className="space-y-4">
        {insights.map((insight, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-4 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 ${insight.bgColor} dark:bg-opacity-60`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${insight.bgColor} ${insight.color} dark:bg-gray-900 dark:text-white`}>
              {insight.icon}
            </div>
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{insight.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Insights update based on your spending patterns and budget goals
        </p>
      </div>
    </div>
  );
}; 