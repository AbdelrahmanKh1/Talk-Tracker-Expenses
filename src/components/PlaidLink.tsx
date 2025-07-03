import React, { useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PlaidLinkProps {
  token: string | null;
  onLinkSuccess: (public_token: string) => void;
  children: React.ReactNode;
}

const PlaidLink: React.FC<PlaidLinkProps> = ({ token, onLinkSuccess, children }) => {
  const onSuccess = useCallback(
    (public_token: string) => {
      onLinkSuccess(public_token);
    },
    [onLinkSuccess]
  );

  const onExit = (error: any, metadata: any) => {
    console.error('Plaid Link exited:', { error, metadata });
    if (error) {
      toast.error(`Connection failed: ${error.display_message || error.error_message}`);
    }
  };

  const { open, ready } = usePlaidLink({
    token: token,
    onSuccess,
    onExit,
  });

  return (
    <div onClick={() => token && ready && open()}>
      {children}
    </div>
  );
};

export default PlaidLink; 