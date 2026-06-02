-- ============================================
-- 13. CUSTOM ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  event_name TEXT NOT NULL,
  event_date TIMESTAMPTZ,
  event_type TEXT NOT NULL, -- e.g., 'birthday', 'wedding', 'holiday', 'graduation', 'corporate', 'social', 'other'
  description TEXT NOT NULL,
  reference_image_url TEXT,
  budget DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  designer_notes TEXT,
  completed_frame_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS custom_orders_user_id_idx ON public.custom_orders(user_id);
CREATE INDEX IF NOT EXISTS custom_orders_status_idx ON public.custom_orders(status);

-- Enable RLS
ALTER TABLE public.custom_orders ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Les utilisateurs peuvent creer leurs propres commandes"
  ON public.custom_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs peuvent voir leurs propres commandes"
  ON public.custom_orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Les administrateurs peuvent voir et modifier toutes les commandes"
  ON public.custom_orders FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
    )
  );
