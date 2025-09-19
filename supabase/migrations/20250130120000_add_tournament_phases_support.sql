-- Migração para suportar diferentes formatos de torneio e fases
-- Data: 2025-01-30
-- Descrição: Adiciona suporte a fases de torneio, diferentes formatos e configurações avançadas

-- =====================================================
-- EXPANDIR TABELA CHAMPIONSHIPS
-- =====================================================

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

-- =====================================================
-- CRIAR TABELA TOURNAMENT_PHASES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tournament_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    championship_id UUID NOT NULL REFERENCES public.championships(id) ON DELETE CASCADE,
    nome_fase TEXT NOT NULL,
    ordem_fase INTEGER NOT NULL,
    tipo_fase TEXT NOT NULL CHECK (tipo_fase IN ('classificatoria', 'eliminatoria', 'final', 'playoff')),
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    numero_quedas INTEGER DEFAULT 1,
    numero_classificados INTEGER,
    configuracao JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativa', 'concluida', 'cancelada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(championship_id, ordem_fase)
);

-- Comentários para a tabela tournament_phases
COMMENT ON TABLE public.tournament_phases IS 'Fases dos torneios (classificatória, eliminatória, final, etc.)';
COMMENT ON COLUMN public.tournament_phases.nome_fase IS 'Nome da fase (ex: "Fase Classificatória", "Quartas de Final")';
COMMENT ON COLUMN public.tournament_phases.ordem_fase IS 'Ordem sequencial da fase no torneio';
COMMENT ON COLUMN public.tournament_phases.tipo_fase IS 'Tipo da fase: classificatoria, eliminatoria, final, playoff';
COMMENT ON COLUMN public.tournament_phases.numero_quedas IS 'Número de partidas/quedas nesta fase';
COMMENT ON COLUMN public.tournament_phases.numero_classificados IS 'Número de times que se classificam para a próxima fase';
COMMENT ON COLUMN public.tournament_phases.configuracao IS 'Configurações específicas da fase em JSON';

-- =====================================================
-- EXPANDIR TABELA GROUPS
-- =====================================================

-- Adicionar campos para suportar fases e configurações específicas
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.tournament_phases(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS data_jogos TIMESTAMP WITH TIME ZONE[],
ADD COLUMN IF NOT EXISTS configuracao_grupo JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status_grupo TEXT DEFAULT 'pendente' CHECK (status_grupo IN ('pendente', 'ativo', 'concluido', 'cancelado')),
ADD COLUMN IF NOT EXISTS ordem_grupo INTEGER DEFAULT 1;

-- Comentários para os novos campos
COMMENT ON COLUMN public.groups.phase_id IS 'Referência para a fase do torneio a que este grupo pertence';
COMMENT ON COLUMN public.groups.data_jogos IS 'Array de datas/horários dos jogos deste grupo';
COMMENT ON COLUMN public.groups.configuracao_grupo IS 'Configurações específicas do grupo em JSON';
COMMENT ON COLUMN public.groups.status_grupo IS 'Status atual do grupo';
COMMENT ON COLUMN public.groups.ordem_grupo IS 'Ordem do grupo (Grupo A=1, Grupo B=2, etc.)';

-- =====================================================
-- EXPANDIR TABELA MATCHES
-- =====================================================

-- Adicionar campos para melhor controle de partidas por fase
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.tournament_phases(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS tipo_partida TEXT DEFAULT 'queda' CHECK (tipo_partida IN ('queda', 'eliminatoria', 'final', 'playoff')),
ADD COLUMN IF NOT EXISTS configuracao_partida JSONB DEFAULT '{}'::jsonb;

-- Comentários para os novos campos
COMMENT ON COLUMN public.matches.phase_id IS 'Referência para a fase do torneio';
COMMENT ON COLUMN public.matches.tipo_partida IS 'Tipo da partida: queda, eliminatoria, final, playoff';
COMMENT ON COLUMN public.matches.configuracao_partida IS 'Configurações específicas da partida em JSON';

-- =====================================================
-- CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_tournament_phases_championship_id ON public.tournament_phases(championship_id);
CREATE INDEX IF NOT EXISTS idx_tournament_phases_ordem_fase ON public.tournament_phases(championship_id, ordem_fase);
CREATE INDEX IF NOT EXISTS idx_groups_phase_id ON public.groups(phase_id);
CREATE INDEX IF NOT EXISTS idx_groups_championship_phase ON public.groups(championship_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase_id ON public.matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_championship_phase ON public.matches(championship_id, phase_id);

-- =====================================================
-- POLÍTICAS RLS PARA TOURNAMENT_PHASES
-- =====================================================

ALTER TABLE public.tournament_phases ENABLE ROW LEVEL SECURITY;

-- Super admin pode ver todas as fases
CREATE POLICY "Super admin can view all tournament phases" ON public.tournament_phases
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all tournament phases" ON public.tournament_phases
  FOR ALL USING (public.is_super_admin());

-- Usuários podem ver fases dos campeonatos do seu tenant
CREATE POLICY "Users can view tournament phases in their tenant" ON public.tournament_phases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.championships c
      JOIN public.users u ON u.tenant_id = c.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = tournament_phases.championship_id
    )
  );

-- Usuários podem criar fases nos campeonatos do seu tenant
CREATE POLICY "Users can create tournament phases in their tenant" ON public.tournament_phases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.championships c
      JOIN public.users u ON u.tenant_id = c.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = tournament_phases.championship_id
    )
  );

