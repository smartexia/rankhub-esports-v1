-- Script para verificar e corrigir dados de tipo_campeonato
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar os tipos de campeonato existentes
SELECT 
    id,
    nome,
    tipo_campeonato,
    status,
    created_at
FROM public.championships 
ORDER BY created_at DESC;

-- 2. Verificar se há campeonatos com tipo_campeonato NULL
SELECT COUNT(*) as campeonatos_sem_tipo
FROM public.championships 
WHERE tipo_campeonato IS NULL;

-- 3. Atualizar campeonatos sem tipo para 'individual' (se necessário)
UPDATE public.championships 
SET tipo_campeonato = 'individual'
WHERE tipo_campeonato IS NULL;

-- 4. Verificar se há algum campeonato do tipo 'duplas'
SELECT COUNT(*) as campeonatos_duplas
FROM public.championships 
WHERE tipo_campeonato = 'duplas';

-- 5. Para teste: criar um campeonato de duplas (descomente se necessário)
/*
INSERT INTO public.championships (
    tenant_id,
    nome,
    tipo_campeonato,
    status,
    descricao
) VALUES (
    (SELECT id FROM public.tenants LIMIT 1),
    'Teste Campeonato DUO',
    'duplas',
    'rascunho',
    'Campeonato de teste para duplas'
);
*/