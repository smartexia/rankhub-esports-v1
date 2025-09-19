-- =====================================================
-- SCRIPT PARA CORRIGIR RELACIONAMENTOS DE TOURNAMENT_PHASES
-- =====================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- Os erros mostram que há problemas com relacionamentos entre
-- matches e tournament_phases, indicando que a migração não foi
-- executada corretamente ou está incompleta.
--
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/kxhkspmlyxmhzqckyqvd/sql
--
-- =====================================================

-- 1. VERIFICAR SE A TABELA TOURNAMENT_PHASES EXISTE
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'tournament_phases' 
AND table_schema = 'public';

-- 2. VERIFICAR COLUNAS DA TABELA MATCHES
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. CRIAR TABELA TOURNAMENT_PHASES SE NÃO EXISTIR
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

-- 4. ADICIONAR COLUNA PHASE_ID NA TABELA MATCHES SE NÃO EXISTIR
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.tournament_phases(id) ON DELETE CASCADE;

-- 5. ADICIONAR OUTRAS COLUNAS NECESSÁRIAS NA TABELA MATCHES
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS tipo_partida TEXT DEFAULT 'queda' CHECK (tipo_partida IN ('queda', 'eliminatoria', 'final', 'playoff')),
ADD COLUMN IF NOT EXISTS configuracao_partida JSONB DEFAULT '{}'::jsonb;

-- 6. ADICIONAR COLUNA DATA_HORA_QUEDA SE NÃO EXISTIR
ALTER TABLE public.matches 
ADD COLUMN IF NOT EXISTS data_hora_queda TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 7. EXPANDIR TABELA GROUPS PARA SUPORTAR FASES
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.tournament_phases(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS data_jogos TIMESTAMP WITH TIME ZONE[],
ADD COLUMN IF NOT EXISTS configuracao_grupo JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS status_grupo TEXT DEFAULT 'pendente' CHECK (status_grupo IN ('pendente', 'ativo', 'concluido', 'cancelado')),
ADD COLUMN IF NOT EXISTS ordem_grupo INTEGER DEFAULT 1;

-- 8. EXPANDIR TABELA TEAMS PARA SUPORTAR FASES
ALTER TABLE public.teams 
ADD COLUMN IF NOT EXISTS phase_id UUID REFERENCES public.tournament_phases(id) ON DELETE SET NULL;

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tournament_phases_championship_id ON public.tournament_phases(championship_id);
CREATE INDEX IF NOT EXISTS idx_tournament_phases_ordem_fase ON public.tournament_phases(championship_id, ordem_fase);
CREATE INDEX IF NOT EXISTS idx_groups_phase_id ON public.groups(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_phase_id ON public.matches(phase_id);
CREATE INDEX IF NOT EXISTS idx_matches_championship_phase ON public.matches(championship_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_teams_phase_id ON public.teams(phase_id);

-- 10. HABILITAR RLS NA TABELA TOURNAMENT_PHASES
ALTER TABLE public.tournament_phases ENABLE ROW LEVEL SECURITY;

-- 11. CRIAR POLÍTICAS RLS PARA TOURNAMENT_PHASES
CREATE POLICY "Super admin can view all tournament phases" ON public.tournament_phases
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all tournament phases" ON public.tournament_phases
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view tournament phases in their tenant" ON public.tournament_phases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = tournament_phases.championship_id
    )
  );

CREATE POLICY "Users can manage tournament phases in their tenant" ON public.tournament_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = tournament_phases.championship_id
    )
  );

-- 12. VERIFICAR SE TUDO FOI CRIADO CORRETAMENTE
SELECT 
    'tournament_phases' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'tournament_phases' 
AND table_schema = 'public'
UNION ALL
SELECT 
    'matches' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'matches' 
AND table_schema = 'public'
AND column_name IN ('phase_id', 'tipo_partida', 'configuracao_partida', 'data_hora_queda')
ORDER BY tabela, column_name;

-- 13. VERIFICAR POLÍTICAS CRIADAS
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'tournament_phases'
ORDER BY policyname;

-- =====================================================
-- INSTRUÇÕES FINAIS:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Execute o script create-test-data.js para criar dados de teste
-- 4. Teste a funcionalidade de partidas na aplicação
-- =====================================================