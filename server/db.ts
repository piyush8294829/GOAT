import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development, we'll create a placeholder that prevents crashes
// In production, DATABASE_URL must be properly configured
const DATABASE_URL = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;

if (!DATABASE_URL) {
  console.warn(
    "⚠️  DATABASE_URL not found. Database operations will fail until configured."
  );
}

// Configure SSL settings for Railway PostgreSQL
const poolConfig = DATABASE_URL ? {
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway.app') || DATABASE_URL.includes('rlwy.net') ? {
    rejectUnauthorized: false
  } : undefined
} : null;

export const pool = poolConfig ? new Pool(poolConfig) : null;
export const db = pool ? drizzle({ client: pool, schema }) : null;