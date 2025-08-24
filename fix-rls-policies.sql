-- =====================================================
-- CORREÇÃO DAS POLÍTICAS RLS - RECURSÃO INFINITA
-- =====================================================

-- Criar uma função para verificar se o usuário é super admin sem recursão
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE auth_user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$;

-- Políticas para tenants
DROP POLICY IF EXISTS "Super admins can view all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Super admins can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can create tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view their tenant" ON public.tenants;

CREATE POLICY "Super admins can view all tenants" ON public.tenants
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all tenants" ON public.tenants
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can create tenants" ON public.tenants
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their tenant" ON public.tenants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND tenant_id = tenants.id
        )
    );

-- Políticas para users (sem recursão)
DROP POLICY IF EXISTS "Super admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;

CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all users" ON public.users
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Políticas para championships
DROP POLICY IF EXISTS "Super admins can view all championships" ON public.championships;
DROP POLICY IF EXISTS "Super admins can manage all championships" ON public.championships;
DROP POLICY IF EXISTS "Users can view championships in their tenant" ON public.championships;

CREATE POLICY "Super admins can view all championships" ON public.championships
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all championships" ON public.championships
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

-- Políticas para teams
DROP POLICY IF EXISTS "Super admins can view all teams" ON public.teams;
DROP POLICY IF EXISTS "Super admins can manage all teams" ON public.teams;
DROP POLICY IF EXISTS "Users can view teams in their tenant" ON public.teams;

CREATE POLICY "Super admins can view all teams" ON public.teams
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all teams" ON public.teams
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

-- Políticas para matches
DROP POLICY IF EXISTS "Super admins can view all matches" ON public.matches;
DROP POLICY IF EXISTS "Super admins can manage all matches" ON public.matches;
DROP POLICY IF EXISTS "Users can view matches in their tenant" ON public.matches;

CREATE POLICY "Super admins can view all matches" ON public.matches
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all matches" ON public.matches
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

-- Políticas para groups (se existir)
DROP POLICY IF EXISTS "Super admins can view all groups" ON public.groups;
DROP POLICY IF EXISTS "Super admins can manage all groups" ON public.groups;
DROP POLICY IF EXISTS "Users can view groups in their tenant" ON public.groups;

CREATE POLICY "Super admins can view all groups" ON public.groups
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all groups" ON public.groups
    FOR ALL USING (public.is_super_admin());

-- Habilitar RLS nas tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Criar um usuário super admin de teste
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'admin@rankhub.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now()
) ON CONFLICT (email) DO NOTHING;

-- Inserir o usuário na tabela public.users
INSERT INTO public.users (auth_user_id, email, name, role, tenant_id)
SELECT 
    au.id,
    'admin@rankhub.com',
    'Super Admin',
    'super_admin',
    NULL
FROM auth.users au
WHERE au.email = 'admin@rankhub.com'
ON CONFLICT (auth_user_id) DO UPDATE SET
    role = 'super_admin',
    name = 'Super Admin';

SELECT 'Políticas RLS corrigidas com sucesso!' as status;