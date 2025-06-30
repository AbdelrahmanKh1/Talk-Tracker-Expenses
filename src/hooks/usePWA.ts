import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAServiceWorker {
  waiting: ServiceWorker | null;
  active: ServiceWorker | null;
  installing: ServiceWorker | null;
}

export const usePWA = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);

  // Check if app is installed
  useEffect(() => {
    try {
      const checkInstallation = () => {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isInApp = (window.navigator as any).standalone === true;
        setIsInstalled(isStandalone || isInApp);
      };

      checkInstallation();
      window.addEventListener('appinstalled', checkInstallation);
      return () => window.removeEventListener('appinstalled', checkInstallation);
    } catch (error) {
      console.warn('PWA installation check failed:', error);
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    try {
      const handleOnline = () => {
        setIsOnline(true);
        toast.success('You are back online!');
      };

      const handleOffline = () => {
        setIsOnline(false);
        toast.error('You are offline. Some features may be limited.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    } catch (error) {
      console.warn('PWA online/offline monitoring failed:', error);
    }
  }, []);

  // Handle install prompt
  useEffect(() => {
    try {
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPrompt(e as PWAInstallPrompt);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    } catch (error) {
      console.warn('PWA install prompt handling failed:', error);
    }
  }, []);

  // Register service worker
  useEffect(() => {
    const registerServiceWorker = async () => {
      try {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          setSwRegistration(registration);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                  toast.info('A new version is available! Refresh to update.');
                }
              });
            }
          });

          // Handle service worker updates
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            setIsUpdateAvailable(false);
            toast.success('App updated successfully!');
          });

        }
      } catch (error) {
        console.warn('Service Worker registration failed:', error);
        // Don't throw error, just log it
      }
    };

    registerServiceWorker();
  }, []);

  // Install PWA
  const installPWA = useCallback(async () => {
    if (!installPrompt) {
      toast.error('Install prompt not available');
      return;
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success('App installed successfully!');
        setIsInstalled(true);
      } else {
        toast.info('Installation cancelled');
      }
      
      setInstallPrompt(null);
    } catch (error) {
      console.error('Installation failed:', error);
      toast.error('Installation failed');
    }
  }, [installPrompt]);

  // Update PWA
  const updatePWA = useCallback(() => {
    if (swRegistration?.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [swRegistration]);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (swRegistration) {
      try {
        await swRegistration.update();
        toast.info('Checking for updates...');
      } catch (error) {
        console.error('Update check failed:', error);
        toast.error('Failed to check for updates');
      }
    }
  }, [swRegistration]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    try {
      if (!('Notification' in window)) {
        toast.error('Notifications not supported');
        return false;
      }

      if (Notification.permission === 'granted') {
        return true;
      }

      if (Notification.permission === 'denied') {
        toast.error('Please enable notifications in your browser settings');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        return true;
      } else {
        toast.info('Notifications permission denied');
        return false;
      }
    } catch (error) {
      console.error('Notification permission request failed:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    try {
      if (Notification.permission === 'granted') {
        new Notification('Talk Tracker Expense', {
          body: 'This is a test notification from your expense tracker!',
          icon: '/favicon.svg',
          badge: '/favicon.svg'
        });
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  }, []);

  // Get PWA status
  const getPWAStatus = useCallback(() => {
    return {
      isOnline,
      isInstalled,
      canInstall: !!installPrompt,
      isUpdateAvailable,
      hasServiceWorker: !!swRegistration,
      notificationPermission: Notification.permission
    };
  }, [isOnline, isInstalled, installPrompt, isUpdateAvailable, swRegistration]);

  return {
    // State
    isOnline,
    isInstalled,
    canInstall: !!installPrompt,
    isUpdateAvailable,
    hasServiceWorker: !!swRegistration,
    notificationPermission: Notification.permission,

    // Actions
    installPWA,
    updatePWA,
    checkForUpdates,
    requestNotificationPermission,
    sendTestNotification,
    getPWAStatus
  };
}; 