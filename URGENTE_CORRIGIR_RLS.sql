-- =====================================================
-- SCRIPT URGENTE PARA CORRIGIR ACESSO AOS CAMPEONATOS
-- =====================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- As políticas RLS estão bloqueando COMPLETAMENTE o acesso aos dados
-- Mesmo super admins não conseguem ver campeonatos
--
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/kxhkspmlyxmhzqckyqvd/sql
--
-- =====================================================

-- 1. VERIFICAR ESTADO ATUAL DAS POLÍTICAS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'championships', 'teams', 'matches', 'tenants')
ORDER BY tablename, policyname;

-- 2. VERIFICAR SE RLS ESTÁ HABILITADO
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'championships', 'teams', 'matches', 'tenants');

-- 3. VERIFICAR SE A FUNÇÃO is_super_admin EXISTE
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'is_super_admin';

-- 4. REMOVER TODAS AS POLÍTICAS PROBLEMÁTICAS
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remove todas as políticas existentes
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'championships', 'teams', 'matches', 'tenants', 'groups')
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Removida política: % da tabela %', r.policyname, r.tablename;
    END LOOP;
END
$$;

-- 5. RECRIAR FUNÇÃO is_super_admin (CASO NÃO EXISTA)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'super_admin'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. CRIAR POLÍTICAS CORRIGIDAS

-- POLÍTICAS PARA USERS
CREATE POLICY "Super admin can view all users" ON public.users
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth_user_id = auth.uid());

CREATE POLICY "Super admin can manage all users" ON public.users
  FOR ALL USING (public.is_super_admin());

-- POLÍTICAS PARA CHAMPIONSHIPS
CREATE POLICY "Super admin can view all championships" ON public.championships
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all championships" ON public.championships
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view championships in their tenant" ON public.championships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = championships.tenant_id
    )
  );

CREATE POLICY "Users can create championships in their tenant" ON public.championships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = championships.tenant_id
    )
  );

CREATE POLICY "Users can update championships in their tenant" ON public.championships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = championships.tenant_id
    )
  );

-- POLÍTICAS PARA TEAMS
CREATE POLICY "Super admin can view all teams" ON public.teams
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all teams" ON public.teams
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view teams in their tenant" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = teams.championship_id
    )
  );

-- POLÍTICAS PARA MATCHES
CREATE POLICY "Super admin can view all matches" ON public.matches
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all matches" ON public.matches
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view matches in their tenant" ON public.matches
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = matches.championship_id
    )
  );

-- POLÍTICAS PARA TENANTS
CREATE POLICY "Super admin can view all tenants" ON public.tenants
  FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admin can manage all tenants" ON public.tenants
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view their own tenant" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE auth_user_id = auth.uid() 
      AND tenant_id = tenants.id
    )
  );

-- 7. VERIFICAR SE AS POLÍTICAS FORAM CRIADAS CORRETAMENTE
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'championships', 'teams', 'matches', 'tenants')
ORDER BY tablename, policyname;

-- 8. TESTAR ACESSO (EXECUTAR APÓS AS POLÍTICAS)
-- Esta consulta deve retornar dados se houver campeonatos
SELECT 
    id,
    nome,
    status,
    tenant_id,
    created_at
FROM public.championships
LIMIT 5;

-- 9. VERIFICAR USUÁRIOS SUPER ADMIN
SELECT 
    id,
    email,
    role,
    tenant_id
FROM public.users
WHERE role = 'super_admin';

-- =====================================================
-- INSTRUÇÕES FINAIS:
-- 1. Execute este script completo no Supabase SQL Editor
-- 2. Verifique se não há erros
-- 3. Teste o acesso na aplicação
-- 4. Se ainda houver problemas, execute apenas a seção 4 (remoção de políticas)
--    e depois recrie as políticas uma por uma
-- =====================================================