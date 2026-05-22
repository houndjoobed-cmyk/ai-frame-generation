-- ============================================
-- Digital Frames AI - Database Migration
-- Complete schema for the platform
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 0. NEXT_AUTH SCHEMA (required by @auth/supabase-adapter)
-- ============================================
CREATE SCHEMA IF NOT EXISTS next_auth;

GRANT USAGE ON SCHEMA next_auth TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA next_auth TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA next_auth TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA next_auth GRANT ALL ON SEQUENCES TO service_role;

CREATE TABLE IF NOT EXISTS next_auth.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE TABLE IF NOT EXISTS next_auth.accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS next_auth.sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" UUID NOT NULL REFERENCES next_auth.users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS next_auth.verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- ============================================
-- 1. PROFILES (extends next_auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  country TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin', 'super_admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. USER PASSWORDS (for credentials auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_passwords (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. FRAMES
-- ============================================
CREATE TABLE IF NOT EXISTS public.frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  download_count INT NOT NULL DEFAULT 0,
  like_count INT NOT NULL DEFAULT 0,
  created_by UUID,
  width INT,
  height INT,
  file_size BIGINT,
  file_format TEXT CHECK (file_format IN ('png', 'jpg', 'svg', 'webp')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. FRAME LIKES
-- ============================================
CREATE TABLE IF NOT EXISTS public.frame_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  frame_id UUID NOT NULL REFERENCES public.frames(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);

-- ============================================
-- 6. PROJECTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Sans titre',
  description TEXT,
  thumbnail_url TEXT,
  canvas_data JSONB,
  canvas_width INT NOT NULL DEFAULT 1080,
  canvas_height INT NOT NULL DEFAULT 1080,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. PROJECT FRAMES (junction)
-- ============================================
CREATE TABLE IF NOT EXISTS public.project_frames (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  frame_id UUID NOT NULL REFERENCES public.frames(id) ON DELETE CASCADE,
  layer_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, frame_id)
);

-- ============================================
-- 8. AI GENERATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  generated_image_url TEXT,
  model TEXT NOT NULL DEFAULT 'stable-diffusion',
  style TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  credits_used INT NOT NULL DEFAULT 1,
  generation_params JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 9. SUBSCRIPTION PLANS
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XOF',
  features JSONB DEFAULT '[]',
  max_exports_per_month INT,
  max_ai_credits_per_month INT,
  max_storage_mb INT,
  has_hd_export BOOLEAN NOT NULL DEFAULT FALSE,
  has_premium_frames BOOLEAN NOT NULL DEFAULT FALSE,
  has_ai_generation BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 10. USER SUBSCRIPTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'kkiapay', 'fedapay', 'mobile_money')),
  payment_reference TEXT,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 11. AI CREDITS
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  total_credits INT NOT NULL DEFAULT 5,
  used_credits INT NOT NULL DEFAULT 0,
  last_refill_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 12. EXPORTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  file_url TEXT,
  file_format TEXT NOT NULL DEFAULT 'png' CHECK (file_format IN ('png', 'jpg', 'webp', 'gif', 'mp4')),
  export_preset TEXT DEFAULT 'square' CHECK (export_preset IN ('square', 'story', 'tiktok', 'custom')),
  width INT,
  height INT,
  quality TEXT DEFAULT 'standard' CHECK (quality IN ('standard', 'hd', 'ultra_hd')),
  file_size BIGINT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 13. NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'export', 'ai', 'subscription', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 14. PAYMENTS (transaction history)
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  subscription_id UUID REFERENCES public.user_subscriptions(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'kkiapay', 'fedapay', 'mobile_money')),
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 15. USER FAVORITES
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  frame_id UUID NOT NULL REFERENCES public.frames(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, frame_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_frames_category_id ON public.frames(category_id);
CREATE INDEX idx_frames_created_by ON public.frames(created_by);
CREATE INDEX idx_frames_is_public ON public.frames(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_frames_is_premium ON public.frames(is_premium);
CREATE INDEX idx_frames_tags ON public.frames USING GIN(tags);
CREATE INDEX idx_frame_likes_user ON public.frame_likes(user_id);
CREATE INDEX idx_frame_likes_frame ON public.frame_likes(frame_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_ai_generations_user ON public.ai_generations(user_id);
CREATE INDEX idx_ai_generations_status ON public.ai_generations(status);
CREATE INDEX idx_user_subscriptions_user ON public.user_subscriptions(user_id);
CREATE INDEX idx_exports_user ON public.exports(user_id);
CREATE INDEX idx_exports_project ON public.exports(project_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_user_favorites_user ON public.user_favorites(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Increment frame like count
CREATE OR REPLACE FUNCTION public.increment_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.frames SET like_count = like_count + 1 WHERE id = NEW.frame_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrement frame like count
CREATE OR REPLACE FUNCTION public.decrement_like_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.frames SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.frame_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Increment download count
CREATE OR REPLACE FUNCTION public.increment_download_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.frames f
    SET download_count = download_count + 1
    FROM public.project_frames pf
    WHERE pf.project_id = NEW.project_id AND f.id = pf.frame_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Auto-create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (NEW.id, NEW.name, NEW.image);

  INSERT INTO public.ai_credits (user_id, total_credits, used_credits)
  VALUES (NEW.id, 5, 0);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_frames_updated_at
  BEFORE UPDATE ON public.frames
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_passwords_updated_at
  BEFORE UPDATE ON public.user_passwords
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_ai_credits_updated_at
  BEFORE UPDATE ON public.ai_credits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER on_frame_liked
  AFTER INSERT ON public.frame_likes
  FOR EACH ROW EXECUTE FUNCTION public.increment_like_count();

CREATE TRIGGER on_frame_unliked
  AFTER DELETE ON public.frame_likes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_like_count();

CREATE TRIGGER on_export_completed
  AFTER UPDATE ON public.exports
  FOR EACH ROW EXECUTE FUNCTION public.increment_download_count();

-- Auto-create profile when new user is created in next_auth schema
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON next_auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.frame_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_frames ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Categories: public read, admin write
CREATE POLICY "Categories are viewable by everyone" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Subscription plans: public read
CREATE POLICY "Plans are viewable by everyone" ON public.subscription_plans FOR SELECT USING (true);

-- Profiles: public read, own write
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (user_id = auth.uid());

-- Frames: public read active, creator/admin write
CREATE POLICY "Public frames are viewable" ON public.frames FOR SELECT USING (is_active = TRUE AND is_public = TRUE);
CREATE POLICY "Creators can manage own frames" ON public.frames FOR ALL USING (created_by = auth.uid());

-- Frame likes: authenticated users
CREATE POLICY "Users can see likes" ON public.frame_likes FOR SELECT USING (true);
CREATE POLICY "Users can like frames" ON public.frame_likes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can unlike frames" ON public.frame_likes FOR DELETE USING (user_id = auth.uid());

-- Projects: own only
CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (user_id = auth.uid() OR is_public = TRUE);
CREATE POLICY "Users can manage own projects" ON public.projects FOR ALL USING (user_id = auth.uid());

-- Project frames: through project ownership
CREATE POLICY "Users can view own project frames" ON public.project_frames FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND (user_id = auth.uid() OR is_public = TRUE))
);
CREATE POLICY "Users can manage own project frames" ON public.project_frames FOR ALL USING (
  EXISTS (SELECT 1 FROM public.projects WHERE id = project_id AND user_id = auth.uid())
);

-- AI generations: own only
CREATE POLICY "Users can view own AI generations" ON public.ai_generations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create AI generations" ON public.ai_generations FOR INSERT WITH CHECK (user_id = auth.uid());

-- AI credits: own only
CREATE POLICY "Users can view own credits" ON public.ai_credits FOR SELECT USING (user_id = auth.uid());

-- Subscriptions: own only
CREATE POLICY "Users can view own subscription" ON public.user_subscriptions FOR SELECT USING (user_id = auth.uid());

-- Exports: own only
CREATE POLICY "Users can view own exports" ON public.exports FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create exports" ON public.exports FOR INSERT WITH CHECK (user_id = auth.uid());

-- Notifications: own only
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = auth.uid());

-- Payments: own only
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (user_id = auth.uid());

-- User passwords: service role only (no public access)
CREATE POLICY "No public access to passwords" ON public.user_passwords FOR ALL USING (false);

-- User favorites: own only
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can add favorites" ON public.user_favorites FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can remove favorites" ON public.user_favorites FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- SEED DATA: Categories
-- ============================================
INSERT INTO public.categories (name, slug, description, icon, color, sort_order) VALUES
  ('Anniversaire', 'anniversaire', 'Frames pour anniversaires', '🎂', '#FF6B9D', 1),
  ('Église', 'eglise', 'Frames pour événements religieux', '⛪', '#9B59B6', 2),
  ('Mariage', 'mariage', 'Frames pour mariages', '💍', '#E91E63', 3),
  ('IA', 'ia', 'Frames générés par intelligence artificielle', '🤖', '#00BCD4', 4),
  ('Gaming', 'gaming', 'Frames pour gamers et esports', '🎮', '#4CAF50', 5),
  ('Conférence', 'conference', 'Frames pour conférences et séminaires', '🎤', '#FF9800', 6),
  ('Université', 'universite', 'Frames pour événements universitaires', '🎓', '#3F51B5', 7),
  ('Business', 'business', 'Frames pour événements professionnels', '💼', '#607D8B', 8),
  ('Festival', 'festival', 'Frames pour festivals et concerts', '🎵', '#F44336', 9),
  ('Sport', 'sport', 'Frames pour événements sportifs', '⚽', '#8BC34A', 10)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- SEED DATA: Subscription Plans
-- ============================================
INSERT INTO public.subscription_plans (name, slug, description, price_monthly, price_yearly, currency, features, max_exports_per_month, max_ai_credits_per_month, max_storage_mb, has_hd_export, has_premium_frames, has_ai_generation, sort_order) VALUES
  ('Gratuit', 'free', 'Plan gratuit avec fonctionnalités de base', 0, 0, 'XOF',
   '["5 exports par mois", "Frames basiques", "Export standard"]',
   5, 3, 100, FALSE, FALSE, FALSE, 1),
  ('Pro', 'pro', 'Plan professionnel pour créateurs', 2990, 29900, 'XOF',
   '["50 exports par mois", "Frames premium", "Export HD", "IA basique", "Stockage 1 Go"]',
   50, 20, 1024, TRUE, TRUE, TRUE, 2),
  ('Business', 'business', 'Plan business pour organisations', 9990, 99900, 'XOF',
   '["Exports illimités", "Tous les frames", "Export Ultra HD", "IA avancée", "Stockage 10 Go", "Support prioritaire"]',
   NULL, 100, 10240, TRUE, TRUE, TRUE, 3)
ON CONFLICT (slug) DO NOTHING;
