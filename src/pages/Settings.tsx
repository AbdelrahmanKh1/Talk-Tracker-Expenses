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
  Monitor
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateUserSettings, isUpdating, getUserName } = useUserSettings();
  const { theme, setTheme } = useTheme();
  const { budgetStatus, setBudget, isSettingBudget, getCurrentMonth } = useBudget();
  const [currentBudget, setCurrentBudget] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

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
            </div>
          </div>
        </div>

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
    </div>
  );
};

export default Settings;
