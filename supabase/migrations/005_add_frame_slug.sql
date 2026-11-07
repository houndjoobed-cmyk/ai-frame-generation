-- ===================================================
-- Migration 005: Add customizable slug column to frames
-- ===================================================

-- 1. Add slug column to public.frames
ALTER TABLE public.frames ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Create unique index for fast lookups and URL uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS idx_frames_slug ON public.frames(LOWER(slug)) WHERE slug IS NOT NULL;

-- 3. Populate existing frames with a default slug based on their name if empty
UPDATE public.frames
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL AND name IS NOT NULL;

