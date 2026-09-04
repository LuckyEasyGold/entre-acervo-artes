-- ============================================
-- ENTRE Acervo de Artes — Supabase Schema
-- ============================================

-- Habilitar extensões necessárias
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  username TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('student', 'advisor')),
  course TEXT,
  title TEXT,
  area TEXT,
  subjects TEXT[],
  is_curator BOOLEAN DEFAULT false,
  image TEXT,
  bio TEXT,
  curriculum TEXT,
  social JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: advisors_students (vínculos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisors_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  advisor_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(advisor_id, student_id)
);

-- ============================================
-- Tabela: works
-- ============================================
CREATE TABLE IF NOT EXISTS public.works (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  year INT,
  description TEXT,
  file_url TEXT,
  file_type TEXT CHECK (file_type IN ('image', 'video', 'pdf', 'youtube')),
  youtube_url TEXT,
  external_links JSONB DEFAULT '[]'::jsonb,
  advisor_id UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  views INT DEFAULT 0,
  downloads INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: academic_productions
-- ============================================
CREATE TABLE IF NOT EXISTS public.academic_productions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  year INT,
  publisher TEXT,
  journal TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: critiques (críticas dos orientadores)
-- ============================================
CREATE TABLE IF NOT EXISTS public.critiques (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: work_requests (solicitações de orientação)
-- ============================================
CREATE TABLE IF NOT EXISTS public.work_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
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
