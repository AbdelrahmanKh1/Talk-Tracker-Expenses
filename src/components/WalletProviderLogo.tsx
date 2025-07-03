import React from 'react';

interface WalletProviderLogoProps {
  provider: string;
  className?: string;
}

const logos: Record<string, React.ReactNode> = {
  Plaid: (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#00B795"/>
      <path d="M10 16l6 6 6-6-6-6-6 6z" fill="#fff"/>
    </svg>
  ),
  TrueLayer: (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#FFB800"/>
      <path d="M16 8l8 8-8 8-8-8 8-8z" fill="#fff"/>
    </svg>
  ),
  Mono: (
    <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="#2D50E6"/>
      <circle cx="16" cy="16" r="8" fill="#fff"/>
    </svg>
  ),
};

export const WalletProviderLogo: React.FC<WalletProviderLogoProps> = ({ provider, className }) => {
  return (
    <span className={className} title={provider}>
      {logos[provider] || (
        <svg viewBox="0 0 32 32" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="8" fill="#CBD5E1"/>
          <path d="M10 16l6 6 6-6-6-6-6 6z" fill="#64748B"/>
        </svg>
      )}
    </span>
  );
}; 