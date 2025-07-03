-- Returns wallet transactions for a user/wallet that are not yet in expenses
CREATE OR REPLACE FUNCTION public.list_wallet_transactions_for_review(user_id uuid, wallet_id uuid)
RETURNS TABLE(
  id uuid,
  provider_transaction_id text,
  amount numeric,
  description text,
  category text,
  transaction_date date
) AS $$
  SELECT t.id, t.provider_transaction_id, t.amount, t.description, t.category, t.transaction_date
  FROM wallet_transactions t
  WHERE t.user_id = list_wallet_transactions_for_review.user_id
    AND t.wallet_id = list_wallet_transactions_for_review.wallet_id
    AND NOT EXISTS (
      SELECT 1 FROM expenses e WHERE e.provider_transaction_id = t.provider_transaction_id
    );
$$ LANGUAGE sql; 