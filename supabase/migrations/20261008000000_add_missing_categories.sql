-- Migration: categorias faltantes
-- Adiciona opções de categoria que podem existir no banco e não estavam
-- presentes no seed inicial do schema.

INSERT INTO public.categories (name, slug) VALUES
  ('Colagem', 'colagem'),
  ('Outros', 'outros')
ON CONFLICT (name) DO NOTHING;
