-- Script para atualizar tags existentes para o formato correto (EQUIPE1, EQUIPE2, etc)
-- Este script deve ser executado no Supabase SQL Editor

-- Primeiro, vamos ver as tags atuais
SELECT id, nome_time, tag, championship_id, created_at 
FROM teams 
WHERE tag IS NOT NULL 
ORDER BY championship_id, created_at;

-- Atualizar tags que estão no formato "Equipe1", "Equipe2", etc para "EQUIPE1", "EQUIPE2", etc
UPDATE teams 
SET tag = UPPER(tag) 
WHERE tag ILIKE 'equipe%' 
AND tag ~ '^[Ee]quipe[0-9]+$';

-- Para times que não têm tag, gerar automaticamente baseado na posição no campeonato
WITH numbered_teams AS (
  SELECT 
    id,
    championship_id,
    ROW_NUMBER() OVER (PARTITION BY championship_id ORDER BY created_at) as team_number
  FROM teams 
  WHERE tag IS NULL OR tag = ''
)
UPDATE teams 
SET tag = 'EQUIPE' || numbered_teams.team_number
FROM numbered_teams 
WHERE teams.id = numbered_teams.id;

-- Verificar o resultado
SELECT id, nome_time, tag, championship_id, created_at 
FROM teams 
ORDER BY championship_id, created_at;

-- Verificar se há duplicatas de tags no mesmo campeonato
SELECT championship_id, tag, COUNT(*) as count
FROM teams 
WHERE tag IS NOT NULL
GROUP BY championship_id, tag
HAVING COUNT(*) > 1
ORDER BY championship_id, tag;