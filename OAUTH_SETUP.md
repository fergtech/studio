# OAuth Setup Guide

This guide will help you set up OAuth authentication (Google & Apple) for Society+.

## Overview

The app now supports three authentication methods:
1. **Email/Password** - Traditional registration with strong password requirements
2. **Google OAuth** - "Sign in with Google"
3. **Apple OAuth** - "Sign in with Apple"

## Google OAuth Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (required for OAuth)

### 2. Create OAuth 2.0 Credentials
1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application**
4. Configure:
   - **Name**: Society+ (or your app name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://yourdomain.com` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Add Credentials to Environment
1. Copy the **Client ID** and **Client Secret**
2. Add to `.env.local`:
   ```bash
   GOOGLE_CLIENT_ID="your-client-id-here"
   GOOGLE_CLIENT_SECRET="your-client-secret-here"
   ```

## Apple OAuth Setup

### Prerequisites
- Apple Developer Account ($99/year)
- Domain name with HTTPS (required for production)

### 1. Create App ID
1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Click **+** → **App IDs**
3. Select **App**
4. Configure:
   - **Description**: Society+
   - **Bundle ID**: com.yourdomain.societyplus (reverse domain notation)
   - **Capabilities**: Enable "Sign in with Apple"

### 2. Create Services ID
1. Go to **Identifiers** → **+** → **Services IDs**
2. Configure:
   - **Description**: Society+ Web
   - **Identifier**: com.yourdomain.societyplus.web
3. Enable **Sign in with Apple**
4. Click **Configure**:
   - **Primary App ID**: Select your App ID from step 1
   - **Domains and Subdomains**:
     - `yourdomain.com` (production)
   - **Return URLs**:
     - `https://yourdomain.com/api/auth/callback/apple` (production)
     - For local development, you'll need ngrok or similar

### 3. Create Private Key
1. Go to **Keys** → **+**
2. Configure:
   - **Key Name**: Society+ Sign in with Apple Key
   - **Enable**: Sign in with Apple
   - **Configure**: Select your Primary App ID
3. Download the `.p8` key file (SAVE IT - can only download once!)

### 4. Generate Client Secret
Apple OAuth requires a JWT as the client secret. You'll need to:
1. Use the `.p8` key file
2. Your Team ID (found in top-right of Apple Developer portal)
3. Your Services ID (from step 2)
4. Your Key ID (from step 3)

Use this script or a tool like https://appleid.apple.com/signinwithapple/jwks to generate the JWT.

### 5. Add Credentials to Environment
```bash
APPLE_CLIENT_ID="com.yourdomain.societyplus.web"
APPLE_CLIENT_SECRET="your-generated-jwt-here"
```

Note: Apple's client secret (JWT) expires after 6 months and needs to be regenerated.

## Testing OAuth Locally

### For Google:
1. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`
2. Restart your dev server
3. Go to `http://localhost:3000/login`
4. Click "Continue with Google"
5. Sign in with your Google account

### For Apple:
Apple OAuth requires HTTPS, which means local testing needs:
1. Use **ngrok** or similar tunnel service:
   ```bash
   ngrok http 3000
   ```
2. Update your Apple Services ID return URLs to include the ngrok URL
3. Update `NEXTAUTH_URL` in `.env.local` to your ngrok URL
4. Test OAuth flow through the ngrok URL

**Tip**: Due to Apple's HTTPS requirement, it's easier to test Apple OAuth after deploying to production.

## Production Deployment

### Vercel Environment Variables
Add these to your Vercel project:
1. Go to **Project Settings** → **Environment Variables**
2. Add each OAuth credential as a separate variable:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `APPLE_CLIENT_ID`
   - `APPLE_CLIENT_SECRET`
3. Set them for **Production**, **Preview**, and **Development** environments

### Update OAuth Redirect URLs
After deployment, update your OAuth providers:
1. **Google**: Add your production URL to authorized redirect URIs
2. **Apple**: Add your production URL to return URLs

## Database Migration

The database schema has been updated to support OAuth users:
- `passwordHash` is now optional (OAuth users don't have passwords)
- Users can have both email/password AND OAuth linked to the same account (based on email)

Run the migration:
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name oauth-support

# Or for production
npx prisma migrate deploy
```

## Troubleshooting

### "OAuth provider not found" error
- Ensure environment variables are set correctly
- Restart your dev server after adding credentials
- Check that variable names match exactly

### "Redirect URI mismatch" error
- Verify your callback URLs in OAuth provider settings
- Ensure `NEXTAUTH_URL` matches your deployment URL
- For local dev, use `http://localhost:3000` (not `127.0.0.1`)

### "User already exists" when using OAuth
- This is expected! If a user registers with email first, then tries OAuth with the same email, they'll be linked automatically
- The OAuth sign-in callback checks by email and uses the existing user

### Apple OAuth not working locally
- Apple requires HTTPS - use ngrok for local testing
- Or skip local testing and test on staging/production deployment

## Security Considerations

1. **Never commit OAuth secrets** - Use environment variables only
2. **Rotate secrets regularly** - Especially Apple JWT (expires in 6 months)
3. **Use different credentials** for development and production
4. **Limit redirect URLs** - Only add URLs you control
5. **Monitor OAuth usage** - Check logs for suspicious activity

## Need Help?

- Google OAuth: https://support.google.com/cloud/answer/6158849
- Apple OAuth: https://developer.apple.com/sign-in-with-apple/get-started/
- NextAuth.js: https://next-auth.js.org/providers/google
