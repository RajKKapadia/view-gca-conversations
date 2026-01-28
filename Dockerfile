# ---------- deps ----------
    FROM node:20-alpine AS deps
    WORKDIR /app
    
    # Enable corepack so pnpm/yarn can work if you use them
    RUN corepack enable
    
    # Copy only lockfiles first for better caching
    COPY package.json ./
    COPY package-lock.json* pnpm-lock.yaml* yarn.lock* ./
    
    # Install deps depending on lockfile
    RUN \
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
      elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
      else npm ci; \
      fi
    
    # ---------- build ----------
    FROM node:20-alpine AS builder
    WORKDIR /app
    RUN corepack enable
    
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    
    # Build Next.js (standalone output recommended)
    RUN \
      if [ -f pnpm-lock.yaml ]; then pnpm run build; \
      elif [ -f yarn.lock ]; then yarn build; \
      else npm run build; \
      fi
    
    # ---------- runner ----------
    FROM node:20-alpine AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    # Cloud Run listens on 8080 by default
    ENV PORT=8080
    EXPOSE 8080
    
    # Copy standalone server + static assets
    # Requires next.config output: "standalone"
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    COPY --from=builder /app/public ./public
    
    # If your standalone server is at server.js (standard)
    CMD ["node", "server.js"]
    