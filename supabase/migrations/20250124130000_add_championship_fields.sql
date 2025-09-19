-- Adicionar campos faltantes na tabela championships
ALTER TABLE public.championships 
ADD COLUMN IF NOT EXISTS descricao TEXT,
ADD COLUMN IF NOT EXISTS max_participantes INTEGER,
ADD COLUMN IF NOT EXISTS premiacao TEXT;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.championships.descricao IS 'Descrição detalhada do campeonato';
COMMENT ON COLUMN public.championships.max_participantes IS 'Número máximo de participantes permitidos no campeonato';
COMMENT ON COLUMN public.championships.premiacao IS 'Informações sobre a premiação do campeonato';