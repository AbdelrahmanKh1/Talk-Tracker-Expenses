import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useTheme } from '@/hooks/useTheme';
import { useBudget } from '@/hooks/useBudget';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Crown, 
  Mail, 
  Settings as SettingsIcon, 
  Mic, 
  Shield, 
  Globe, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  User,
  Zap,
  Star,
  CheckCircle,
  ExternalLink,
  Edit,
  Save,
  X,
  Moon,
  Sun,
  Monitor,
  Wallet
} from 'lucide-react';
import ConnectWalletModal from '@/components/ConnectWalletModal';
import { useWallets } from '@/hooks/useWallets';
import PlaidLink from '@/components/PlaidLink';
import { syncWalletTransactions, renameWallet, getWalletMonthlyTotals, getWalletTransactionsForReview, saveWalletExpenses, addTestWallet } from '@/services/walletService';
import { WalletProviderLogo } from '@/components/WalletProviderLogo';
import { WalletTransactionReviewModal } from '@/components/WalletTransactionReviewModal';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { CurrencySelector } from '@/components/CurrencySelector';



const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateUserSettings, isUpdating, getUserName } = useUserSettings();
  const { theme, setTheme } = useTheme();
  const { budgetStatus, setBudget, isSettingBudget, getCurrentMonth } = useBudget();
  const { 
    wallets, 
    isLoading: isLoadingWallets,
    isConnecting,
    linkToken,
    error: walletsError, 
    connectWallet, 
    disconnectWallet,
    exchangePublicToken,
    fetchWallets
  } = useWallets();
  const [currentBudget, setCurrentBudget] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const [renamingWalletId, setRenamingWalletId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [syncingWalletId, setSyncingWalletId] = useState<string | null>(null);
  const [walletTotals, setWalletTotals] = useState<Record<string, number>>({});
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewTransactions, setReviewTransactions] = useState<any[]>([]);
  const [reviewWalletId, setReviewWalletId] = useState<string | null>(null);
  const [showBaseCurrencyConfirm, setShowBaseCurrencyConfirm] = useState(false);
  const [pendingBaseCurrency, setPendingBaseCurrency] = useState<string | null>(null);

  // Update local state when budget status changes
  useEffect(() => {
    if (budgetStatus) {
      setCurrentBudget(budgetStatus.budget);
    }
  }, [budgetStatus]);

  // Initialize name value when settings load
  useEffect(() => {
    if (settings?.full_name) {
      setNameValue(settings.full_name);
    }
  }, [settings?.full_name]);

  // Fetch monthly totals per wallet (real)
  useEffect(() => {
    const fetchTotals = async () => {
      if (wallets.length > 0) {
        // Use the current month in YYYY-MM format
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { data, error } = await getWalletMonthlyTotals(month);
        if (!error && data) setWalletTotals(data);
      }
    };
    fetchTotals();
  }, [wallets]);

  // Save budget
  const handleSaveBudget = async (newBudget: number) => {
    const month = getCurrentMonth();
    setBudget({ month, budgetAmount: newBudget });
  };

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut();
      navigate('/auth');
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // For now, just show an alert
      alert('Account deletion feature coming soon. Please contact support for now.');
    }
  };

  const handleEditName = () => {
    setIsEditingName(true);
    setNameValue(settings?.full_name || '');
  };

  const handleSaveName = async () => {
    if (!nameValue.trim() || nameValue.trim().length < 2) {
      toast.error('Please enter a valid name (minimum 2 characters)');
      return;
    }

    await updateUserSettings({ full_name: nameValue.trim() });
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNameValue(settings?.full_name || '');
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRenameWallet = async (walletId: string, newName: string) => {
    try {
      const { error } = await renameWallet(walletId, newName);
      if (error) throw error;
      toast.success('Wallet renamed!');
      setRenamingWalletId(null);
      fetchWallets();
    } catch (e) {
      toast.error('Failed to rename wallet.');
    }
  };

  const handleSyncWallet = async (walletId: string, providerItemId: string) => {
    setSyncingWalletId(walletId);
    try {
      const { data, error } = await syncWalletTransactions(providerItemId);
      if (error) throw error;
      toast.success(`Wallet synced: ${data.added} new, ${data.modified} updated, ${data.removed} removed.`);
      // Fetch transactions for review
      const review = await getWalletTransactionsForReview(walletId);
      if (review.data && review.data.length > 0) {
        setReviewTransactions(review.data.map(tx => ({ ...tx, wallet_id: walletId })));
        setReviewWalletId(walletId);
        setReviewModalOpen(true);
      }
    } catch (e) {
      toast.error('Failed to sync wallet.');
    } finally {
      setSyncingWalletId(null);
    }
  };

  const handleSaveReviewedExpenses = async (edited: any[]) => {
    try {
      const { error } = await saveWalletExpenses(edited);
      if (error) throw error;
      toast.success('Expenses saved!');
      setReviewModalOpen(false);
      setReviewTransactions([]);
      setReviewWalletId(null);
      fetchWallets();
    } catch (e) {
      toast.error('Failed to save expenses.');
    }
  };

  const handleAddTestWallet = async () => {
    try {
      const { data, error } = await addTestWallet();
      if (error) throw error;
      toast.success('Test wallet added!');
      fetchWallets();
    } catch (e) {
      toast.error('Failed to add test wallet.');
    }
  };

  function formatLastSync(ts?: string | null) {
    if (!ts) return 'Never';
    const date = new Date(ts);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return date.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 dark:bg-gray-900/80 dark:border-gray-800 px-4 py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Pro Upgrade Banner */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">Upgrade to Pro</h2>
                <p className="text-purple-100">Unlimited expenses, advanced features & more</p>
              </div>
            </div>
            <Button className="bg-white text-purple-600 hover:bg-gray-100 rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              <Zap className="w-4 h-4 mr-2" />
              Go Pro
            </Button>
          </div>
        </div>

        {/* User Profile Section */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">{getUserInitials()}</span>
            </div>
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    placeholder="Enter your name"
                    className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveName}
                    disabled={isUpdating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{getUserName()}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleEditName}
                    className="p-1 h-auto dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
              {/* Base Currency Section */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Base Currency</label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your main currency for all calculations</p>
                  </div>
                </div>
                
                <CurrencySelector
                  value={settings?.base_currency || ''}
                  onChange={(currencyCode) => {
                    setPendingBaseCurrency(currencyCode);
                    setShowBaseCurrencyConfirm(true);
                  }}
                  placeholder="Select your base currency"
                  className="mb-3"
                />
                
                <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  <p className="mb-2">
                    <strong>What is a base currency?</strong> This is your main currency for all dashboard totals, budgets, and calculations. 
                    All expenses in other currencies will be converted to this currency for display.
                  </p>
                  <p>
                    <strong>Note:</strong> Changing your base currency will affect all future conversions and dashboard calculations. 
                    Historical data will remain in their original currencies.
                  </p>
                </div>

                {/* Confirmation Dialog */}
                {showBaseCurrencyConfirm && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                          Change Base Currency?
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                          Are you sure you want to change your base currency to{' '}
                          <span className="font-bold">{pendingBaseCurrency}</span>? 
                          This will affect all future conversions and dashboard calculations.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => {
                              if (pendingBaseCurrency) {
                                updateUserSettings({ base_currency: pendingBaseCurrency });
                                toast.success(`Base currency changed to ${pendingBaseCurrency}`);
                              }
                              setShowBaseCurrencyConfirm(false);
                              setPendingBaseCurrency(null);
                            }}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Yes, Change
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setShowBaseCurrencyConfirm(false);
                              setPendingBaseCurrency(null);
                            }}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Wallet & Connections Section */}
        <TooltipProvider>
          <div>
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wide flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Wallet & Connections
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
              {isLoadingWallets ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-4 border-gray-200 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
              ) : walletsError ? (
                <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                  <p>Error loading wallets. Please try again later.</p>
                </div>
              ) : wallets.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl flex items-center justify-center mb-4">
                      <Wallet className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h4 className="font-bold text-gray-800 dark:text-white">No Wallets Connected</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Link your bank account to automatically import transactions.</p>
                    <PlaidLink token={linkToken} onLinkSuccess={exchangePublicToken}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={() => !linkToken && connectWallet()}
                            disabled={isConnecting}
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            {isConnecting && !linkToken ? 'Preparing...' : 'Connect a New Wallet'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Connect a new wallet. You must give consent and can disconnect at any time.</TooltipContent>
                      </Tooltip>
                    </PlaidLink>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end mb-2">
                    <Button size="sm" variant="outline" onClick={handleAddTestWallet}>
                      Add Test Wallet (Demo)
                    </Button>
                  </div>
                  {wallets.map((wallet) => (
                    <div key={wallet.id} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-4">
                        <WalletProviderLogo provider={wallet.provider} className="w-10 h-10 rounded-xl flex items-center justify-center" />
                        <div>
                          {renamingWalletId === wallet.id ? (
                            <div className="flex gap-2 items-center">
                              <input
                                value={renameValue}
                                onChange={e => setRenameValue(e.target.value)}
                                className="px-2 py-1 rounded border border-gray-300 dark:bg-gray-800 dark:text-white"
                                autoFocus
                              />
                              <Button size="sm" onClick={() => handleRenameWallet(wallet.id, renameValue)}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => setRenamingWalletId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex gap-2 items-center">
                              <span className="font-semibold text-gray-900 dark:text-white">{wallet.wallet_name || 'Linked Account'}</span>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => { setRenamingWalletId(wallet.id); setRenameValue(wallet.wallet_name || ''); }}>Rename</Button>
                                </TooltipTrigger>
                                <TooltipContent>Rename this wallet for easier identification.</TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 dark:text-gray-400">Provider: {wallet.provider}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Last Sync: {formatLastSync(wallet.last_synced_at)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Monthly Total: <span className="font-bold">${walletTotals[wallet.id] || 0}</span></div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSyncWallet(wallet.id, wallet.provider_item_id)}
                              disabled={syncingWalletId === wallet.id}
                            >
                              {syncingWalletId === wallet.id ? 'Syncing...' : 'Sync Now'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Sync this wallet to fetch the latest transactions.</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => disconnectWallet(wallet.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Disconnect
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Disconnect and delete all data for this wallet. This cannot be undone.</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  ))}
                  <PlaidLink token={linkToken} onLinkSuccess={exchangePublicToken}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => !linkToken && connectWallet()}
                          disabled={isConnecting}
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          {isConnecting && !linkToken ? 'Preparing...' : 'Connect Another Wallet'}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Connect another wallet. You can manage multiple accounts.</TooltipContent>
                    </Tooltip>
                  </PlaidLink>
                </div>
              )}
            </div>
          </div>
        </TooltipProvider>

        {/* Theme Section */}
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wide flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Appearance
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                    <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 dark:text-white">Theme</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose your preferred theme</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('light')}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('dark')}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTheme('system')}
                    className="dark:border-gray-600 dark:text-gray-300"
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Section */}
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wide flex items-center gap-2">
            <User className="w-4 h-4" />
            Account
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 dark:text-gray-400">Email</div>
                <div className="font-semibold text-gray-900 dark:text-white">{user?.email || 'khaledabdelrahman334@gmail.com'}</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                  <Crown className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Plan</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Free Plan</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current</span>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Mic className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span className="font-semibold text-gray-900 dark:text-white">Voice Records Left</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly allowance</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-600 dark:text-green-400">49</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">/ 50</p>
              </div>
            </div>
          </div>
        </div>

        {/* About App Section */}
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wide flex items-center gap-2">
            <Globe className="w-4 h-4" />
            About App
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
            {/* Privacy Policy */}
            <button
              className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => {
                window.open('https://www.sayapp.net/privacy', '_blank');
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Privacy Policy</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Visit Website */}
            <button
              className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => {
                window.open('https://www.sayapp.net', '_blank');
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Visit Website</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>

            {/* FAQs */}
            <button
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              onClick={() => {
                window.open('https://www.sayapp.net/#faq', '_blank');
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">FAQs</span>
              </div>
              <ExternalLink className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </button>
          </div>
        </div>

        {/* Actions Section */}
        <div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wide flex items-center gap-2">
            <SettingsIcon className="w-4 h-4" />
            Actions
          </h3>
          
          <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">Sign Out</span>
            </button>

            <button 
              onClick={handleDeleteAccount}
              className="w-full flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="font-semibold text-red-600 dark:text-red-400">Delete Account</span>
            </button>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 dark:text-gray-500">Version 1.0.0</p>
        </div>
      </div>

      <ConnectWalletModal
        isOpen={isConnectWalletModalOpen}
        onClose={() => setIsConnectWalletModalOpen(false)}
        onConnect={async () => {
          setIsConnectWalletModalOpen(false);
          await connectWallet();
        }}
        isLoading={isConnecting}
      />

      <WalletTransactionReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        transactions={reviewTransactions}
        onSave={handleSaveReviewedExpenses}
      />
    </div>
  );
};

export default Settings;
