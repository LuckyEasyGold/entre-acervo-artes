-- Migration: categorias faltantes e suporte a mídias de áudio
-- Adiciona opções de categoria que podem existir no banco e ajusta o tipo
-- de arquivo para permitir reprodução de arquivos de áudio.

INSERT INTO public.categories (name, slug) VALUES
  ('Colagem', 'colagem'),
  ('Outros', 'outros')
ON CONFLICT (name) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'works'
      AND column_name = 'file_type'
  ) THEN
    ALTER TABLE public.works DROP CONSTRAINT IF EXISTS works_file_type_check;
    ALTER TABLE public.works
      ADD CONSTRAINT works_file_type_check
      CHECK (file_type IN ('image', 'video', 'audio', 'pdf', 'youtube'));
  END IF;
END $$;
