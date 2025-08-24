# 🚀 RankHub v1 - Guia de Deploy

## 📋 Visão Geral

Este guia fornece instruções detalhadas para fazer o deploy do RankHub v1 em produção usando Coolify.

## 🔧 Pré-requisitos

### 1. Ambiente de Desenvolvimento
- Node.js 18+ instalado
- npm ou yarn
- Git configurado
- Docker (opcional, para testes locais)

### 2. Serviços Externos
- **Supabase**: Projeto configurado com banco de dados
- **Coolify**: Servidor com Coolify instalado
- **Domínio**: Domínio personalizado (opcional)

## 🏗️ Preparação do Projeto

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Variáveis obrigatórias:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_URL=https://seu-dominio.com
```

### 2. Validar Configuração Local

```bash
# Instalar dependências
npm install

# Executar linting
npm run lint

# Verificar tipos
npm run type-check

# Testar build de produção
npm run build:prod

# Testar preview local
npm run preview
```

### 3. Testar Build Docker (Opcional)

```bash
# Build da imagem
npm run docker:build

# Executar container
npm run docker:run

# Testar em http://localhost
```

## 🌐 Configuração do Supabase

### 1. Políticas RLS

Verifique se as políticas RLS estão ativas:

```sql
-- Verificar RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. CORS Configuration

1. Acesse o painel Supabase
2. Vá para **Settings** → **API**
3. Em **CORS origins**, adicione:
   - `http://localhost:5173` (desenvolvimento)
   - `https://seu-dominio.com` (produção)

### 3. Verificar Conectividade

```bash
# Testar conexão com Supabase
curl -H "apikey: SUA_CHAVE_ANON" \
     -H "Authorization: Bearer SUA_CHAVE_ANON" \
     "https://seu-projeto.supabase.co/rest/v1/championships"
```

## 🚀 Deploy no Coolify

### 1. Criar Projeto no Coolify

1. Acesse seu painel Coolify
2. Clique em **"New Resource"** → **"Application"**
3. Selecione **"Git Repository"**
4. Configure:
   - **Repository**: `https://github.com/smartexia/rankhub-esports-v1.git`
   - **Branch**: `main`
   - **Build Pack**: `Docker`

### 2. Configurar Build Settings

```yaml
# Build Command (se não usar Docker)
npm run build:prod

# Start Command (se não usar Docker)
nginx -g 'daemon off;'

# Port
80

# Health Check Path
/health
```

### 3. Configurar Variáveis de Ambiente

No painel do Coolify, adicione:

```
NODE_ENV=production
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_TITLE=RankHub
VITE_APP_DESCRIPTION=Sistema de Gestão de Campeonatos de Esports
VITE_APP_URL=https://seu-dominio.com
```

### 4. Configurar Domínio

1. Vá para **"Domains"** no seu projeto
2. Adicione seu domínio personalizado
3. Configure SSL automático
4. Aguarde a propagação DNS (pode levar até 24h)

### 5. Deploy Automático

1. Vá para **"Settings"** → **"Webhooks"**
2. Ative **"Auto Deploy on Push"**
3. Configure para a branch `main`

## 🔍 Verificação Pós-Deploy

### 1. Health Check

```bash
# Verificar se a aplicação está rodando
curl https://seu-dominio.com/health

# Resposta esperada: "healthy"
```

### 2. Funcionalidades Principais

- [ ] Página inicial carrega
- [ ] Login/logout funciona
- [ ] Listagem de campeonatos
- [ ] Criação de campeonatos
- [ ] Navegação entre páginas
- [ ] Responsividade mobile

### 3. Performance

```bash
# Testar tempo de resposta
curl -w "@curl-format.txt" -o /dev/null -s https://seu-dominio.com

# Verificar compressão gzip
curl -H "Accept-Encoding: gzip" -I https://seu-dominio.com
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Build Falha

```bash
# Verificar logs no Coolify
# Possíveis causas:
# - Variáveis de ambiente não configuradas
# - Dependências em falta
# - Erro de sintaxe no código
```

**Solução:**
- Verificar todas as variáveis de ambiente
- Executar `npm run build:prod` localmente
- Verificar logs de build no Coolify

#### 2. Erro 404 em Rotas

**Causa:** Configuração incorreta do nginx para SPA

**Solução:**
- Verificar se `nginx.conf` está correto
- Confirmar se `try_files $uri $uri/ /index.html;` está presente

#### 3. Erro de Conexão com Supabase

**Possíveis causas:**
- URLs ou chaves incorretas
- CORS não configurado
- Políticas RLS bloqueando acesso

**Solução:**
```bash
# Verificar variáveis
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Testar conectividade
curl -I https://seu-projeto.supabase.co
```

#### 4. Performance Lenta

**Otimizações:**
- Verificar se gzip está ativo
- Confirmar cache de assets estáticos
- Monitorar uso de CPU/memória
- Otimizar imagens e bundles

### Logs e Monitoramento

```bash
# Ver logs da aplicação
docker logs -f container_name

# Monitorar recursos
docker stats container_name

# Verificar status do container
docker ps | grep rankhub
```

## 📊 Monitoramento Contínuo

### 1. Health Checks

- **Endpoint**: `/health`
- **Frequência**: A cada 30 segundos
- **Timeout**: 10 segundos

### 2. Métricas Importantes

- Tempo de resposta < 2s
- Uptime > 99.9%
- Uso de memória < 80%
- Uso de CPU < 70%

### 3. Alertas Recomendados

- Health check falhando
- Alto uso de recursos
- Erros 5xx frequentes
- Tempo de resposta elevado

## 🔄 Atualizações e Manutenção

### Deploy de Atualizações

```bash
# 1. Fazer alterações no código
# 2. Testar localmente
npm run build:prod
npm run preview

# 3. Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 4. Deploy automático via webhook
```

### Rollback

```bash
# No Coolify, vá para "Deployments"
# Selecione uma versão anterior
# Clique em "Redeploy"
```

### Backup

- **Código**: Versionado no Git
- **Banco de dados**: Backup automático do Supabase
- **Configurações**: Documentadas neste guia

## 📞 Suporte

### Recursos Úteis

- **Documentação Coolify**: [docs.coolify.io](https://docs.coolify.io)
- **Documentação Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Repositório**: [github.com/smartexia/rankhub-esports-v1](https://github.com/smartexia/rankhub-esports-v1)

### Contato

- **Email**: smartexautomacoes@gmail.com
- **GitHub**: @smartexia

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0.0