-- Usuários podem atualizar fases nos campeonatos do seu tenant
CREATE POLICY "Users can update tournament phases in their tenant" ON public.tournament_phases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.championships c
      JOIN public.users u ON u.tenant_id = c.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = tournament_phases.championship_id
    )
  );

-- =====================================================
-- FUNÇÃO PARA CRIAR FASES PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_phases_for_championship(
  championship_id_param UUID,
  formato_torneio_param TEXT DEFAULT 'simples'
) RETURNS VOID AS $$
BEGIN
  -- Criar fases baseadas no formato do torneio
  CASE formato_torneio_param
    WHEN 'simples' THEN
      INSERT INTO public.tournament_phases (championship_id, nome_fase, ordem_fase, tipo_fase, numero_quedas)
      VALUES (championship_id_param, 'Fase Única', 1, 'classificatoria', 3);
    
    WHEN 'grupos' THEN
      INSERT INTO public.tournament_phases (championship_id, nome_fase, ordem_fase, tipo_fase, numero_quedas)
      VALUES 
        (championship_id_param, 'Fase de Grupos', 1, 'classificatoria', 3),
        (championship_id_param, 'Final', 2, 'final', 1);
    
    WHEN 'eliminatorio' THEN
      INSERT INTO public.tournament_phases (championship_id, nome_fase, ordem_fase, tipo_fase, numero_quedas)
      VALUES 
        (championship_id_param, 'Fase Classificatória', 1, 'classificatoria', 3),
        (championship_id_param, 'Oitavas de Final', 2, 'eliminatoria', 1),
        (championship_id_param, 'Quartas de Final', 3, 'eliminatoria', 1),
        (championship_id_param, 'Semifinal', 4, 'eliminatoria', 1),
        (championship_id_param, 'Final', 5, 'final', 1);
    
    WHEN 'misto' THEN
      INSERT INTO public.tournament_phases (championship_id, nome_fase, ordem_fase, tipo_fase, numero_quedas)
      VALUES 
        (championship_id_param, 'Fase de Grupos', 1, 'classificatoria', 3),
        (championship_id_param, 'Playoff', 2, 'playoff', 2),
        (championship_id_param, 'Final', 3, 'final', 1);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Comentário da função
COMMENT ON FUNCTION create_default_phases_for_championship IS 'Cria fases padrão para um campeonato baseado no formato escolhido';