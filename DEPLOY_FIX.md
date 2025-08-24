# 🔧 Correção do Deploy no Coolify

## ❌ Problema Identificado

O deploy falhou porque o Coolify estava usando **Nixpacks** automaticamente ao invés do nosso **Dockerfile** customizado.

### Erro Original:
```
/bin/bash: line 1: vite: command not found
error: script "build" exited with code 127
```

### Causa:
- Coolify detectou o projeto como Node.js
- Usou Nixpacks com `npm ci --only=production`
- DevDependencies não foram instaladas (incluindo Vite)
- Comando `vite build` falhou

## ✅ Soluções Implementadas

### 1. Desabilitar Nixpacks
Criado arquivo `nixpacks.toml`:
```toml
[build]
disable = true

[variables]
NODE_ENV = "production"
```

### 2. Forçar Uso do Dockerfile
Criado arquivo `.coolify`:
```
buildpack=dockerfile
dockerfile=Dockerfile
port=80
```

### 3. Corrigir Dockerfile
Alterado para instalar todas as dependências:
```dockerfile
# Antes
RUN npm ci --only=production

# Depois
RUN npm ci
```

## 🚀 Configuração no Coolify

### Passo 1: Build Settings
- **Build Pack**: `dockerfile`
- **Dockerfile**: `Dockerfile`
- **Port**: `80`

### Passo 2: Environment Variables
Configurar no painel do Coolify:
```env
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_APP_TITLE=RankHub
VITE_APP_DESCRIPTION=Sistema de Gestão de Campeonatos de Esports
VITE_APP_URL=https://seu-dominio.com
NODE_ENV=production
```

### Passo 3: Health Check
- **Path**: `/health`
- **Interval**: `30s`
- **Timeout**: `10s`
- **Retries**: `3`

## 📋 Checklist de Deploy

- [ ] Arquivo `nixpacks.toml` commitado
- [ ] Arquivo `.coolify` commitado
- [ ] Dockerfile corrigido
- [ ] Build pack configurado como `dockerfile`
- [ ] Variáveis de ambiente configuradas
- [ ] Health check configurado
- [ ] Deploy realizado

## 🔍 Verificação Pós-Deploy

1. **Health Check**:
   ```bash
   curl https://seu-dominio.com/health
   ```

2. **Logs de Build**:
   - Verificar se usa Dockerfile
   - Confirmar instalação de dependências
   - Validar build do Vite

3. **Funcionalidade**:
   - Login/Logout
   - Criação de campeonatos
   - Interface responsiva

## 🆘 Troubleshooting

### Se ainda usar Nixpacks:
1. Deletar o projeto no Coolify
2. Recriar com build pack `dockerfile`
3. Verificar se arquivos `.coolify` e `nixpacks.toml` estão no repositório

### Se build falhar:
1. Verificar logs de build
2. Confirmar variáveis de ambiente
3. Testar build local: `docker build -t test .`

### Se aplicação não iniciar:
1. Verificar health check
2. Confirmar porta 80
3. Verificar logs do container

## 📚 Referências

- [Coolify Dockerfile Guide](https://coolify.io/docs/knowledge-base/docker/dockerfile)
- [Nixpacks Disable](https://nixpacks.com/docs/configuration/file)
- [Vite Production Build](https://vitejs.dev/guide/build.html)