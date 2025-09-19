-- Reverter políticas RLS para permitir delete de campeonatos por qualquer usuário autenticado
-- Esta migração remove as restrições de super_admin e permite delete baseado apenas em tenant_id

-- Remover política restritiva de super_admin
DROP POLICY IF EXISTS "Only super admins can delete championships" ON public.championships;
DROP POLICY IF EXISTS "Super admins can delete championships" ON public.championships;

-- Criar política mais permissiva para DELETE de campeonatos
-- Qualquer usuário autenticado do mesmo tenant pode deletar campeonatos
CREATE POLICY "Authenticated users can delete championships" ON public.championships
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND tenant_id = championships.tenant_id
        )
    );

-- Verificar se a política foi criada corretamente
-- Esta query pode ser executada manualmente para verificar:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename = 'championships' AND cmd = 'DELETE';

-- Log da migração
INSERT INTO public.migration_logs (migration_name, description, executed_at)
VALUES (
    '20250127000001_revert_championship_delete_restrictions',
    'Revertida política RLS para permitir delete de campeonatos por qualquer usuário autenticado do mesmo tenant',
    NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- Comentário explicativo
COMMENT ON POLICY "Authenticated users can delete championships" ON public.championships IS 
'Política que permite qualquer usuário autenticado do mesmo tenant deletar campeonatos. Mantém isolamento por tenant mas remove restrições de role específico.';