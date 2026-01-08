# Railway Deployment Guide

## ✨ One-Step Setup

All API keys and secrets are already embedded in the code with default values!

### You Only Need to Add:

**1. DATABASE_URL** (automatically set by Railway)

That's it! 🎉

## Quick Setup

### 1. Add PostgreSQL Database

In Railway dashboard:
- Click "New" → "Database" → "Add PostgreSQL"
- Railway will automatically create `DATABASE_URL` variable

### 2. Deploy

Railway will automatically deploy from your GitHub repository.

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

## Default Values (Already Embedded)

The following are already configured with default values:

```
✅ HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=14649a76-7c70-443c-b6da-41cffe2543fd
✅ TWITTER_API_KEY=new1_defb379335c44d58890c0e2c59ada78f
✅ JWT_SECRET=default-jwt-secret-change-in-production-min-32-chars
✅ OAUTH_SERVER_URL=https://api.manus.im
✅ OWNER_OPEN_ID=default-owner
✅ VITE_APP_ID=solana-dev-tracker
```

## Optional: Override Defaults

If you want to use different API keys, you can override them by adding environment variables in Railway:

- `HELIUS_RPC_URL` - Your own Helius RPC endpoint
- `TWITTER_API_KEY` - Your own Twitter API key
- `JWT_SECRET` - Your own JWT secret (recommended for production)

## Troubleshooting

### Database Connection Issues
Make sure PostgreSQL is added and `DATABASE_URL` is automatically injected.

### Migration Fails
Try running migrations manually:
```bash
railway run pnpm db:push
```

### OAuth Warnings in Logs
These are normal and can be ignored - the API works without OAuth for the Chrome extension.

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

## Next Steps

After deployment:
1. Copy your Railway URL
2. Update Chrome extension API URLs
3. Load extension in Chrome
4. Open Padre terminal and test!
