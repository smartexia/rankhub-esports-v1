-- =====================================================
-- PASSO 2: CRIAR POLÍTICAS E FUNÇÃO SUPER ADMIN
-- =====================================================
-- 
-- EXECUTE ESTE SCRIPT APÓS TER EXECUTADO O PASSO_1_ENUM.sql
-- E AGUARDADO PELO MENOS 10 SEGUNDOS
--
-- =====================================================

-- Criar políticas para super_admin ter acesso global

-- Super Admin pode ver todos os tenants
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
CREATE POLICY "Super admins can view all tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os tenants
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
CREATE POLICY "Super admins can manage all tenants" ON public.tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os usuários
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os usuários
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
CREATE POLICY "Super admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os campeonatos
DROP POLICY IF EXISTS "Super admins can view all championships" ON public.championships;
CREATE POLICY "Super admins can view all championships" ON public.championships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os campeonatos
DROP POLICY IF EXISTS "Super admins can manage all championships" ON public.championships;
CREATE POLICY "Super admins can manage all championships" ON public.championships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os grupos
DROP POLICY IF EXISTS "Super admins can view all groups" ON public.groups;
CREATE POLICY "Super admins can view all groups" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os grupos
DROP POLICY IF EXISTS "Super admins can manage all groups" ON public.groups;
CREATE POLICY "Super admins can manage all groups" ON public.groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os times
DROP POLICY IF EXISTS "Super admins can view all teams" ON public.teams;
CREATE POLICY "Super admins can view all teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os times
DROP POLICY IF EXISTS "Super admins can manage all teams" ON public.teams;
CREATE POLICY "Super admins can manage all teams" ON public.teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todas as partidas
DROP POLICY IF EXISTS "Super admins can view all matches" ON public.matches;
CREATE POLICY "Super admins can view all matches" ON public.matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todas as partidas
DROP POLICY IF EXISTS "Super admins can manage all matches" ON public.matches;
CREATE POLICY "Super admins can manage all matches" ON public.matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os resultados
DROP POLICY IF EXISTS "Super admins can view all results" ON public.results;
CREATE POLICY "Super admins can view all results" ON public.results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os resultados
DROP POLICY IF EXISTS "Super admins can manage all results" ON public.results;
CREATE POLICY "Super admins can manage all results" ON public.results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todas as evidências
DROP POLICY IF EXISTS "Super admins can view all print evidence" ON public.print_evidence;
CREATE POLICY "Super admins can view all print evidence" ON public.print_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todas as evidências
DROP POLICY IF EXISTS "Super admins can manage all print evidence" ON public.print_evidence;
CREATE POLICY "Super admins can manage all print evidence" ON public.print_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Função para promover um usuário a super_admin
CREATE OR REPLACE FUNCTION public.promote_to_super_admin(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.users 
    SET role = 'super_admin'
    WHERE email = user_email;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário explicativo
COMMENT ON FUNCTION public.promote_to_super_admin(TEXT) IS 
'Função para promover um usuário a super_admin. Use com cuidado!';

-- =====================================================
-- PASSO 3: PROMOVER SEU USUÁRIO A SUPER ADMIN
-- =====================================================
-- 
-- SUBSTITUA 'SEU_EMAIL_AQUI' PELO SEU EMAIL REAL:
-- 
-- SELECT public.promote_to_super_admin('SEU_EMAIL_AQUI');
-- 
-- OU MANUALMENTE:
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'SEU_EMAIL_AQUI';
-- 
-- =====================================================
-- VERIFICAR SE DEU CERTO:
-- =====================================================
-- 
-- SELECT email, role FROM public.users WHERE role = 'super_admin';
-- 
-- =====================================================