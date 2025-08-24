# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
# Install build dependencies and yarn (add TLS certs and openssl)
RUN apk add --no-cache python3 make g++ yarn git curl ca-certificates openssl && update-ca-certificates
# Prefer IPv4 to avoid flaky IPv6 DNS in some environments
ENV NODE_OPTIONS="--dns-result-order=ipv4first"
# Copy package files
COPY package*.json ./
# Keep lockfiles for reproducible installs (package-lock.json, bun.lockb)
# Remove npm completely and use only yarn
RUN set -e && \
# Remove npm to avoid conflicts
rm -rf /usr/local/bin/npm /usr/local/bin/npx && \
# Clean all possible caches
rm -rf ~/.npm ~/.yarn-cache ~/.cache && \
rm -rf node_modules && \
# Configure yarn with multiple registry fallbacks and strict SSL
yarn config set network-timeout 300000 && \
yarn config set network-concurrency 1 && \
yarn config set network-retry 10 && \
yarn config set strict-ssl true && \
# Try multiple registries as fallback (npmjs -> yarnpkg -> npmmirror -> no-lockfile)
(yarn config set registry https://registry.npmjs.org/ && yarn install --network-timeout 300000) || \
(yarn config set registry https://registry.yarnpkg.com/ && yarn install --network-timeout 300000) || \
(yarn config set registry https://registry.npmmirror.com/ && yarn install --network-timeout 300000) || \
(yarn config set registry https://registry.npmjs.org/ && yarn install --no-lockfile --network-timeout 300000) && \
# Verify installation and install vite explicitly if missing
(yarn list vite || yarn add vite@^5.4.19 --dev --network-timeout 300000) && \
echo "Dependencies installed successfully"
# Copy source code
COPY . .
# Build the application using yarn
RUN yarn build

# Production stage
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create nginx user and set permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]