-- Script para corrigir a tabela matches no Supabase
-- Execute este script no SQL Editor do painel do Supabase

-- 1. Verificar estrutura atual da tabela matches
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' AND table_schema = 'public' 
ORDER BY ordinal_position;

-- 2. Adicionar campos necessários para o ChampionshipMatchManager
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS match_number INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- 3. Comentários para os novos campos
COMMENT ON COLUMN public.matches.match_number IS 'Número sequencial da partida no campeonato';
COMMENT ON COLUMN public.matches.scheduled_time IS 'Data e hora agendada para a partida';

-- 4. Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_matches_championship_match_number ON public.matches(championship_id, match_number);

-- 5. Verificar se os campos foram adicionados corretamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'matches' AND table_schema = 'public' 
ORDER BY ordinal_position;