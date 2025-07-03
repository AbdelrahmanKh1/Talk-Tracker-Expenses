import React from 'react';
import { 
  Plus, 
  Mic, 
  Target, 
  BarChart3, 
  Settings, 
  Download, 
  Share2, 
  Calendar,
  TrendingUp,
  Wallet
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface QuickActionsProps {
  onAddExpense: () => void;
  onVoiceInput: () => void;
  onSetBudget: () => void;
  onViewAnalytics: () => void;
  onConnectWallet: () => void;
  onOpenSettings: () => void;
  onExportData: () => void;
  onShareReport: () => void;
}

export const QuickActions = ({
  onAddExpense,
  onVoiceInput,
  onSetBudget,
  onViewAnalytics,
  onConnectWallet,
  onOpenSettings,
  onExportData,
  onShareReport
}: QuickActionsProps) => {
  const actions: QuickAction[] = [
    {
      id: 'add-expense',
      title: 'Add Expense',
      description: 'Quickly add a new expense',
      icon: <Plus className="w-5 h-5" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50',
      onClick: onAddExpense
    },
    {
      id: 'connect-wallet',
      title: 'Connect Wallet',
      description: 'Link your bank account',
      icon: <Wallet className="w-5 h-5" />,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:hover:bg-cyan-900/50',
      onClick: onConnectWallet
    },
    {
      id: 'voice-input',
      title: 'Voice Input',
      description: 'Add expenses by speaking',
      icon: <Mic className="w-5 h-5" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50',
      onClick: onVoiceInput
    },
    {
      id: 'set-budget',
      title: 'Set Budget',
      description: 'Update your monthly budget',
      icon: <Target className="w-5 h-5" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/30 dark:hover:bg-purple-900/50',
      onClick: onSetBudget
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Detailed spending insights',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50',
      onClick: onViewAnalytics
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download your expense data',
      icon: <Download className="w-5 h-5" />,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/30 dark:hover:bg-orange-900/50',
      onClick: onExportData
    },
    {
      id: 'share',
      title: 'Share Report',
      description: 'Share your financial summary',
      icon: <Share2 className="w-5 h-5" />,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/30 dark:hover:bg-teal-900/50',
      onClick: onShareReport
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
      {/* Compact Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
          <Wallet className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Quick Actions</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Common tasks</p>
        </div>
      </div>

      {/* Compact Actions Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`p-3 rounded-lg border border-gray-100 dark:border-gray-700 transition-all duration-200 ${action.bgColor} dark:hover:bg-gray-700 hover:shadow-md hover:scale-105 group`}
          >
            <div className="flex flex-col items-center text-center space-y-1">
              <div className={`p-2 rounded-lg ${action.bgColor} ${action.color} group-hover:scale-110 transition-transform duration-200 dark:bg-gray-700 dark:text-white`}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-xs">{action.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Compact Settings Link */}
      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={onOpenSettings}
          className="w-full flex items-center justify-center gap-2 p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          <Settings className="w-3 h-3" />
          <span className="text-xs font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}; 