-- Adicionar super_admin ao enum app_role
ALTER TYPE public.app_role ADD VALUE 'super_admin';

-- Criar políticas para super_admin ter acesso global

-- Super Admin pode ver todos os tenants
CREATE POLICY "Super admins can view all tenants" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os tenants
CREATE POLICY "Super admins can manage all tenants" ON public.tenants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os usuários
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os usuários
CREATE POLICY "Super admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os campeonatos
CREATE POLICY "Super admins can view all championships" ON public.championships
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os campeonatos
CREATE POLICY "Super admins can manage all championships" ON public.championships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os grupos
CREATE POLICY "Super admins can view all groups" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os grupos
CREATE POLICY "Super admins can manage all groups" ON public.groups
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os times
CREATE POLICY "Super admins can view all teams" ON public.teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os times
CREATE POLICY "Super admins can manage all teams" ON public.teams
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todas as partidas
CREATE POLICY "Super admins can view all matches" ON public.matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todas as partidas
CREATE POLICY "Super admins can manage all matches" ON public.matches
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todos os resultados
CREATE POLICY "Super admins can view all results" ON public.results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todos os resultados
CREATE POLICY "Super admins can manage all results" ON public.results
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode ver todas as evidências
CREATE POLICY "Super admins can view all print evidence" ON public.print_evidence
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Super Admin pode gerenciar todas as evidências
CREATE POLICY "Super admins can manage all print evidence" ON public.print_evidence
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Função para promover um usuário a super_admin (apenas para uso manual)
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
'Função para promover um usuário a super_admin. Use com cuidado: SELECT public.promote_to_super_admin(''seu-email@exemplo.com'');';