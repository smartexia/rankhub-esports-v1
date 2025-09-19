-- Script para corrigir colunas faltantes na tabela championships
-- Execute este script no SQL Editor do Supabase

-- Adicionar campos para formatos de torneio
ALTER TABLE public.championships 
ADD COLUMN IF NOT EXISTS formato_torneio TEXT DEFAULT 'simples' CHECK (formato_torneio IN ('simples', 'grupos', 'eliminatorio', 'misto')),
ADD COLUMN IF NOT EXISTS numero_fases INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS configuracao_fases JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS numero_grupos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS times_por_grupo INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS configuracao_avancada JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.championships.formato_torneio IS 'Formato do torneio: simples, grupos, eliminatorio, misto';
COMMENT ON COLUMN public.championships.numero_fases IS 'Número total de fases do torneio';
COMMENT ON COLUMN public.championships.configuracao_fases IS 'Configuração detalhada de cada fase em JSON';
COMMENT ON COLUMN public.championships.numero_grupos IS 'Número de grupos no torneio';
COMMENT ON COLUMN public.championships.times_por_grupo IS 'Número máximo de times por grupo';
COMMENT ON COLUMN public.championships.configuracao_avancada IS 'Configurações avançadas específicas do formato';

-- Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'championships' 
AND table_schema = 'public'
AND column_name IN ('formato_torneio', 'numero_fases', 'configuracao_fases', 'numero_grupos', 'times_por_grupo', 'configuracao_avancada')
ORDER BY column_name;