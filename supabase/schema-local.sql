-- ============================================
-- ENTRE Acervo de Artes — Supabase Schema (IDs em TEXT)
-- ============================================

-- Tabela: artists
-- ============================================
CREATE TABLE IF NOT EXISTS public.artists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'advisor')),
  course TEXT,
  title TEXT,
  area TEXT,
  subjects TEXT[],
  image TEXT,
  bio TEXT,
  curriculum TEXT,
  social JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela: works
-- ============================================
CREATE TABLE IF NOT EXISTS public.works (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  year INT,
  description TEXT,
  image TEXT,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'video', 'pdf', 'youtube')),
  youtube_url TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Trigger: updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS artists_updated_at ON public.artists;
CREATE TRIGGER artists_updated_at BEFORE UPDATE ON public.artists FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS works_updated_at ON public.works;
CREATE TRIGGER works_updated_at BEFORE UPDATE ON public.works FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
