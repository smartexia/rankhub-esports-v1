# Correção do Erro: Column teams.tenant_id does not exist

## 🚨 Problema Identificado

O erro `42703: column teams.tenant_id does not exist` ocorreu porque as políticas RLS (Row Level Security) estavam tentando acessar uma coluna `tenant_id` que não existe na tabela `teams`.

## 🔍 Análise do Problema

### Estrutura Real das Tabelas:

1. **teams**: Não possui `tenant_id` diretamente
   - Relaciona-se com `championships` através de `championship_id`
   
2. **championships**: Possui `tenant_id`
   - Relaciona-se com `tenants` através de `tenant_id`

3. **matches**: Não possui `tenant_id` diretamente
   - Relaciona-se com `championships` através de `championship_id`

### Relação Correta:
```
users.tenant_id → tenants.id
championships.tenant_id → tenants.id
teams.championship_id → championships.id
matches.championship_id → championships.id
groups.championship_id → championships.id
```

## ✅ Solução Implementada

### 1. Políticas RLS Corrigidas

As políticas foram corrigidas para usar JOINs adequados:

**Antes (INCORRETO):**
```sql
CREATE POLICY "Users can view teams in their tenant" ON public.teams
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.users WHERE auth_user_id = auth.uid()
  ));
```

**Depois (CORRETO):**
```sql
CREATE POLICY "Users can view teams in their tenant" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.championships c ON c.tenant_id = u.tenant_id
      WHERE u.auth_user_id = auth.uid() 
      AND c.id = teams.championship_id
    )
  );
```

### 2. Arquivo Corrigido Criado

📁 **`fix-rls-policies-corrected.sql`** - Script corrigido pronto para execução

## 🚀 Como Aplicar a Correção

### Passo 1: Acessar o Supabase
1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Vá para seu projeto: `kxhkspmlyxmhzqckyqvd`
3. Navegue para **"SQL Editor"**

### Passo 2: Executar o Script
1. Abra o arquivo `fix-rls-policies-corrected.sql`
2. Copie todo o conteúdo
3. Cole no SQL Editor do Supabase
4. Clique em **"Run"**

### Passo 3: Verificar
1. Teste a criação de um campeonato
2. Verifique se não há mais erros de `tenant_id`

## 📋 Políticas Corrigidas

### ✅ Tabelas com Políticas Atualizadas:
- **users** - Acesso direto ao `tenant_id`
- **tenants** - Acesso direto via `manager_id`
- **championships** - Acesso direto ao `tenant_id`
- **teams** - Acesso via JOIN com `championships`
- **matches** - Acesso via JOIN com `championships`
- **groups** - Acesso via JOIN com `championships`

### 🔐 Tipos de Políticas Implementadas:
- **SELECT** - Visualização de dados
- **INSERT** - Criação de novos registros
- **UPDATE** - Atualização de registros existentes
- **Super Admin** - Acesso total a todos os dados

## 🎯 Resultado Esperado

Após aplicar esta correção:

1. ✅ Usuários podem criar campeonatos em seus tenants
2. ✅ Usuários podem criar times em seus campeonatos
3. ✅ Usuários podem criar partidas em seus campeonatos
4. ✅ Super admins têm acesso total a todos os dados
5. ✅ Isolamento de dados por tenant funciona corretamente

## 🔧 Arquivos Modificados

- `fix-rls-policies-corrected.sql` - **NOVO** - Script corrigido
- `fix-rls-policies.sql` - **ATUALIZADO** - Versão anterior com correções parciais
- `CreateChampionshipDialog.tsx` - **MANTIDO** - Lógica de criação automática de tenant

---

**⚠️ Importante:** Execute apenas o arquivo `fix-rls-policies-corrected.sql` no Supabase para aplicar todas as correções de uma vez.