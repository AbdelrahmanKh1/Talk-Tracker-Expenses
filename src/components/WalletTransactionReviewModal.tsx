import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WalletTransactionForReview } from '@/services/walletService';

interface WalletTransactionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: WalletTransactionForReview[];
  onSave: (edited: WalletTransactionForReview[]) => void;
}

export const WalletTransactionReviewModal: React.FC<WalletTransactionReviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onSave,
}) => {
  const [edited, setEdited] = useState<WalletTransactionForReview[]>(transactions);

  React.useEffect(() => {
    setEdited(transactions);
  }, [transactions]);

  const handleChange = (idx: number, field: keyof WalletTransactionForReview, value: string | number) => {
    setEdited(prev => prev.map((tx, i) => i === idx ? { ...tx, [field]: value } : tx));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review New Wallet Transactions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {edited.map((tx, idx) => (
            <div key={tx.id} className="flex gap-2 items-center border-b pb-2">
              <Input
                value={tx.description}
                onChange={e => handleChange(idx, 'description', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                value={tx.amount}
                onChange={e => handleChange(idx, 'amount', Number(e.target.value))}
                className="w-24"
              />
              <Input
                value={tx.category}
                onChange={e => handleChange(idx, 'category', e.target.value)}
                className="w-32"
              />
              <span className="text-xs text-gray-500">{tx.transaction_date}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave(edited)} disabled={edited.length === 0}>Save as Expenses</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 