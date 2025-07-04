# Dockerfile for Next.js application (Railway/Production Ready)

# 1. Base Stage: Provides the basic Node.js environment
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 2. Dependencies Stage: Installs npm packages
FROM base AS deps
ENV http_proxy=""
ENV https_proxy=""
RUN apt-get update && apt-get install -y python3 make g++ openssl libssl-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile

# 3. Builder Stage: Builds the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy only prisma schema and generate client for better cache
COPY ./prisma ./prisma
RUN unset HTTPS_PROXY && unset HTTP_PROXY && npx prisma generate
# Debug: Check if Prisma client was generated
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found"
# Copy the rest of the application code
COPY . .
RUN unset HTTPS_PROXY && unset HTTP_PROXY && pnpm run build

# Diagnostic commands (optional, for debugging build output)
RUN echo "--- Contents of /app/.next/standalone in builder ---" && ls -R /app/.next/standalone || echo "/app/.next/standalone not found or empty"
RUN echo "--- Contents of /app/public in builder (source for standalone) ---" && ls -R /app/public || echo "/app/public not found in builder"
RUN echo "--- Contents of /app/.next/static in builder (source for standalone) ---" && ls -R /app/.next/static || echo "/app/.next/static not found in builder"

# 4. Runner Stage: Creates the final, small image for running the app
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# Create a non-root user for security with a real home directory
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 --home /home/nextjs nextjs
ENV HOME=/home/nextjs
# Set HTTPS_PROXY and HTTP_PROXY only in the runtime stage for Azure uploads

# Copy the wait-for-it script and make it executable
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh
RUN sed -i 's/\r$//' /usr/local/bin/wait-for-it.sh

# Copy the built application files from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# If your app has a root /public folder that 'standalone' isn't picking up, uncomment:
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
# Run migrations and start the app
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
