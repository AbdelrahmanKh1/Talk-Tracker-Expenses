import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface AccessibilityContextType {
  announceToScreenReader: (message: string) => void;
  focusFirstInteractiveElement: () => void;
  setFocusTrap: (containerRef: React.RefObject<HTMLElement>) => void;
  removeFocusTrap: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const location = useLocation();
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useRef<HTMLElement | null>(null);
  const focusableElementsRef = useRef<HTMLElement[]>([]);

  // Announce changes to screen readers
  const announceToScreenReader = (message: string) => {
    try {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
        // Clear the message after a short delay
        setTimeout(() => {
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = '';
          }
        }, 1000);
      }
    } catch (error) {
      console.warn('Screen reader announcement failed:', error);
    }
  };

  // Focus first interactive element in a container
  const focusFirstInteractiveElement = () => {
    try {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ];

      const focusableElements = document.querySelectorAll(focusableSelectors.join(', '));
      const firstElement = focusableElements[0] as HTMLElement;
      
      if (firstElement) {
        firstElement.focus();
      }
    } catch (error) {
      console.warn('Focus first element failed:', error);
    }
  };

  // Set up focus trap for modals
  const setFocusTrap = (containerRef: React.RefObject<HTMLElement>) => {
    try {
      if (!containerRef.current) return;

      focusTrapRef.current = containerRef.current;
      
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])',
        '[contenteditable="true"]'
      ];

      const elements = containerRef.current.querySelectorAll(focusableSelectors.join(', '));
      focusableElementsRef.current = Array.from(elements) as HTMLElement[];

      // Focus first element
      if (focusableElementsRef.current.length > 0) {
        focusableElementsRef.current[0].focus();
      }
    } catch (error) {
      console.warn('Focus trap setup failed:', error);
    }
  };

  // Remove focus trap
  const removeFocusTrap = () => {
    focusTrapRef.current = null;
    focusableElementsRef.current = [];
  };

  // Handle keyboard navigation for focus trap
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        if (!focusTrapRef.current || focusableElementsRef.current.length === 0) return;

        const { key, shiftKey } = event;
        
        if (key === 'Tab') {
          const firstElement = focusableElementsRef.current[0];
          const lastElement = focusableElementsRef.current[focusableElementsRef.current.length - 1];
          const activeElement = document.activeElement as HTMLElement;

          if (shiftKey) {
            // Shift + Tab: move backwards
            if (activeElement === firstElement) {
              event.preventDefault();
              lastElement.focus();
            }
          } else {
            // Tab: move forwards
            if (activeElement === lastElement) {
              event.preventDefault();
              firstElement.focus();
            }
          }
        }

        if (key === 'Escape') {
          // Close modal or dropdown
          const closeEvent = new CustomEvent('closeModal');
          document.dispatchEvent(closeEvent);
        }
      } catch (error) {
        console.warn('Keyboard navigation failed:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Announce route changes to screen readers
  useEffect(() => {
    try {
      const pathname = location.pathname;
      let pageTitle = '';

      switch (pathname) {
        case '/dashboard':
          pageTitle = 'Dashboard page';
          break;
        case '/settings':
          pageTitle = 'Settings page';
          break;
        case '/currency':
          pageTitle = 'Currency settings page';
          break;
        case '/auth':
          pageTitle = 'Authentication page';
          break;
        default:
          pageTitle = 'Page';
      }

      announceToScreenReader(`${pageTitle} loaded`);
    } catch (error) {
      console.warn('Route change announcement failed:', error);
    }
  }, [location]);

  // Skip to main content functionality
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      try {
        if (event.key === 'Tab' && !event.shiftKey) {
          // Show skip link on first tab
          const skipLink = document.getElementById('skip-to-main');
          if (skipLink) {
            skipLink.classList.remove('sr-only');
          }
        }
      } catch (error) {
        console.warn('Skip link functionality failed:', error);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const value: AccessibilityContextType = {
    announceToScreenReader,
    focusFirstInteractiveElement,
    setFocusTrap,
    removeFocusTrap,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {/* Skip to main content link */}
      <a
        id="skip-to-main"
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-teal-600 text-white px-4 py-2 rounded-lg z-50"
        onClick={(e) => {
          try {
            e.preventDefault();
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
              mainContent.focus();
              announceToScreenReader('Skipped to main content');
            }
          } catch (error) {
            console.warn('Skip to main content failed:', error);
          }
        }}
      >
        Skip to main content
      </a>

      {/* Live region for screen reader announcements */}
      <div
        ref={liveRegionRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      />

      {children}
    </AccessibilityContext.Provider>
  );
}; 