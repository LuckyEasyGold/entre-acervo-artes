-- Migration: disciplinas (criadas por orientadores) e inscricoes de alunos
-- Extraido de supabase/schema.sql + supabase/rls.sql para que um ambiente novo
-- (supabase db push / db reset) fique igual a producao.
-- Idempotente: pode rodar mais de uma vez sem erro.

-- ============================================
-- Tabela: disciplines
-- ============================================
CREATE TABLE IF NOT EXISTS public.disciplines (
  id TEXT PRIMARY KEY,
  advisor_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Tabela: enrollments
-- ============================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id TEXT PRIMARY KEY,
  discipline_id TEXT NOT NULL REFERENCES public.disciplines(id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(discipline_id, artist_id)
);

-- ============================================
-- Indices (as FKs sao consultadas em todo filtro do painel)
-- ============================================
CREATE INDEX IF NOT EXISTS disciplines_advisor_id_idx ON public.disciplines (advisor_id);
CREATE INDEX IF NOT EXISTS enrollments_discipline_id_idx ON public.enrollments (discipline_id);
CREATE INDEX IF NOT EXISTS enrollments_artist_id_idx ON public.enrollments (artist_id);

-- ============================================
-- Trigger updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS disciplines_updated_at ON public.disciplines;
CREATE TRIGGER disciplines_updated_at BEFORE UPDATE ON public.disciplines
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- disciplines: leitura publica
DROP POLICY IF EXISTS "disciplines_select_public" ON public.disciplines;
CREATE POLICY "disciplines_select_public" ON public.disciplines FOR SELECT USING (true);

-- disciplines: escrita apenas pelo orientador dono (ou adm/moderador/orientador)
-- ATENCAO: advisor_id DEVE ser qualificado como disciplines.advisor_id, senao o
-- Postgres resolve a coluna advisor_id da propria tabela artists e a policy
-- nega todo INSERT com 42501.
DROP POLICY IF EXISTS "disciplines_insert_advisor" ON public.disciplines;
CREATE POLICY "disciplines_insert_advisor" ON public.disciplines FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.artists a
    WHERE a.id = disciplines.advisor_id
      AND a.user_id = auth.uid()
      AND (a.type = 'advisor' OR a.role IN ('adm', 'moderador', 'orientador', 'orientadora'))
  )
);

DROP POLICY IF EXISTS "disciplines_update_advisor" ON public.disciplines;
CREATE POLICY "disciplines_update_advisor" ON public.disciplines FOR UPDATE USING (
  EXISTS (
    SELECT 1
    FROM public.artists a
    WHERE a.id = disciplines.advisor_id
      AND a.user_id = auth.uid()
      AND (a.type = 'advisor' OR a.role IN ('adm', 'moderador', 'orientador', 'orientadora'))
  )
);

DROP POLICY IF EXISTS "disciplines_delete_advisor" ON public.disciplines;
CREATE POLICY "disciplines_delete_advisor" ON public.disciplines FOR DELETE USING (
  EXISTS (
    SELECT 1
    FROM public.artists a
    WHERE a.id = disciplines.advisor_id
      AND a.user_id = auth.uid()
      AND (a.type = 'advisor' OR a.role IN ('adm', 'moderador', 'orientador', 'orientadora'))
  )
);

-- enrollments: o aluno ve as proprias inscricoes, o orientador ve as da sua disciplina
DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.disciplines WHERE id = discipline_id AND advisor_id IN (
    SELECT id FROM public.artists WHERE user_id = auth.uid()
  ))
  OR EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- enrollments: apenas aluno se inscreve em nome proprio
DROP POLICY IF EXISTS "enrollments_insert_student" ON public.enrollments;
CREATE POLICY "enrollments_insert_student" ON public.enrollments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid() AND type = 'student')
);

-- enrollments: orientador da disciplina aprova/recusa
DROP POLICY IF EXISTS "enrollments_update_advisor" ON public.enrollments;
CREATE POLICY "enrollments_update_advisor" ON public.enrollments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.disciplines WHERE id = discipline_id AND advisor_id IN (
    SELECT id FROM public.artists WHERE user_id = auth.uid() AND (type = 'advisor' OR role IN ('adm', 'moderador', 'orientador', 'orientadora'))
  ))
);
