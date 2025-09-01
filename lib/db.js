import { sql } from '@vercel/postgres';
import { Pool } from '@neondatabase/serverless';

// Use Vercel Postgres in production, local pool in development
let pool;

if (process.env.POSTGRES_URL) {
  // Production: Use Vercel Postgres
  pool = {
    query: async (text, params) => {
      const result = await sql.query(text, params);
      return result;
    },
    // For transactions
    connect: async () => {
      return {
        query: async (text, params) => {
          const result = await sql.query(text, params);
          return result;
        },
        release: () => {}
      };
    }
  };
} else {
  // Development: Use local PostgreSQL or SQLite fallback
  const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/steel_construction';
  pool = new Pool({ connectionString });
}

export const db = {
  // Simple query
  query: async (text, params) => {
    try {
      const result = await pool.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  },

  // Get single row
  get: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows[0];
  },

  // Get all rows
  all: async (text, params) => {
    const result = await db.query(text, params);
    return result.rows;
  },

  // Execute query (for INSERT, UPDATE, DELETE)
  run: async (text, params) => {
    const result = await db.query(text, params);
    return {
      rowCount: result.rowCount,
      rows: result.rows
    };
  },

  // Transaction support
  transaction: async (callback) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
};

// Helper to convert SQLite placeholders (?) to PostgreSQL ($1, $2, etc.)
export function convertPlaceholders(query, params) {
  let pgQuery = query;
  let index = 1;
  while (pgQuery.includes('?')) {
    pgQuery = pgQuery.replace('?', `$${index}`);
    index++;
  }
  return { query: pgQuery, params };
}

export default db;