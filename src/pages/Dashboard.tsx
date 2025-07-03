import React, { useState, useEffect } from 'react';
import { useExpenses } from '@/hooks/useExpenses';
import { useBudget } from '@/hooks/useBudget';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import DashboardHeader from '@/components/DashboardHeader';
import ExpenseSummary from '@/components/ExpenseSummary';
import MonthSelector from '@/components/MonthSelector';
import RecentExpensesList from '@/components/RecentExpensesList';
import VoiceInputFab from '@/components/VoiceInputFab';
import DashboardModals from '@/components/DashboardModals';
import { AIVoiceModal } from '@/components/AIVoiceModal';
import { BudgetSummary } from '@/components/BudgetSummary';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Loader2, TrendingUp, TrendingDown, DollarSign, Search, Lightbulb, X } from 'lucide-react';
import { ExpenseAnalytics } from '@/components/ExpenseAnalytics';
import { SmartInsights } from '@/components/SmartInsights';
import { QuickActions } from '@/components/QuickActions';
import { EnhancedStatsCards } from '@/components/EnhancedStatsCards';
import { SearchBar } from '@/components/SearchBar';
import { Expense, SearchFilters } from '@/types';
import SetBudgetModal from '@/components/SetBudgetModal';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { Button } from '@/components/ui/button';
import { formatCompactNumber } from '@/lib/utils';
// import { PWAInstallPrompt, FloatingInstallButton } from '@/components/PWAInstallPrompt';

type ExpenseSourceFilter = 'wallet' | 'manual' | 'voice';

