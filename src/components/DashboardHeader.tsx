import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User, Bell, Menu, X, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { AppLogo, AppLogoText } from './AppLogo';
import { ThemeToggle } from './ThemeToggle';

type DashboardHeaderProps = {
  onOpenAnalytics?: () => void;
};

const DashboardHeader = (props: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { getUserName } = useUserSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getUserInitials = () => {
    const name = getUserName();
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 dark:bg-gray-900/80 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Logo and greeting */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                <AppLogo className="w-6 h-6 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Talk Tracker Expense</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {getGreeting()}, {getUserName()}!
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={props.onOpenAnalytics}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 dark:hover:bg-gray-800"
              title="Analytics"
            >
              <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200 dark:hover:bg-gray-800"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
