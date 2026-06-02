-- ============================================
-- 003_custom_orders_payment.sql
-- Update status check constraint to support awaiting_payment
-- ============================================

-- Drop the old constraint if it exists
ALTER TABLE public.custom_orders
  DROP CONSTRAINT IF EXISTS custom_orders_status_check;

-- Add the updated constraint including 'awaiting_payment'
ALTER TABLE public.custom_orders
  ADD CONSTRAINT custom_orders_status_check
  CHECK (status IN ('pending', 'awaiting_payment', 'in_progress', 'completed', 'cancelled'));
