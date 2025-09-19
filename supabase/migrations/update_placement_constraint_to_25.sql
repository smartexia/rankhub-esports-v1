-- Atualizar constraint de placement para permitir até 100 posições
-- Problema: Sistema precisa suportar Squad (25), Duo (50) e Solo (100)

-- 1. Remover constraint atual
ALTER TABLE public.match_results 
DROP CONSTRAINT IF EXISTS match_results_placement_check;

-- 2. Adicionar nova constraint permitindo 1-100
ALTER TABLE public.match_results 
ADD CONSTRAINT match_results_placement_check 
CHECK (placement >= 1 AND placement <= 100);

-- 3. Atualizar comentário da coluna
COMMENT ON COLUMN public.match_results.placement IS 'Final placement in the match (1-100, varies by game mode)';

-- 4. Verificar se a constraint foi aplicada corretamente
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'match_results_placement_check';

-- Constraint de placement atualizada para permitir posições 1-100 (Squad: 25, Duo: 50, Solo: 100)