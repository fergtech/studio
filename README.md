# Firebase Studio

This is a NextJS starter in Firebase Studio.

## Getting Started

### 1. Environment Setup

Copy the environment template and configure your environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials. See `.env.example` for all required variables.

**Important:** Never commit `.env.local` or any file containing secrets to version control.

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Database Setup

```bash
npx prisma generate
npx prisma migrate dev
```

### 4. Run Development Server

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Documentation

- [Docker Development Setup](docs/docker-development.md)
- [Security Guidelines](docs/SECURITY.md)

## Security

Please review [docs/SECURITY.md](docs/SECURITY.md) for security best practices and guidelines.

**Never commit:**
- `.env` files
- API keys or secrets
- Database credentials
- Connection strings

See `.gitignore` for a complete list of files that should not be committed.
