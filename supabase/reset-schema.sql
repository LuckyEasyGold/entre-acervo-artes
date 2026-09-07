-- Ajuste de schema para IDs em TEXT (compatível com data/*.json)
-- Execute isso no Supabase Dashboard -> SQL Editor

-- Recriar tabelas com IDs em TEXT
DROP TABLE IF EXISTS public.advisors_students;
DROP TABLE IF EXISTS public.academic_productions;
DROP TABLE IF EXISTS public.works;
DROP TABLE IF EXISTS public.artists;

CREATE TABLE public.artists (
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

CREATE TABLE public.works (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  advisor_id TEXT REFERENCES public.artists(id) ON DELETE SET NULL,
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
-- Tabela: advisors_students (vínculos)
-- ============================================
CREATE TABLE IF NOT EXISTS public.advisors_students (
  id TEXT PRIMARY KEY,
  advisor_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(advisor_id, student_id)
);

-- ============================================
-- Tabela: academic_productions
-- ============================================
CREATE TABLE IF NOT EXISTS public.academic_productions (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  year INT,
  publisher TEXT,
  journal TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
