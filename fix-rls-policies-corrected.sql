-- =====================================================
-- SCRIPT CORRIGIDO PARA EXECUTAR NO SUPABASE
-- =====================================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. Vá para seu projeto: kxhkspmlyxmhzqckyqvd
-- 3. Navegue para "SQL Editor"
-- 4. Cole e execute este script completo
--
-- =====================================================

-- Função para verificar se o usuário é super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLÍTICAS PARA USERS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admin can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Criar novas políticas
CREATE POLICY "Super admin can view all users" ON public.users
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA TENANTS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their own tenant" ON public.tenants;
DROP POLICY IF EXISTS "Users can create their own tenant" ON public.tenants;

-- Criar novas políticas
CREATE POLICY "Super admins can view all tenants" ON public.tenants
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Super admins can manage all tenants" ON public.tenants
  FOR ALL USING (is_super_admin());

CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (manager_id = auth.uid());

CREATE POLICY "Users can create their own tenant" ON public.tenants
  FOR INSERT WITH CHECK (manager_id = auth.uid());

-- =====================================================
-- POLÍTICAS PARA CHAMPIONSHIPS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admin can view all championships" ON public.championships;
DROP POLICY IF EXISTS "Users can view championships in their tenant" ON public.championships;
DROP POLICY IF EXISTS "Users can create championships in their tenant" ON public.championships;
DROP POLICY IF EXISTS "Users can update championships in their tenant" ON public.championships;

-- Criar novas políticas
CREATE POLICY "Super admin can view all championships" ON public.championships
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view championships in their tenant" ON public.championships
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create championships in their tenant" ON public.championships
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can update championships in their tenant" ON public.championships
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));

-- =====================================================
-- POLÍTICAS PARA TEAMS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admin can view all teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their tenant" ON public.teams;
DROP POLICY IF EXISTS "Users can create teams in their tenant" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams in their tenant" ON public.teams;

-- Criar novas políticas
CREATE POLICY "Super admin can view all teams" ON public.teams
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view teams in their tenant" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = teams.championship_id
    )
  );

CREATE POLICY "Users can create teams in their tenant" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = teams.championship_id
    )
  );

CREATE POLICY "Users can update teams in their tenant" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = teams.championship_id
    )
  );

-- =====================================================
-- POLÍTICAS PARA MATCHES
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admin can view all matches" ON public.matches;
DROP POLICY IF EXISTS "Users can view matches in their tenant" ON public.matches;
DROP POLICY IF EXISTS "Users can create matches in their tenant" ON public.matches;
DROP POLICY IF EXISTS "Users can update matches in their tenant" ON public.matches;

-- Criar novas políticas
CREATE POLICY "Super admin can view all matches" ON public.matches
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view matches in their tenant" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = matches.championship_id
    )
  );

CREATE POLICY "Users can create matches in their tenant" ON public.matches
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = matches.championship_id
    )
  );

CREATE POLICY "Users can update matches in their tenant" ON public.matches
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = matches.championship_id
    )
  );

-- =====================================================
-- POLÍTICAS PARA GROUPS
-- =====================================================

-- Remover políticas existentes
DROP POLICY IF EXISTS "Super admins can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups in their championships" ON public.groups;
DROP POLICY IF EXISTS "Users can create groups in their championships" ON public.groups;
DROP POLICY IF EXISTS "Users can update groups in their championships" ON public.groups;

-- Criar novas políticas
CREATE POLICY "Super admins can view all groups" ON public.groups
  FOR SELECT USING (is_super_admin());

CREATE POLICY "Users can view groups in their championships" ON public.groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = groups.championship_id
    )
  );

CREATE POLICY "Users can create groups in their championships" ON public.groups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = groups.championship_id
    )
  );

CREATE POLICY "Users can update groups in their championships" ON public.groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = groups.championship_id
    )
  );

-- =====================================================
-- HABILITAR RLS NAS TABELAS
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- SCRIPT CONCLUÍDO
-- =====================================================
-- 
-- Agora você pode testar a criação de campeonatos!
-- As políticas RLS foram corrigidas para usar as relações corretas.
--