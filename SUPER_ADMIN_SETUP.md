# Configuração do Super Admin - RankHub

## Visão Geral

O sistema Super Admin foi implementado para permitir que o dono do sistema (você) tenha acesso completo a todos os tenants, usuários e dados do RankHub.

## Funcionalidades do Super Admin

### Permissões Globais
- ✅ Visualizar todos os tenants do sistema
- ✅ Visualizar todos os usuários de todos os tenants
- ✅ Gerenciar roles de qualquer usuário
- ✅ Acessar todos os campeonatos, grupos, times e partidas
- ✅ Visualizar estatísticas globais do sistema
- ✅ Bypass completo das restrições de tenant

### Interface do Painel
- **URL de Acesso**: `/super-admin`
- **Estatísticas**: Total de tenants, usuários e managers
- **Gerenciamento de Usuários**: Busca, filtros e alteração de roles
- **Visualização de Tenants**: Lista completa com informações detalhadas

## Passos para Implementação

### 1. Aplicar a Migração do Banco de Dados

```bash
# No diretório do projeto
npx supabase db push
```

Ou execute manualmente no SQL Editor do Supabase:
```sql
-- Conteúdo do arquivo: supabase/migrations/20250823200000_add_super_admin_role.sql
```

### 2. Promover seu Usuário a Super Admin

Após fazer login no sistema pela primeira vez, execute no SQL Editor do Supabase:

```sql
-- Substitua 'seu-email@exemplo.com' pelo seu email real
SELECT public.promote_to_super_admin('seu-email@exemplo.com');
```

**Alternativa manual:**
```sql
-- Encontre seu user_id primeiro
SELECT id, email, role FROM public.users WHERE email = 'seu-email@exemplo.com';

-- Depois promova a super_admin
UPDATE public.users 
SET role = 'super_admin' 
WHERE email = 'seu-email@exemplo.com';
```

### 3. Acessar o Painel Super Admin

1. Faça login no sistema normalmente
2. Navegue para: `http://localhost:5173/super-admin`
3. Você terá acesso completo a todos os dados

## Segurança e Boas Práticas

### ⚠️ Importantes Considerações de Segurança

1. **Acesso Restrito**: Apenas você deve ter a role `super_admin`
2. **Não Compartilhar**: Nunca compartilhe as credenciais de super admin
3. **Logs de Auditoria**: Considere implementar logs para ações de super admin
4. **Backup Regular**: Mantenha backups regulares antes de fazer alterações

### 🔒 Políticas de Segurança Implementadas

- **RLS (Row Level Security)**: Todas as políticas verificam a role `super_admin`
- **Verificação de Autenticação**: Usa `auth.uid()` para validar identidade
- **Isolamento de Dados**: Super admin bypassa restrições de tenant
- **Função Segura**: `promote_to_super_admin` usa `SECURITY DEFINER`

## Estrutura de Roles do Sistema

| Role | Descrição | Acesso |
|------|-----------|--------|
| `super_admin` | **Dono do Sistema** | Global - Todos os tenants |
| `manager` | Administrador do Tenant | Apenas seu tenant |
| `co-manager` | Co-administrador | Apenas seu tenant |
| `team-captain` | Capitão de Time | Apenas seu tenant |
| `player` | Jogador | Apenas seu tenant |
| `viewer` | Visualizador | Apenas seu tenant |

## Funcionalidades do Painel Super Admin

### Dashboard Principal
- **Estatísticas Globais**: Contadores de tenants, usuários e managers
- **Navegação por Abas**: Usuários e Tenants
- **Busca Avançada**: Por email, nome ou tenant
- **Filtros**: Por role de usuário

### Gerenciamento de Usuários
- **Visualização Completa**: Todos os usuários de todos os tenants
- **Alteração de Roles**: Dropdown para mudar role de qualquer usuário
- **Informações Detalhadas**: Email, nome, tenant, data de criação
- **Badges Coloridas**: Identificação visual das roles

### Gerenciamento de Tenants
- **Lista Completa**: Todos os tenants do sistema
- **Informações Técnicas**: IDs, manager_id, contagem de usuários
- **Datas de Criação**: Histórico de criação dos tenants

## Troubleshooting

### Problema: "Acesso Negado"
**Solução**: Verifique se sua role foi atualizada corretamente:
```sql
SELECT email, role FROM public.users WHERE email = 'seu-email@exemplo.com';
```

### Problema: Página não carrega
**Solução**: Verifique se a migração foi aplicada:
```sql
SELECT unnest(enum_range(NULL::app_role));
-- Deve incluir 'super_admin'
```

### Problema: Não consegue alterar roles
**Solução**: Verifique as políticas RLS:
```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

## Próximos Passos Recomendados

1. **Implementar Logs de Auditoria**: Rastrear ações de super admin
2. **Dashboard de Analytics**: Métricas avançadas do sistema
3. **Backup Automatizado**: Sistema de backup dos dados
4. **Notificações**: Alertas para atividades importantes
5. **Relatórios**: Geração de relatórios do sistema

## Suporte

Se encontrar problemas na implementação:
1. Verifique os logs do console do navegador
2. Confirme se a migração foi aplicada corretamente
3. Valide se sua role está definida como `super_admin`
4. Teste as políticas RLS no SQL Editor

---

**Importante**: Este sistema dá acesso completo a todos os dados. Use com responsabilidade e mantenha as credenciais seguras.