import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, Wallet } from 'lucide-react';

interface ConnectWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
  isLoading: boolean;
}

const ConnectWalletModal: React.FC<ConnectWalletModalProps> = ({
  isOpen,
  onClose,
  onConnect,
  isLoading,
}) => {
  const [hasConsented, setHasConsented] = useState(false);

  const handleConnect = () => {
    if (hasConsented) {
      onConnect();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl flex flex-col mx-0 sm:mx-0 max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700 animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Connect Wallet</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Link your bank account or card
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Consent Information */}
        <div className="space-y-6 w-full">
            <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                By connecting your wallet, you give Say permission to access your transaction history and convert transactions into categorized expense items. Your data is private, secure, and can be deleted anytime.
                </p>
            </div>
            
            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(Boolean(checked))} />
                <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                I agree to the Privacy Policy and authorize Say to access my wallet data.
                </Label>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-12 rounded-xl border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleConnect}
              disabled={isLoading || !hasConsented}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Connecting...
                </div>
              ) : (
                'Connect Securely'
              )}
            </Button>
        </div>

      </div>
    </div>
  );
};

export default ConnectWalletModal; 