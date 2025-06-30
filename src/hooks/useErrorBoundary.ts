import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  timestamp: number;
  userAgent: string;
  url: string;
  userId?: string;
}

interface ErrorReport {
  error: ErrorInfo;
  context: {
    route: string;
    timestamp: number;
    sessionId: string;
  };
}

class ErrorMonitor {
  private static instance: ErrorMonitor;
  private errors: ErrorReport[] = [];
  private isOnline: boolean = navigator.onLine;
  private sessionId: string = this.generateSessionId();

  static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Report an error
  reportError(error: Error, errorInfo?: { componentStack: string }): void {
    const errorReport: ErrorReport = {
      error: {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
      },
      context: {
        route: window.location.pathname,
        timestamp: Date.now(),
        sessionId: this.sessionId,
      },
    };

    this.errors.push(errorReport);
    this.logError(errorReport);

    // Send to error reporting service in production
    if (import.meta.env.PROD) {
      this.sendErrorReport(errorReport);
    }
  }

  // Log error to console in development
  private logError(errorReport: ErrorReport): void {
    if (import.meta.env.DEV) {
      console.group('🚨 Error Report');
      console.error('Error:', errorReport.error.message);
      console.error('Stack:', errorReport.error.stack);
      console.error('Component Stack:', errorReport.error.componentStack);
      console.error('Context:', errorReport.context);
      console.groupEnd();
    }
  }

  // Send error report to monitoring service
  private async sendErrorReport(errorReport: ErrorReport): Promise<void> {
    if (!this.isOnline) {
      // Store for later when online
      this.storeOfflineError(errorReport);
      return;
    }

    try {
      // In a real app, you'd send to your error monitoring service
      // For now, we'll simulate sending to a monitoring endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (error) {
      console.error('Failed to send error report:', error);
      this.storeOfflineError(errorReport);
    }
  }

  // Store error for offline sending
  private storeOfflineError(errorReport: ErrorReport): void {
    const offlineErrors = JSON.parse(localStorage.getItem('offlineErrors') || '[]');
    offlineErrors.push(errorReport);
    localStorage.setItem('offlineErrors', JSON.stringify(offlineErrors));
  }

  // Send offline errors when back online
  sendOfflineErrors(): void {
    const offlineErrors = JSON.parse(localStorage.getItem('offlineErrors') || '[]');
    if (offlineErrors.length > 0) {
      offlineErrors.forEach((errorReport: ErrorReport) => {
        this.sendErrorReport(errorReport);
      });
      localStorage.removeItem('offlineErrors');
    }
  }

  // Get user ID from auth context
  private getUserId(): string | undefined {
    // This would typically come from your auth context
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return user?.id;
  }

  // Set online status
  setOnlineStatus(isOnline: boolean): void {
    this.isOnline = isOnline;
    if (isOnline) {
      this.sendOfflineErrors();
    }
  }

  // Get error statistics
  getErrorStats(): { total: number; recent: number; critical: number } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    const recent = this.errors.filter(e => e.context.timestamp > oneHourAgo).length;
    const critical = this.errors.filter(e => 
      e.error.message.includes('Critical') || 
      e.error.message.includes('Fatal')
    ).length;

    return {
      total: this.errors.length,
      recent,
      critical,
    };
  }

  // Clear errors (for testing)
  clearErrors(): void {
    this.errors = [];
  }
}

export const useErrorBoundary = () => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const errorMonitor = ErrorMonitor.getInstance();

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => errorMonitor.setOnlineStatus(true);
    const handleOffline = () => errorMonitor.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [errorMonitor]);

  // Report error
  const reportError = useCallback((error: Error, errorInfo?: { componentStack: string }) => {
    setHasError(true);
    setError(error);
    errorMonitor.reportError(error, errorInfo);

    // Show user-friendly error message
    toast.error('Something went wrong. Please try refreshing the page.', {
      duration: 5000,
      action: {
        label: 'Refresh',
        onClick: () => window.location.reload(),
      },
    });
  }, [errorMonitor]);

  // Reset error state
  const resetError = useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return errorMonitor.getErrorStats();
  }, [errorMonitor]);

  return {
    hasError,
    error,
    reportError,
    resetError,
    getErrorStats,
  };
};

// Global error handler
export const setupGlobalErrorHandling = () => {
  const errorMonitor = ErrorMonitor.getInstance();

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(event.reason?.message || 'Unhandled Promise Rejection');
    errorMonitor.reportError(error);
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = new Error(event.message);
    error.stack = event.error?.stack;
    errorMonitor.reportError(error);
  });

  // Handle console errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    originalConsoleError.apply(console, args);
    
    // Don't report console errors in development
    if (import.meta.env.PROD) {
      const error = new Error(args.join(' '));
      errorMonitor.reportError(error);
    }
  };
}; 