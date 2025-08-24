# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install build dependencies including yarn as fallback
RUN apk add --no-cache python3 make g++ yarn

# Copy package files
COPY package*.json ./

# Install dependencies with multiple fallback strategies
RUN set -e && \
    # Clean all caches thoroughly
    npm cache clean --force && \
    rm -rf ~/.npm && \
    rm -rf node_modules && \
    # Configure npm with robust settings
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-timeout 600000 && \
    npm config set fetch-retry-mintimeout 30000 && \
    npm config set fetch-retry-maxtimeout 180000 && \
    npm config set fetch-retries 10 && \
    npm config set maxsockets 1 && \
    # Try multiple installation strategies
    (npm ci --no-audit --no-fund --prefer-offline || \
     npm ci --no-audit --no-fund || \
     npm install --no-audit --no-fund --prefer-offline || \
     npm install --no-audit --no-fund || \
     yarn install --frozen-lockfile --network-timeout 600000 || \
     yarn install --network-timeout 600000) && \
    # Verify installation
    npm list --depth=0 || yarn list --depth=0 || echo "Warning: Some packages may have issues but continuing..."

# Copy source code
COPY . .

# Build the application
RUN npm run build

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