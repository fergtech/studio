# Dockerfile for Next.js application

# 1. Base Stage: Provides the basic Node.js environment
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Common environment variables, NODE_ENV will be set per stage where appropriate
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 2. Dependencies Stage: Installs npm packages
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
# Ensure all dependencies, including devDependencies, are installed for the build
RUN npm ci

# 3. Builder Stage: Builds the Next.js application
FROM base AS builder
# NODE_ENV is not 'production' here by default, which is fine for building
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Diagnostic commands (can be kept for now to verify build stage)
RUN echo "--- Contents of /app/.next/standalone in builder ---" && ls -R /app/.next/standalone || echo "/app/.next/standalone not found or empty"
RUN echo "--- Contents of /app/public in builder (source for standalone) ---" && ls -R /app/public || echo "/app/public not found in builder"
RUN echo "--- Contents of /app/.next/static in builder (source for standalone) ---" && ls -R /app/.next/static || echo "/app/.next/static not found in builder"

# 4. Runner Stage: Creates the final, small image for running the app
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production only for the runner stage
ENV NODE_ENV=production

# Create a non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the wait-for-it script and make it executable
# This assumes you have a `scripts` folder in your project root
COPY scripts/wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh
# This command fixes line ending issues if you're on Windows
RUN sed -i 's/\r$//' /usr/local/bin/wait-for-it.sh

# Copy the built application files from the builder stage
# The .next/standalone directory includes the public folder, .next/static, server.js, etc.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Explicitly copy the .next/static directory from the builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Explicitly copy the public directory from the builder if it exists and is needed
# If your app has a root /public folder that 'standalone' isn't picking up, uncomment and adjust:
# COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy the prisma directory for migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Set the user
USER nextjs

EXPOSE 3000

# Define the command to run the application
CMD ["wait-for-it.sh", "db:5432", "--", "node", "server.js"]
