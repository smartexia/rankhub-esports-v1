# 🚀 Como Configurar o Super Admin - Guia Passo a Passo

## ❌ Problema Encontrado

O erro que você viu acontece porque o PostgreSQL/Supabase não permite usar novos valores de ENUM na mesma transação em que foram criados. É uma limitação do banco de dados.

```
ERROR: 55P04: unsafe use of new value "super_admin" of enum type app_role
HINT: New enum values must be committed before they can be used.
```

## ✅ Solução: Executar em Etapas

Dividi o script em **2 arquivos separados** para resolver esse problema:

### 📋 **PASSO 1: Adicionar o Enum**

1. Acesse o **SQL Editor** do Supabase
2. Abra o arquivo: `PASSO_1_ENUM.sql`
3. **Copie e cole** apenas esta linha:

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
```

4. **Execute** e aguarde a confirmação
5. ⏰ **AGUARDE 10 SEGUNDOS** (importante!)

### 📋 **PASSO 2: Criar Políticas e Função**

1. **Abra uma nova aba** do SQL Editor (ou aguarde mais alguns segundos)
2. Abra o arquivo: `PASSO_2_POLITICAS.sql`
3. **Copie e cole todo o conteúdo**
4. **Execute** o script completo

### 📋 **PASSO 3: Promover seu Usuário**

No final do `PASSO_2_POLITICAS.sql`, execute uma destas opções:

**Opção A - Usando a função:**
```sql
SELECT public.promote_to_super_admin('seu-email@exemplo.com');
```

**Opção B - Diretamente:**
```sql
UPDATE public.users SET role = 'super_admin' WHERE email = 'seu-email@exemplo.com';
```

### 📋 **PASSO 4: Verificar se Funcionou**

```sql
SELECT email, role FROM public.users WHERE role = 'super_admin';
```

## 🎯 **Por que Dividir em Etapas?**

- **Transação Separada**: O PostgreSQL precisa "commitar" o novo valor do enum antes de usá-lo
- **Segurança**: Evita erros de referência circular
- **Confiabilidade**: Garante que cada etapa seja executada corretamente

## 🔧 **Após a Configuração**

1. **Faça login** no sistema
2. O link **"Painel Super Admin"** aparecerá automaticamente na sidebar
3. **Acesse** `/super-admin` para gerenciar todo o sistema
4. **Gerencie** todos os usuários e tenants

## 🆘 **Troubleshooting**

**Se ainda der erro:**
- Aguarde mais tempo entre os passos (até 30 segundos)
- Feche e abra uma nova aba do SQL Editor
- Execute cada comando individualmente

**Se o link não aparecer:**
- Verifique se seu usuário foi promovido: `SELECT role FROM users WHERE email = 'seu-email'`
- Faça logout e login novamente
- Limpe o cache do navegador

---

✅ **Agora você pode executar os scripts sem erro!**