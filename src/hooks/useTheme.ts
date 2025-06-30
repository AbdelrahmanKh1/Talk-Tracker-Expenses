import { useState, useEffect } from 'react';
import { useUserSettings } from './useUserSettings';

export type Theme = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const { settings, updateUserSettings } = useUserSettings();
  const [currentTheme, setCurrentTheme] = useState<Theme>('system');
  const [isDark, setIsDark] = useState(false);

  // Initialize theme from user settings or system preference
  useEffect(() => {
    const savedTheme = settings?.theme as Theme || 'system';
    setCurrentTheme(savedTheme);
    
    const applyTheme = (theme: Theme) => {
      const isDarkMode = theme === 'dark' || 
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      setIsDark(isDarkMode);
      document.documentElement.classList.toggle('dark', isDarkMode);
    };

    applyTheme(savedTheme);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (savedTheme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings?.theme]);

  const setTheme = async (theme: Theme) => {
    setCurrentTheme(theme);
    await updateUserSettings({ theme });
  };

  return {
    theme: currentTheme,
    isDark,
    setTheme,
  };
}; 