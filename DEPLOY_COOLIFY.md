# Deploy RankHub v1 no Coolify

## 📋 Pré-requisitos

### 1. Servidor Coolify
- Servidor com Coolify instalado e configurado
- Acesso SSH ao servidor
- Docker e Docker Compose funcionando

### 2. Banco de Dados Supabase
- Projeto Supabase em produção
- Políticas RLS configuradas
- Migrações aplicadas

---

## 🔧 Configuração do Projeto

### 1. Variáveis de Ambiente (.env.production)

Crie um arquivo `.env.production` com as seguintes variáveis:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Application Settings
VITE_APP_TITLE=RankHub
VITE_APP_DESCRIPTION=Sistema de Gestão de Campeonatos de Esports
VITE_APP_URL=https://seu-dominio.com

# Build Settings
NODE_ENV=production
```

### 2. Dockerfile para Produção

Crie um `Dockerfile` otimizado:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 3. Configuração do Nginx

Crie um arquivo `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

---

## 🚀 Configuração no Coolify

### 1. Criar Novo Projeto

1. Acesse seu painel Coolify
2. Clique em "New Resource" → "Application"
3. Selecione "Git Repository"
4. Configure:
   - **Repository**: `https://github.com/smartexia/rankhub-esports-v1.git`
   - **Branch**: `main`
   - **Build Pack**: `Docker`

### 2. Configurar Build Settings

```yaml
# Build Command
npm run build

# Start Command
nginx -g 'daemon off;'

# Port
80

# Health Check Path
/health
```

### 3. Variáveis de Ambiente no Coolify

Adicione as seguintes variáveis no painel do Coolify:

```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_TITLE=RankHub
VITE_APP_DESCRIPTION=Sistema de Gestão de Campeonatos de Esports
VITE_APP_URL=https://seu-dominio.com
NODE_ENV=production
```

### 4. Configurar Domínio

1. Vá para "Domains" no seu projeto
2. Adicione seu domínio personalizado
3. Configure SSL automático
4. Aguarde a propagação DNS

---

## 🔒 Configurações de Segurança

### 1. Supabase RLS Policies

Verifique se as políticas RLS estão ativas:

```sql
-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verificar políticas ativas
SELECT * FROM pg_policies WHERE schemaname = 'public';
```

### 2. Configurações de CORS no Supabase

1. Acesse o painel Supabase
2. Vá para "Settings" → "API"
3. Adicione seu domínio de produção em "CORS origins"

### 3. Configurar Rate Limiting

No Supabase, configure rate limiting para APIs:

```sql
-- Exemplo de rate limiting (se disponível)
ALTER ROLE authenticator SET pgrst.db_max_rows = '1000';
```

---

## 📊 Monitoramento e Logs

### 1. Health Checks

O Coolify irá monitorar automaticamente:
- **Endpoint**: `/health`
- **Intervalo**: 30 segundos
- **Timeout**: 10 segundos

### 2. Logs de Aplicação

Para visualizar logs:
```bash
# No servidor Coolify
docker logs -f container_name
```

### 3. Métricas de Performance

Monitore:
- Tempo de resposta
- Uso de CPU/Memória
- Número de requisições
- Erros 4xx/5xx

---

## 🔄 CI/CD Automático

### 1. Webhook do GitHub

O Coolify pode configurar webhooks automáticos:
1. Vá para "Settings" → "Webhooks"
2. Ative "Auto Deploy on Push"
3. Configure para a branch `main`

### 2. Pipeline de Deploy

```yaml
# Exemplo de workflow (se usar GitHub Actions)
name: Deploy to Coolify

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Coolify Deploy
        run: |
          curl -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

---

## 🚨 Troubleshooting

### Problemas Comuns

1. **Build falha**:
   - Verifique se todas as dependências estão no `package.json`
   - Confirme se as variáveis de ambiente estão configuradas

2. **Erro 404 em rotas**:
   - Verifique se o `nginx.conf` está configurado corretamente
   - Confirme se o `try_files` está redirecionando para `index.html`

3. **Erro de conexão com Supabase**:
   - Verifique as URLs e chaves de API
   - Confirme se o CORS está configurado

4. **Performance lenta**:
   - Ative compressão gzip
   - Configure cache de assets estáticos
   - Otimize imagens e bundles

### Comandos Úteis

```bash
# Verificar status do container
docker ps

# Ver logs em tempo real
docker logs -f rankhub-container

# Reiniciar aplicação
docker restart rankhub-container

# Verificar uso de recursos
docker stats rankhub-container
```

---

## ✅ Checklist de Deploy

- [ ] Supabase configurado em produção
- [ ] Migrações aplicadas
- [ ] Políticas RLS ativas
- [ ] Variáveis de ambiente configuradas
- [ ] Dockerfile criado
- [ ] nginx.conf configurado
- [ ] Projeto criado no Coolify
- [ ] Domínio configurado
- [ ] SSL ativo
- [ ] CORS configurado no Supabase
- [ ] Health checks funcionando
- [ ] Logs sendo coletados
- [ ] Backup configurado

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs do Coolify
2. Teste as conexões com Supabase
3. Valide as configurações de DNS
4. Consulte a documentação do Coolify

---

*Última atualização: Janeiro 2025*
*Versão: 1.0*