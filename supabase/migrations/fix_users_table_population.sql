-- Corrigir problema: usuários não estão sendo criados na tabela users
-- Problema: tenant_id não encontrado porque tabela users está vazia

-- 1. Criar função para inserir usuário na tabela users automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Inserir novo usuário na tabela users quando criado no auth
  INSERT INTO public.users (
    auth_user_id,
    email,
    nome_usuario,
    role,
    tenant_id,
    data_cadastro
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'viewer',
    NULL, -- tenant_id será definido posteriormente
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para executar a função quando usuário é criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Popular usuários existentes do auth.users para public.users
-- (caso existam usuários no auth que não estão na tabela users)
INSERT INTO public.users (
  auth_user_id,
  email,
  nome_usuario,
  role,
  tenant_id,
  data_cadastro
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
  'viewer',
  NULL, -- tenant_id será definido posteriormente
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON pu.auth_user_id = au.id
WHERE pu.id IS NULL; -- Apenas usuários que não existem na tabela users

-- 4. Verificar se existe pelo menos um tenant para associar usuários
DO $$
DECLARE
  default_tenant_id UUID;
  user_count INTEGER;
BEGIN
  -- Verificar se existem tenants
  SELECT id INTO default_tenant_id 
  FROM tenants 
  ORDER BY data_criacao ASC 
  LIMIT 1;
  
  -- Se existe tenant, associar usuários sem tenant_id
  IF default_tenant_id IS NOT NULL THEN
    UPDATE public.users 
    SET tenant_id = default_tenant_id 
    WHERE tenant_id IS NULL;
    
    GET DIAGNOSTICS user_count = ROW_COUNT;
    RAISE NOTICE 'Associados % usuários ao tenant padrão: %', user_count, default_tenant_id;
  ELSE
    RAISE NOTICE 'Nenhum tenant encontrado. Usuários criados sem tenant_id.';
  END IF;
END $$;

-- 5. Verificar resultado
SELECT 
  COUNT(*) as total_users,
  COUNT(tenant_id) as users_with_tenant,
  COUNT(*) - COUNT(tenant_id) as users_without_tenant
FROM public.users;

-- 6. Mostrar usuários criados
SELECT 
  id,
  email,
  nome_usuario,
  role,
  tenant_id,
  auth_user_id,
  data_cadastro
FROM public.users
ORDER BY data_cadastro DESC;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user in public.users table when auth user is created';
COMMENT ON TABLE public.users IS 'User profiles with tenant association. Auto-populated from auth.users via trigger.';