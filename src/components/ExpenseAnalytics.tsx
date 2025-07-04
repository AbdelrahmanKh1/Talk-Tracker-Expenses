import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Calendar } from 'lucide-react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useCurrency } from '@/hooks/useCurrency';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at: string;
}

interface ExpenseAnalyticsProps {
  expenses: Expense[];
  selectedMonth: string;
}

const COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#F97316', '#84CC16',
  '#EC4899', '#6366F1', '#14B8A6', '#F43F5E'
];

export const ExpenseAnalytics = ({ expenses, selectedMonth }: ExpenseAnalyticsProps) => {
  const { settings } = useUserSettings();
  const { currency } = useCurrency();
  
  // Use base currency from user settings, fallback to active currency
  const displayCurrency = settings?.base_currency || currency.code;
  const displaySymbol = settings?.base_currency ? 
    useCurrency().currencies.find(c => c.code === settings.base_currency)?.symbol || currency.symbol :
    currency.symbol;

  const analytics = useMemo(() => {
    if (!expenses.length) return null;

    // Category breakdown
    const categoryData = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryChartData = Object.entries(categoryData)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Daily spending trend - improved date handling
    const dailyData = expenses.reduce((acc, expense) => {
      try {
        // Try to use the date field first, fallback to created_at
        const dateStr = expense.date || expense.created_at;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const dayOfMonth = date.getDate();
          acc[dayOfMonth] = (acc[dayOfMonth] || 0) + expense.amount;
        }
      } catch (error) {
        console.warn('Invalid date format for expense:', expense);
      }
      return acc;
    }, {} as Record<number, number>);

    const dailyChartData = Array.from({ length: 31 }, (_, i) => ({
      day: i + 1,
      amount: dailyData[i + 1] || 0
    })).filter(item => item.amount > 0);

    // Weekly spending trend - improved date handling
    const weeklyData = expenses.reduce((acc, expense) => {
      try {
        // Try to use the date field first, fallback to created_at
        const dateStr = expense.date || expense.created_at;
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const week = Math.ceil(date.getDate() / 7);
          acc[week] = (acc[week] || 0) + expense.amount;
        }
      } catch (error) {
        console.warn('Invalid date format for expense:', expense);
      }
      return acc;
    }, {} as Record<number, number>);

    const weeklyChartData = Array.from({ length: 5 }, (_, i) => ({
      week: `Week ${i + 1}`,
      amount: weeklyData[i + 1] || 0
    }));

    // Spending patterns - improved calculations
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const currentDay = new Date().getDate();
    const averagePerDay = currentDay > 0 ? totalSpent / currentDay : 0;
    
    const dailyValues = Object.values(dailyData).filter(v => v > 0);
    const highestDay = dailyValues.length > 0 ? Math.max(...dailyValues) : 0;
    const lowestDay = dailyValues.length > 0 ? Math.min(...dailyValues) : 0;

    return {
      categoryData: categoryChartData,
      dailyData: dailyChartData,
      weeklyData: weeklyChartData,
      totalSpent,
      averagePerDay,
      highestDay,
      lowestDay
    };
  }, [expenses]);

  if (!analytics) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No data to analyze</h4>
          <p className="text-gray-500 dark:text-gray-400">Add some expenses to see detailed analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 [&_.recharts-cartesian-axis-tick-text]:fill-gray-700 dark:[&_.recharts-cartesian-axis-tick-text]:fill-gray-300 [&_.recharts-legend-item-text]:fill-gray-700 dark:[&_.recharts-legend-item-text]:fill-gray-300 [&_.recharts-tooltip-wrapper]:bg-white dark:[&_.recharts-tooltip-wrapper]:bg-gray-800 [&_.recharts-tooltip-wrapper]:border-gray-200 dark:[&_.recharts-tooltip-wrapper]:border-gray-600 [&_.recharts-cartesian-grid-line]:stroke-gray-200 dark:[&_.recharts-cartesian-grid-line]:stroke-gray-600">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Spending Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Insights for {selectedMonth}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-900/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-200">
            {displaySymbol} {analytics.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-900/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Daily Avg</span>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-200">
            {displaySymbol} {analytics.averagePerDay.toFixed(0)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/40 dark:to-orange-900/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Highest Day</span>
          </div>
          <p className="text-2xl font-bold text-orange-900 dark:text-orange-200">
            {displaySymbol} {analytics.highestDay.toLocaleString()}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/40 dark:to-purple-900/10 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <PieChartIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Categories</span>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-200">
            {analytics.categoryData.length}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-indigo-500" />
            Category Breakdown
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {analytics.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${displaySymbol} ${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => `Category: ${label}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Spending Trend */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Daily Spending Trend
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}`}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${displaySymbol}${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${displaySymbol} ${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => `Day ${label}`}
                />
                <Bar 
                  dataKey="amount" 
                  fill="#10B981" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Spending Trend */}
        <div className="space-y-4 lg:col-span-2">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Weekly Spending Trend
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${displaySymbol}${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${displaySymbol} ${value.toLocaleString()}`, 'Amount']}
                  labelFormatter={(label) => label}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}; 