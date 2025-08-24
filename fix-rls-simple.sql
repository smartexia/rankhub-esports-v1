-- =====================================================
-- SCRIPT SIMPLIFICADO - REMOVE TODAS AS POLÍTICAS PRIMEIRO
-- =====================================================

-- Remover TODAS as políticas existentes primeiro
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Remove todas as políticas da tabela users
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.users';
    END LOOP;
    
    -- Remove todas as políticas da tabela championships
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'championships' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.championships';
    END LOOP;
    
    -- Remove todas as políticas da tabela teams
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'teams' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.teams';
    END LOOP;
    
    -- Remove todas as políticas da tabela matches
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'matches' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.matches';
    END LOOP;
    
    -- Remove todas as políticas da tabela groups
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.groups';
    END LOOP;
END
$$;

-- Criar função para verificar super admin sem recursão
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

-- Políticas para users
CREATE POLICY "Super admins can view all users" ON public.users
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all users" ON public.users
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth_user_id = auth.uid());

-- Políticas para championships
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

-- Políticas para teams
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

-- Políticas para matches
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

-- Políticas para groups
CREATE POLICY "Super admins can view all groups" ON public.groups
    FOR SELECT USING (public.is_super_admin());

CREATE POLICY "Super admins can manage all groups" ON public.groups
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view groups in their tenant" ON public.groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.championships c ON c.tenant_id = u.tenant_id
            WHERE u.auth_user_id = auth.uid() 
            AND c.id = groups.championship_id
        )
    );

-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Criar usuário super admin de teste na tabela public.users
-- IMPORTANTE: Você precisa criar o usuário no Supabase Auth primeiro!
-- Vá em Authentication > Users no painel do Supabase e crie um usuário com email: admin@rankhub.com
-- Depois execute este script para criar o registro correspondente na tabela public.users

-- Inserir na tabela public.users usando o UUID real do usuário criado no Supabase Auth
INSERT INTO public.users (auth_user_id, email, nome_usuario, role, tenant_id)
SELECT 
    au.id,
    'admin@rankhub.com',
    'Super Admin',
    'super_admin',
    NULL
FROM auth.users au
WHERE au.email = 'admin@rankhub.com'
ON CONFLICT (email) DO UPDATE SET
    role = 'super_admin',
    nome_usuario = 'Super Admin',
    auth_user_id = EXCLUDED.auth_user_id;

SELECT 'Políticas RLS corrigidas com sucesso!' as status;