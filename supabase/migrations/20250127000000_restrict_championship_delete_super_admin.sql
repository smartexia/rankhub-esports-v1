-- Política RLS para restringir delete de campeonatos apenas para super_admin
-- Esta migração adiciona uma política específica para operações DELETE na tabela championships

-- Remover política de delete existente se houver
DROP POLICY IF EXISTS "Super admins can delete championships" ON public.championships;
DROP POLICY IF EXISTS "Users can delete own championships" ON public.championships;
DROP POLICY IF EXISTS "Tenant users can delete championships" ON public.championships;

-- Criar política específica para DELETE de campeonatos
-- Apenas super_admin pode deletar campeonatos
CREATE POLICY "Only super admins can delete championships" ON public.championships
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE auth_user_id = auth.uid() 
            AND role = 'super_admin'
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
    '20250127000000_restrict_championship_delete_super_admin',
    'Adicionada política RLS para restringir delete de campeonatos apenas para super_admin',
    NOW()
) ON CONFLICT (migration_name) DO NOTHING;

-- Comentário explicativo
COMMENT ON POLICY "Only super admins can delete championships" ON public.championships IS 
'Política de segurança que permite apenas usuários com role super_admin deletar campeonatos. Esta é uma medida de proteção para evitar exclusões acidentais ou não autorizadas de dados críticos.'