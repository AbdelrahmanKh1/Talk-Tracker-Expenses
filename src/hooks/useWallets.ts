import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  fetchWallets as fetchWalletsService,
  createLinkToken,
  exchangePublicToken as exchangePublicTokenService,
  disconnectWallet as disconnectWalletService,
  Wallet
} from '@/services/walletService';

export const useWallets = () => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (user) {
      fetchWallets();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const fetchWallets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await fetchWalletsService();
      if (error) throw error;
      setWallets(data || []);
    } catch (e) {
      const error = e as Error;
      console.error('Error fetching wallets:', error);
      setError(error);
      toast.error('Could not fetch your connected wallets.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLinkToken = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await createLinkToken();
      if (error) throw error;
      setLinkToken(data.link_token);
    } catch (e) {
      const error = e as Error;
      console.error('Error generating link token:', error);
      toast.error('Could not initiate wallet connection. Please try again.');
    }
  };

  const exchangePublicToken = async (publicToken: string) => {
    try {
      const { data, error } = await exchangePublicTokenService(publicToken);
      if (error) throw error;
      toast.success(`Wallet "${data.wallet_name}" connected successfully!`);
      await fetchWallets();
    } catch (e) {
      const error = e as Error;
      console.error('Error exchanging public token:', error);
      toast.error('Failed to connect your wallet. Please try again.');
    } finally {
      setIsConnecting(false);
      setLinkToken(null);
    }
  };

  const connectWallet = async () => {
    await generateLinkToken();
  };

  const disconnectWallet = async (walletId: string) => {
    const originalWallets = wallets;
    setWallets(wallets.filter(w => w.id !== walletId));
    try {
      const { error } = await disconnectWalletService(walletId);
      if (error) throw error;
      toast.success('Wallet disconnected successfully.');
    } catch (e) {
      const error = e as Error;
      console.error(`Error disconnecting wallet ${walletId}:`, error);
      toast.error('Failed to disconnect wallet.');
      setWallets(originalWallets);
    }
  };

  return {
    wallets,
    isLoading,
    isConnecting,
    linkToken,
    error,
    connectWallet,
    disconnectWallet,
    exchangePublicToken,
    fetchWallets,
  };
}; 