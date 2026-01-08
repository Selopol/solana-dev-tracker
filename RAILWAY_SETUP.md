# Railway Deployment Guide

## Quick Setup

### 1. Add PostgreSQL Database

In Railway dashboard:
- Click "New" → "Database" → "Add PostgreSQL"
- Railway will automatically create `DATABASE_URL` variable

### 2. Add Environment Variables

Go to your service → Variables tab and add:

```
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd
TWITTER_API_KEY=new1_defb379335c44d58890c0e2c59ada78f
JWT_SECRET=<generate-random-32-char-string>
OAUTH_SERVER_URL=https://api.manus.im
OWNER_OPEN_ID=default-owner
OWNER_NAME=Admin
VITE_APP_ID=solana-dev-tracker
```

### 3. Run Database Migration

After first deployment, open Railway CLI or use the web console:

```bash
pnpm db:push
```

This will create all database tables.

### 4. Get Your API URL

After deployment:
1. Go to Settings → Networking
2. Copy the Public Domain (e.g., `solana-dev-tracker-production.up.railway.app`)
3. Your API URL will be: `https://your-domain.railway.app/api/trpc`

### 5. Update Chrome Extension

Edit these files in your Chrome extension:
- `chrome_extension/scripts/content.js` line 6
- `chrome_extension/popup/popup.js` line 2

Replace `API_BASE_URL` with your Railway URL.

## Generate JWT_SECRET

Use one of these methods:

**Online:**
- https://generate-secret.vercel.app/32

**Terminal:**
```bash
openssl rand -base64 32
```

**Or any random string 32+ characters**

## Troubleshooting

### OAuth Errors
If you see OAuth errors in logs, it's normal - the API endpoints work without OAuth for the Chrome extension.

### Database Connection Issues
Make sure `DATABASE_URL` is set correctly. Railway should auto-inject this when you add PostgreSQL.

### Migration Fails
Try running migrations manually:
```bash
railway run pnpm db:push
```

## API Endpoints

Once deployed, your API will be available at:
- Health check: `https://your-domain.railway.app/api/health`
- tRPC API: `https://your-domain.railway.app/api/trpc/*`

## Monitoring

Check logs in Railway dashboard to see:
- Server startup
- Database connections
- API requests
- Background jobs (Solana monitoring, Twitter sync)
