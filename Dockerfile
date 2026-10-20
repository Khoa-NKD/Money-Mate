# ==============================================================================
# Multi-stage Dockerfile for MoneyMate (React 19 + Vite + TypeScript + Nginx)
# ==============================================================================

# Stage 1: Build production bundle
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install clean dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build arguments for frontend Supabase inlining
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

# Compile TypeScript and bundle with Vite
RUN npm run build

# ==============================================================================
# Stage 2: Serve static bundle via high-performance Nginx Alpine
# ==============================================================================
FROM nginx:alpine-slim AS runner

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration with SPA routing fallback
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Launch Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
