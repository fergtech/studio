# Filename: chat.Dockerfile
# A simple Dockerfile for our standalone chat service

FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# Add this line to install OpenSSL
RUN apt-get update && apt-get install -y openssl libssl-dev --no-install-recommends

# Copy dependency manifests
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

# Install all dependencies from your lockfile
# This will include `tsx` if it's in your package.json
RUN npm ci

# Copy all of your source code into the container
# This makes sure socket-server.ts is available
COPY . .

# The start command is set in the Railway service settings,
# so we don't need a CMD instruction here.
