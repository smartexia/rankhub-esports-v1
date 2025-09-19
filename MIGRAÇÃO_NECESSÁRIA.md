# 🚨 MIGRAÇÃO DE BANCO DE DADOS NECESSÁRIA

## Problema Identificado
O erro que você está vendo indica que as colunas necessárias para os novos recursos de torneio não existem na tabela `championships` do banco de dados.

## Solução

### Passo 1: Acesse o Painel do Supabase
1. Abra seu navegador
2. Acesse: https://supabase.com/dashboard/project/kxhkspmlyxmhzqckyqvd
3. Faça login na sua conta

### Passo 2: Abra o SQL Editor
1. No painel lateral esquerdo, clique em **"SQL Editor"**
2. Clique em **"New query"** para criar uma nova consulta

### Passo 3: Execute o Script de Migração
1. Abra o arquivo `fix_championships_columns.sql` (está na raiz do projeto)
2. Copie todo o conteúdo do arquivo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"** para executar

### Passo 4: Verifique se Funcionou
1. Volte ao terminal
2. Execute: `node test_new_columns.js`
3. Você deve ver: ✅ "A coluna configuracao_avancada existe!"

## Script SQL (Conteúdo do arquivo fix_championships_columns.sql)

```sql
-- Script para corrigir colunas faltantes na tabela championships
-- Execute este script no SQL Editor do Supabase

-- Adicionar campos para formatos de torneio
ALTER TABLE public.championships 
ADD COLUMN IF NOT EXISTS formato_torneio TEXT DEFAULT 'simples' CHECK (formato_torneio IN ('simples', 'grupos', 'eliminatorio', 'misto')),
ADD COLUMN IF NOT EXISTS numero_fases INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS configuracao_fases JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS numero_grupos INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS times_por_grupo INTEGER DEFAULT 25,
ADD COLUMN IF NOT EXISTS configuracao_avancada JSONB DEFAULT '{}'::jsonb;

-- Comentários para documentar os novos campos
COMMENT ON COLUMN public.championships.formato_torneio IS 'Formato do torneio: simples, grupos, eliminatorio, misto';
COMMENT ON COLUMN public.championships.numero_fases IS 'Número total de fases do torneio';
COMMENT ON COLUMN public.championships.configuracao_fases IS 'Configuração detalhada de cada fase em JSON';
COMMENT ON COLUMN public.championships.numero_grupos IS 'Número de grupos no torneio';
COMMENT ON COLUMN public.championships.times_por_grupo IS 'Número máximo de times por grupo';
COMMENT ON COLUMN public.championships.configuracao_avancada IS 'Configurações avançadas específicas do formato';
```

## Após a Migração

Depois de executar a migração com sucesso:

1. ✅ O erro "configuracao_avancada column does not exist" será resolvido
2. ✅ Você poderá criar campeonatos normalmente
3. ✅ Os novos recursos de torneio estarão disponíveis

## Precisa de Ajuda?

Se encontrar algum problema:
1. Verifique se você tem permissões de administrador no projeto Supabase
2. Certifique-se de que copiou o script SQL completo
3. Execute `node test_new_columns.js` para verificar o status

---

**Nota**: Esta migração é segura e não afetará dados existentes. As novas colunas têm valores padrão apropriados.