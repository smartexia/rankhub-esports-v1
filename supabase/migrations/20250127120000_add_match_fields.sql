-- Adicionar campos necessários para o ChampionshipMatchManager
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS match_number INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_time TIMESTAMP WITH TIME ZONE;

-- Comentários para os novos campos
COMMENT ON COLUMN public.matches.match_number IS 'Número sequencial da partida no campeonato';
COMMENT ON COLUMN public.matches.scheduled_time IS 'Data e hora agendada para a partida';

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_matches_championship_match_number ON public.matches(championship_id, match_number);