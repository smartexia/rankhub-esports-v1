-- Verificar e corrigir políticas RLS para match_results
-- Problema: new row violates row-level security policy for table "match_results"

-- 1. Verificar políticas existentes
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
WHERE tablename = 'match_results';

-- 2. Verificar permissões da tabela
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'match_results'
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;

-- 3. Garantir permissões básicas para roles
GRANT SELECT, INSERT, UPDATE, DELETE ON match_results TO authenticated;
GRANT SELECT ON match_results TO anon;

-- 4. Criar política para INSERT (permitir usuários autenticados com tenant_id válido)
DROP POLICY IF EXISTS "Users can insert match results for their tenant" ON match_results;

CREATE POLICY "Users can insert match results for their tenant" 
ON match_results 
FOR INSERT 
TO authenticated 
WITH CHECK (
    -- Verificar se o tenant_id do resultado corresponde ao tenant_id do usuário
    tenant_id IN (
        SELECT u.tenant_id 
        FROM users u 
        WHERE u.auth_user_id = auth.uid()
    )
);

-- 5. Criar política para SELECT (permitir usuários ver resultados do seu tenant)
DROP POLICY IF EXISTS "Users can view match results for their tenant" ON match_results;

CREATE POLICY "Users can view match results for their tenant" 
ON match_results 
FOR SELECT 
TO authenticated 
USING (
    tenant_id IN (
        SELECT u.tenant_id 
        FROM users u 
        WHERE u.auth_user_id = auth.uid()
    )
);

-- 6. Criar política para UPDATE (permitir usuários atualizar resultados do seu tenant)
DROP POLICY IF EXISTS "Users can update match results for their tenant" ON match_results;

CREATE POLICY "Users can update match results for their tenant" 
ON match_results 
FOR UPDATE 
TO authenticated 
USING (
    tenant_id IN (
        SELECT u.tenant_id 
        FROM users u 
        WHERE u.auth_user_id = auth.uid()
    )
)
WITH CHECK (
    tenant_id IN (
        SELECT u.tenant_id 
        FROM users u 
        WHERE u.auth_user_id = auth.uid()
    )
);

-- 7. Criar política para DELETE (permitir usuários deletar resultados do seu tenant)
DROP POLICY IF EXISTS "Users can delete match results for their tenant" ON match_results;

CREATE POLICY "Users can delete match results for their tenant" 
ON match_results 
FOR DELETE 
TO authenticated 
USING (
    tenant_id IN (
        SELECT u.tenant_id 
        FROM users u 
        WHERE u.auth_user_id = auth.uid()
    )
);

-- 8. Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'match_results';

-- 9. Comentário de debug
COMMENT ON TABLE match_results IS 'Stores processed match results from AI analysis of match screenshots. RLS policies updated to fix tenant_id validation.';