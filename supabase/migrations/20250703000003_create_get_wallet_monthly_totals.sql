-- Returns: wallet_id, total_amount
CREATE OR REPLACE FUNCTION public.get_wallet_monthly_totals(user_id uuid, month_prefix text)
RETURNS TABLE(wallet_id uuid, total_amount numeric)
LANGUAGE sql
AS $$
  SELECT wallet_id, SUM(amount) AS total_amount
  FROM wallet_transactions
  WHERE user_id = get_wallet_monthly_totals.user_id
    AND transaction_date::text LIKE month_prefix || '%'
  GROUP BY wallet_id;
$$; 