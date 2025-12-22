# Dockerfile for Next.js application (Railway/Production Ready)

# 1. Base Stage: Provides the basic Node.js environment
FROM node:20-slim AS base
WORKDIR /app
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Install pnpm directly instead of using corepack to avoid network issues
RUN npm install -g pnpm@9.12.0
RUN apt-get update -y && apt-get install -y openssl python3 make g++

# 2. Dependencies Stage: Installs npm packages
FROM base AS deps
ENV http_proxy=""
ENV https_proxy=""
ENV HTTP_PROXY=""
ENV HTTPS_PROXY=""
WORKDIR /app
# Remove any lines like:
# RUN npm install -g pnpm@10.12.4
# RUN npm uninstall -g pnpm
# Just use pnpm as preinstalled in the base image
COPY package.json pnpm-lock.yaml ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN pnpm install --frozen-lockfile

# 3. Builder Stage: Builds the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code first
COPY . .
# Generate Prisma client with the actual schema
RUN unset HTTPS_PROXY && unset HTTP_PROXY && npx prisma generate
# Debug: Check if Prisma client was generated
RUN ls -la node_modules/.prisma/client/ || echo "Prisma client not found"
ENV NODE_ENV=production
# Use a more comprehensive set of environment variables for build
RUN unset HTTPS_PROXY && unset HTTP_PROXY && \
    DATABASE_URL="postgresql://postgres:postgres@postgres:5432/studio_dev" \
    NEXTAUTH_SECRET="build-time-secret-key-for-docker-build" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXT_BUILD_STANDALONE=true \
    NEXT_DISABLE_STATIC_GENERATION=true \
    pnpm build

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
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Copy the complete node_modules from deps stage instead of trying to copy individual pieces
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy the generated Prisma client specifically
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy package.json
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000
# Generate client, run migrations and start the app
CMD ["sh", "-c", "echo 'Starting application...' && ls -la node_modules/.prisma/ || echo 'Prisma client not found, generating...' && npx prisma generate && echo 'Generated Prisma client, running migrations...' && npx prisma migrate deploy && echo 'Starting server...' && node server.js"]
