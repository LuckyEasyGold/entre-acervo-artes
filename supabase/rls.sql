-- ============================================
-- ENTRE Acervo de Artes — RLS Policies
-- Compatível com supabase/schema.sql
-- Pode ser executado quantas vezes quiser (idempotente)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disciplines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies: categories (público para leitura)
-- ============================================
DROP POLICY IF EXISTS "categories_select_public" ON public.categories;
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);

-- ============================================
-- Policies: artists
-- ============================================
DROP POLICY IF EXISTS "artists_select_public" ON public.artists;
CREATE POLICY "artists_select_public" ON public.artists FOR SELECT USING (true);
DROP POLICY IF EXISTS "artists_insert_own" ON public.artists;
CREATE POLICY "artists_insert_own" ON public.artists FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "artists_update_own" ON public.artists;
CREATE POLICY "artists_update_own" ON public.artists FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "artists_update_moderator" ON public.artists;
CREATE POLICY "artists_update_moderator" ON public.artists FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artists.id AND role IN ('adm', 'moderador') AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "artists_delete_own" ON public.artists;
CREATE POLICY "artists_delete_own" ON public.artists FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Policies: works
-- ============================================
DROP POLICY IF EXISTS "works_select_published" ON public.works;
CREATE POLICY "works_select_published" ON public.works FOR SELECT USING (status = 'published');
DROP POLICY IF EXISTS "works_select_own" ON public.works;
CREATE POLICY "works_select_own" ON public.works FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "works_insert_own" ON public.works;
CREATE POLICY "works_insert_own" ON public.works FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "works_update_own" ON public.works;
CREATE POLICY "works_update_own" ON public.works FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "works_delete_own" ON public.works;
CREATE POLICY "works_delete_own" ON public.works FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- ============================================
-- Policies: advisor_votes (eleição de moderador)
-- ============================================
DROP POLICY IF EXISTS "advisor_votes_select_own" ON public.advisor_votes;
CREATE POLICY "advisor_votes_select_own" ON public.advisor_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "advisor_votes_insert_own" ON public.advisor_votes;
CREATE POLICY "advisor_votes_insert_own" ON public.advisor_votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);

-- ============================================
-- Policies: advisor_requests (solicitação de orientação)
-- ============================================
DROP POLICY IF EXISTS "advisor_requests_select_own" ON public.advisor_requests;
CREATE POLICY "advisor_requests_select_own" ON public.advisor_requests FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "advisor_requests_insert_own" ON public.advisor_requests;
CREATE POLICY "advisor_requests_insert_own" ON public.advisor_requests FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "advisor_requests_update_advisor" ON public.advisor_requests;
CREATE POLICY "advisor_requests_update_advisor" ON public.advisor_requests FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid())
);

-- ============================================
-- Policies: disciplines (criadas por orientadores)
-- ============================================
DROP POLICY IF EXISTS "disciplines_select_public" ON public.disciplines;
CREATE POLICY "disciplines_select_public" ON public.disciplines FOR SELECT USING (true);
DROP POLICY IF EXISTS "disciplines_insert_advisor" ON public.disciplines;
CREATE POLICY "disciplines_insert_advisor" ON public.disciplines FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);
DROP POLICY IF EXISTS "disciplines_update_advisor" ON public.disciplines;
CREATE POLICY "disciplines_update_advisor" ON public.disciplines FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);
DROP POLICY IF EXISTS "disciplines_delete_advisor" ON public.disciplines;
CREATE POLICY "disciplines_delete_advisor" ON public.disciplines FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);

-- ============================================
-- Policies: enrollments (inscrição de alunos)
-- ============================================
DROP POLICY IF EXISTS "enrollments_select_own" ON public.enrollments;
CREATE POLICY "enrollments_select_own" ON public.enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.disciplines WHERE id = discipline_id AND advisor_id IN (
    SELECT id FROM public.artists WHERE user_id = auth.uid()
  ))
  OR EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
DROP POLICY IF EXISTS "enrollments_insert_student" ON public.enrollments;
CREATE POLICY "enrollments_insert_student" ON public.enrollments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid() AND type = 'student')
);
DROP POLICY IF EXISTS "enrollments_update_advisor" ON public.enrollments;
CREATE POLICY "enrollments_update_advisor" ON public.enrollments FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.disciplines WHERE id = discipline_id AND advisor_id IN (
    SELECT id FROM public.artists WHERE user_id = auth.uid() AND type = 'advisor'
  ))
);

-- ============================================
-- Storage: bucket "works" (cria se não existir)
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('works', 'works', true)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública dos arquivos (obras publicadas)
DROP POLICY IF EXISTS "works_public_select" ON storage.objects;
CREATE POLICY "works_public_select" ON storage.objects FOR SELECT USING (bucket_id = 'works');

-- Upload de qualquer usuário autenticado (posse é controlada pelo app)
DROP POLICY IF EXISTS "works_auth_insert" ON storage.objects;
CREATE POLICY "works_auth_insert" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'works' AND auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "works_auth_update" ON storage.objects;
CREATE POLICY "works_auth_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'works' AND auth.role() = 'authenticated'
);
DROP POLICY IF EXISTS "works_auth_delete" ON storage.objects;
CREATE POLICY "works_auth_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'works' AND auth.role() = 'authenticated'
);