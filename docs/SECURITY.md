# Security Guidelines

## Overview

This document outlines security best practices and guidelines for the Studio application.

## Environment Variables

### Never Commit Secrets

**DO NOT** commit the following files to version control:
- `.env`
- `.env.local`
- `.env.production`
- `.env.development`
- Any file containing API keys, passwords, or connection strings

These files are already in `.gitignore` to prevent accidental commits.

### Required Environment Variables

See `.env.example` for a template of all required environment variables. Copy this file to `.env.local` and fill in your actual values:

```bash
cp .env.example .env.local
```

### Environment Variable Security

1. **Generate Strong Secrets**: Use cryptographically secure random strings for secrets:
   ```bash
   openssl rand -base64 32
   ```

2. **Rotate Secrets Regularly**: Change production secrets periodically

3. **Use Different Secrets Per Environment**: Never reuse production secrets in development

4. **Limit Access**: Only give environment variables to services that need them

## Code Security Best Practices

### 1. Never Log Sensitive Information

**Bad:**
```typescript
console.log("API Key:", process.env.API_KEY);
console.log("Connection String:", connectionString);
```

**Good:**
```typescript
console.log("API Key: [REDACTED]");
console.log("Connection String: Configured");
```

### 2. Mask Sensitive Data in Logs

When logging connection strings or other sensitive data for debugging:

```typescript
const maskedString = connectionString.replace(/:([^:@]+)@/, ':****@');
console.log('Using connection string:', maskedString);
```

### 3. Validate Environment Variables

Always check that required environment variables are set:

```typescript
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}
```

### 4. Use Server-Side Only for Secrets

- Prefix client-side environment variables with `NEXT_PUBLIC_`
- Never use `NEXT_PUBLIC_` prefix for secrets
- Keep API keys and secrets server-side only

## File Security

### Test Files

Test files should **NOT** be committed to version control if they contain:
- Sample credentials
- Connection strings
- API keys
- Personal information
- Local file paths

Files like these are now in `.gitignore`:
- `test-azure-storage.js`
- `test-db.js`
- `test-request.json`
- `settings.json`

### Sensitive Paths

Avoid hardcoding local file paths in code:

**Bad:**
```javascript
// h:\Projects\il3\studio\test-azure-storage.js
```

**Good:**
```javascript
// Test script for Azure Storage connection
```

## Database Security

1. **Use Parameterized Queries**: Always use Prisma's built-in query methods or prepared statements
2. **Limit Database Permissions**: Use separate database users for different environments
3. **Encrypt Connections**: Use SSL/TLS for database connections in production
4. **Regular Backups**: Ensure database backups are encrypted and stored securely

## Azure Storage Security

1. **Use Managed Identities**: When possible, use Azure Managed Identity instead of connection strings
2. **Limit SAS Token Permissions**: If using SAS tokens, grant minimum required permissions
3. **Set Expiration**: Always set expiration dates on SAS tokens
4. **Use Private Endpoints**: For production, consider using private endpoints

## Authentication Security

1. **Strong Session Secrets**: Use cryptographically strong random strings for `NEXTAUTH_SECRET`
2. **HTTPS Only**: Always use HTTPS in production (set `secure: true` in cookie options)
3. **Session Expiration**: Configure appropriate session timeouts
4. **CSRF Protection**: NextAuth provides CSRF protection by default - don't disable it

## Dependency Security

1. **Regular Updates**: Keep dependencies up to date
   ```bash
   npm audit
   npm audit fix
   ```

2. **Review Dependencies**: Be cautious about adding new dependencies
3. **Use Lock Files**: Always commit `package-lock.json` or `pnpm-lock.yaml`

## Reporting Security Issues

If you discover a security vulnerability, please email the security team instead of opening a public issue. Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Checklist for Deployment

Before deploying to production:

- [ ] All secrets are in environment variables, not in code
- [ ] `.env` files are not committed
- [ ] Strong random strings are used for secrets
- [ ] Database uses SSL/TLS connection
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Rate limiting is enabled
- [ ] Dependencies are up to date
- [ ] Security headers are configured
- [ ] Error messages don't leak sensitive information
- [ ] Logging doesn't include secrets or PII
- [ ] File uploads are validated and sanitized
- [ ] Database queries are parameterized
- [ ] Authentication is tested
- [ ] Authorization checks are in place
