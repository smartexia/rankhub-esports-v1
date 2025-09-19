-- Atualizar campos da tabela championships
-- Remover campo max_participantes e adicionar novos campos

ALTER TABLE public.championships 
DROP COLUMN IF EXISTS max_participantes;

ALTER TABLE public.championships 
ADD COLUMN IF NOT EXISTS horario_inicio TIME,
ADD COLUMN IF NOT EXISTS tipo_campeonato TEXT DEFAULT 'individual';

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.championships.horario_inicio IS 'Horário de início do campeonato (formato 24h)';
COMMENT ON COLUMN public.championships.tipo_campeonato IS 'Tipo do campeonato: individual, duplas, trios ou squad';

-- Adicionar constraint para validar os tipos de campeonato
ALTER TABLE public.championships 
ADD CONSTRAINT check_tipo_campeonato 
CHECK (tipo_campeonato IN ('individual', 'duplas', 'trios', 'squad'));