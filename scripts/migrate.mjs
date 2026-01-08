#!/usr/bin/env node

/**
 * Auto-migration script
 * Runs database migrations before server starts
 */

import { execSync } from 'child_process';

console.log('[Migration] Starting database migration...');

try {
  // Run drizzle-kit push to sync schema with database
  execSync('pnpm drizzle-kit push', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  
  console.log('[Migration] ✅ Database migration completed successfully');
  process.exit(0);
} catch (error) {
  console.error('[Migration] ❌ Migration failed:', error.message);
  console.error('[Migration] Server will start anyway, but database might not be up to date');
  // Don't fail the deployment - let server start even if migration fails
  process.exit(0);
}
