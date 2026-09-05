-- ============================================
-- ENTRE Acervo de Artes — Supabase Schema
-- ============================================

-- Extensão
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Tabela: categories
-- ============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: artists
-- ============================================
CREATE TABLE IF NOT EXISTS public.artists (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student', 'advisor')),
  role TEXT NOT NULL DEFAULT 'artista' CHECK (role IN ('adm', 'moderador', 'orientador', 'artista')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  advisor_id TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
  moderator_votes INT DEFAULT 0,
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

-- ============================================
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
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'published', 'rejected')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  reviewed_by TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: advisor_votes (eleição de moderador)
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisor_votes (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  advisor_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, advisor_id)
);

-- ============================================
-- Tabela: advisor_requests (solicitação de orientador)
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisor_requests (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  advisor_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(artist_id, advisor_id)
);

-- ============================================
-- Triggers
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

-- ============================================
-- Seed: categorias padrão
-- ============================================
INSERT INTO public.categories (name, slug) VALUES
  ('Artes Visuais', 'visual'),
  ('Fotografia', 'foto'),
  ('Pintura', 'pintura'),
  ('Desenho', 'desenho'),
  ('Escultura', 'escultura'),
  ('Documentário', 'documentario'),
  ('Videoarte', 'video-arte'),
  ('Dança', 'danca'),
  ('Música', 'musica'),
  ('Teatro', 'teatro'),
  ('Performance', 'performance'),
  ('Lipsync', 'lipsync'),
  ('Literatura', 'literatura'),
  ('Publicação', 'publicacao'),
  ('TCC', 'tcc'),
  ('Artigo', 'artigo'),
  ('Instalação', 'instalacao'),
  ('Arte Digital', 'arte-digital')
ON CONFLICT (name) DO NOTHING;