const Dashboard = () => {
  const { session } = useAuth();
  const { settings } = useUserSettings();
  const { 
    expenses, 
    isLoading, 
    addExpense, 
    isAddingExpense, 
    addBulkExpenses, 
    isAddingBulkExpenses, 
    updateExpense,
    isUpdatingExpense,
    deleteExpense,
    getMonthlyTotal, 
    getExpensesForMonth,
    getRecentExpenses,
    error: expensesError,
    searchExpenses,
    invalidateQueries
  } = useExpenses();
  
  // Initialize with current month
  const getCurrentMonthDisplay = (): string => {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    const year = now.getFullYear();
    return `${monthName} ${year}`;
  };
  
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthDisplay());
  
  const {
    budgetStatus,
    isLoading: isBudgetLoading,
    setBudget,
    isSettingBudget,
    getCurrentMonth,
    refreshAllBudgets,
    prefetchBudgetData
  } = useBudget(selectedMonth);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showSmartInsights, setShowSmartInsights] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [sourceFilter, setSourceFilter] = useState<ExpenseSourceFilter | undefined>(undefined);

  // Search handler
  const handleSearch = (term: string, filters: SearchFilters): void => {
    setSearchTerm(term);
    setSearchFilters(filters);
    const results = searchExpenses(term, selectedMonth, filters);
    setFilteredExpenses(results);
  };

  // Get expenses for current month or search results
  const getCurrentExpenses = (): Expense[] => {
    if (searchTerm || Object.keys(searchFilters).length > 0) {
      return filteredExpenses;
    }
    return getExpensesForMonth(selectedMonth, sourceFilter);
  };

  const handleExpenseEdit = (expense: Expense): void => {
    setSelectedExpense(expense);
    setIsEditModalOpen(true);
  };

  const handleExpenseDelete = async (expenseId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteExpense(expenseId);
    }
  };

  const handleUpdateExpense = (expenseId: string, items: { description: string; amount: number; category: string; date?: string }[]): void => {
    updateExpense({ expenseId, items });
    setIsEditModalOpen(false);
    setSelectedExpense(null);
  };

  const handleAddExpense = (data: { description: string; amount: number; category?: string }): void => {
    addExpense({ ...data, selectedMonth });
  };

  const monthlyTotal = getMonthlyTotal(selectedMonth);
  const monthExpenses = getCurrentExpenses();

  // Handler to update budget
  const handleSetBudget = async (budgetAmount: number): Promise<void> => {
    // Convert selectedMonth from "Jun 2025" format to "2025-06" format
    const [monthName, year] = selectedMonth.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthName);
    const targetYear = parseInt(year);
    
    if (monthIndex === -1) {
      toast.error('Invalid month format');
      return;
    }
    
    const month = `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}`;
    
    await setBudget({ 
      month, 
      budgetAmount, 
      budgetCurrency: budgetStatus?.currency || settings?.base_currency || 'USD'
    });
    
    // Refresh all budget data to ensure consistency across all months
    await refreshAllBudgets();
    
    // Close the modal after successful save
    setIsSetBudgetModalOpen(false);
  };

  // Quick action handlers
  const handleExportData = (): void => {
    if (!monthExpenses || monthExpenses.length === 0) {
      toast.error('No expenses to export for this month');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Description,Amount,Category\n"
      + monthExpenses.map(exp => 
          `${exp.date || exp.created_at},${exp.description},${exp.amount},${exp.category || 'Other'}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Expense data exported successfully!');
  };

  const handleConnectWallet = () => {
    // For now, this will just open the modal.
    // Later, it will initiate the wallet connection flow.
    console.log('Connect wallet clicked');
    setIsConnectWalletModalOpen(true);
  };

  const handleOpenSettings = (): void => {
    // Navigate to settings page
    window.location.href = '/settings';
  };

  const [isSetBudgetModalOpen, setIsSetBudgetModalOpen] = useState(false);

  // Handler to open the SetBudgetModal
  const openSetBudgetModal = () => setIsSetBudgetModalOpen(true);

  // Handler for budget updates from BudgetSummary component
  const handleBudgetUpdate = async (newBudget: number): Promise<void> => {
    await handleSetBudget(newBudget);
  };

  // Refresh budget data when month changes
  useEffect(() => {
    if (selectedMonth) {
      // Debounce the refresh to prevent excessive calls when switching months quickly
      const timer = setTimeout(() => {
        refreshAllBudgets();
      }, 300); // Increased delay for better debouncing
      
      return () => clearTimeout(timer);
    }
  }, [selectedMonth, refreshAllBudgets]);

  // Prefetch budget data for the last 12 months on component mount
  useEffect(() => {
    const generateLast12Months = () => {
      const months = [];
      const currentDate = new Date();
      
      for (let i = 0; i < 12; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
      }
      
      return months;
    };

    const last12Months = generateLast12Months();
    prefetchBudgetData(last12Months);
  }, [prefetchBudgetData]);

  // Convert selectedMonth to the format expected by the AI agent
  const getSelectedMonthForAI = (): string => {
    const [monthName, year] = selectedMonth.split(' ');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.indexOf(monthName);
    const targetYear = parseInt(year);
    
    if (monthIndex === -1) {
      return new Date().toISOString().slice(0, 7); // Current month as fallback
    }
    
    return `${targetYear}-${String(monthIndex + 1).padStart(2, '0')}`;
  };

  const quickActions = {
    onAddExpense: () => setIsAddModalOpen(true),
    onVoiceInput: () => setIsVoiceModalOpen(true),
    onSetBudget: openSetBudgetModal,
    onViewAnalytics: () => setShowAnalytics(!showAnalytics),
    onConnectWallet: handleConnectWallet,
    onShareReport: handleExportData, // Changed to export data for now
    onExportData: handleExportData,
    onOpenSettings: handleOpenSettings
  };

  // Loading state with better design
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-teal-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-teal-500" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Loading your finances...</h3>
            <p className="text-sm text-gray-500">Preparing your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (expensesError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700">Unable to load expenses</h3>
            <p className="text-sm text-gray-500">There was an error loading your financial data. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Enhanced Stats Cards */}
        <EnhancedStatsCards
          expenses={expenses}
          budget={budgetStatus?.budget || 0}
          spent={monthlyTotal}
          selectedMonth={selectedMonth}
        />

        {/* Quick Actions */}
        <QuickActions {...quickActions} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Budget Summary - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <BudgetSummary
              spent={monthlyTotal}
              budget={budgetStatus?.budget || 0}
              percent={budgetStatus?.budget ? (monthlyTotal / budgetStatus.budget) * 100 : 0}
              remaining={Math.max((budgetStatus?.budget || 0) - monthlyTotal, 0)}
              onEditBudget={handleBudgetUpdate}
              monthlyTotal={monthlyTotal}
              selectedMonth={selectedMonth}
            />
          </div>

          {/* Month Selector and Expenses - 2/3 on desktop */}
          <div className="lg:col-span-2 space-y-6">
            <MonthSelector 
              selectedMonth={selectedMonth}
              onMonthSelect={setSelectedMonth}
            />

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center">
                  <Search className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Search</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Find expenses quickly</p>
                </div>
              </div>
              <SearchBar 
                onSearch={handleSearch}
                placeholder="Search by description, category, amount, or date..."
                className="w-full"
              />
              {(searchTerm || Object.keys(searchFilters).length > 0) && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Found {monthExpenses.length} expense{monthExpenses.length !== 1 ? 's' : ''} 
                    {searchTerm && ` matching "${searchTerm}"`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-6 mb-4">
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Recent Transactions</h2>
                <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <Button variant={!sourceFilter ? 'primary' : 'ghost'} size="sm" onClick={() => setSourceFilter(undefined)}>All</Button>
                    <Button variant={sourceFilter === 'wallet' ? 'primary' : 'ghost'} size="sm" onClick={() => setSourceFilter('wallet')}>Wallet</Button>
                    <Button variant={sourceFilter === 'manual' ? 'primary' : 'ghost'} size="sm" onClick={() => setSourceFilter('manual')}>Manual</Button>
                    <Button variant={sourceFilter === 'voice' ? 'primary' : 'ghost'} size="sm" onClick={() => setSourceFilter('voice')}>Voice</Button>
                </div>
            </div>

            <div className="relative">
              <RecentExpensesList
                expenses={monthExpenses}
                onAddExpense={() => setIsAddModalOpen(true)}
                onEditExpense={handleExpenseEdit}
                onDeleteExpense={handleExpenseDelete}
                isSearchResults={searchTerm.length > 0 || Object.keys(searchFilters).length > 0}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </div>

        {/* Smart Insights */}
        <SmartInsights
          expenses={monthExpenses || []}
          budget={budgetStatus?.budget || 0}
          spent={monthlyTotal}
          selectedMonth={selectedMonth}
        />

        {/* Analytics Section - Conditionally shown */}
        {showAnalytics && (
          <ExpenseAnalytics
            expenses={monthExpenses || []}
            selectedMonth={selectedMonth}
          />
        )}
      </div>

      {/* Analytics and Smart Insights Buttons */}
      <div className="flex gap-2 justify-end mb-4">
        <Button variant="secondary" onClick={() => setShowAnalytics(true)}>
          <TrendingUp className="mr-2" /> View Analytics
        </Button>
        <Button variant="secondary" onClick={() => setShowSmartInsights(true)}>
          <Lightbulb className="mr-2" /> Smart Insights
        </Button>
      </div>
      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 max-w-lg sm:max-w-2xl w-11/12 sm:w-full relative">
            <button
              onClick={() => setShowAnalytics(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              aria-label="Close Analytics Modal"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="overflow-y-auto max-h-[80vh]">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">Spending Analytics</h2>
              <ExpenseAnalytics
                expenses={monthExpenses}
                selectedMonth={selectedMonth}
              />
            </div>
            <Button variant="ghost" onClick={() => setShowAnalytics(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}
      {/* Smart Insights Modal */}
      {showSmartInsights && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4 sm:p-6 max-w-lg sm:max-w-2xl w-11/12 sm:w-full relative">
            <button
              onClick={() => setShowSmartInsights(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              aria-label="Close Smart Insights Modal"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="overflow-y-auto max-h-[80vh]">
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100 text-center">Smart Insights</h2>
              <SmartInsights
                expenses={monthExpenses}
                budget={budgetStatus?.budget || 0}
                spent={monthlyTotal}
                selectedMonth={selectedMonth}
              />
            </div>
            <Button variant="ghost" onClick={() => setShowSmartInsights(false)} className="mt-4 w-full">
              Close
            </Button>
          </div>
        </div>
      )}

      <VoiceInputFab onVoiceClick={() => setIsVoiceModalOpen(true)} />

      <DashboardModals
        isAddModalOpen={isAddModalOpen}
        onAddModalClose={() => setIsAddModalOpen(false)}
        onAddExpense={handleAddExpense}
        isAddingExpense={isAddingExpense}
        selectedMonth={selectedMonth}
        
        isEditModalOpen={isEditModalOpen}
        onEditModalClose={() => {
          setIsEditModalOpen(false);
          setSelectedExpense(null);
        }}
        selectedExpense={selectedExpense}
        onUpdateExpense={handleUpdateExpense}
        isUpdatingExpense={isUpdatingExpense}
      />

      {/* SetBudgetModal - single instance, controlled by isSetBudgetModalOpen */}
      <SetBudgetModal
        isOpen={isSetBudgetModalOpen}
        onClose={() => setIsSetBudgetModalOpen(false)}
        onSave={handleSetBudget}
        initialBudget={budgetStatus?.budget || 0}
        month={selectedMonth}
        monthlyTotal={monthlyTotal}
      />

      {/* AI Voice Modal */}
      <AIVoiceModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        selectedMonth={getSelectedMonthForAI()}
      />

      <ConnectWalletModal
        isOpen={isConnectWalletModalOpen}
        onClose={() => setIsConnectWalletModalOpen(false)}
        onConnect={() => {
          // Here you would initiate the Plaid link flow, for example
          console.log('Connecting to wallet provider...');
          setIsConnectWalletModalOpen(false);
          toast.success('Wallet connection flow initiated (simulation).');
        }}
        isLoading={false} // This will be managed by the wallet connection hook later
      />

      {/* PWA Install Components */}
      {/* <PWAInstallPrompt />
      <FloatingInstallButton /> */}
    </div>
  );
};

export default Dashboard;
