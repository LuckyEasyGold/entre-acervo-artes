-- ============================================
-- ENTRE Acervo de Artes — RLS Policies
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisors_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.works ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Policies: categories (público para leitura)
-- ============================================
CREATE POLICY "categories_select_public" ON public.categories FOR SELECT USING (true);

-- ============================================
-- Policies: artists
-- ============================================
CREATE POLICY "artists_select_public" ON public.artists FOR SELECT USING (true);
CREATE POLICY "artists_insert_own" ON public.artists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "artists_update_own" ON public.artists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "artists_delete_own" ON public.artists FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Policies: advisors_students
-- ============================================
CREATE POLICY "advisors_students_select_own" ON public.advisors_students FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.artists WHERE id = student_id AND user_id = auth.uid())
);
CREATE POLICY "advisors_students_insert_advisor" ON public.advisors_students FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);
CREATE POLICY "advisors_students_update_advisor" ON public.advisors_students FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = advisor_id AND user_id = auth.uid() AND type = 'advisor')
);

-- ============================================
-- Policies: works
-- ============================================
CREATE POLICY "works_select_published" ON public.works FOR SELECT USING (status = 'published');
CREATE POLICY "works_select_own" ON public.works FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "works_insert_own" ON public.works FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "works_update_own" ON public.works FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "works_delete_own" ON public.works FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- ============================================
-- Policies: academic_productions
-- ============================================
CREATE POLICY "academic_productions_select_own" ON public.academic_productions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "academic_productions_insert_own" ON public.academic_productions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "academic_productions_update_own" ON public.academic_productions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);
CREATE POLICY "academic_productions_delete_own" ON public.academic_productions FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.artists WHERE id = artist_id AND user_id = auth.uid())
);

-- ============================================
-- Storage Policies (para usar no Supabase Dashboard)
-- ============================================
-- Buckets sugeridos: avatars, works, thumbnails
-- Política de upload: apenas usuários autenticados
-- Política de leitura: pública para works, privada para avatars (opcional)
