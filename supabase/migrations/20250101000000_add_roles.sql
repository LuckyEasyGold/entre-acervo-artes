-- Migration: roles e aprovacao de cadastro
-- Adiciona role, status e aprovacao na tabela artists

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'artista' CHECK (role IN ('adm', 'moderador', 'orientador', 'artista')),
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.artists(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Primeiro adm/orientador: role 'adm', status 'approved'
-- Ajuste manualmente no dashboard se necessario
