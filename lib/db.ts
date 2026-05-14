import { Pool, QueryResultRow } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    // Supabase provides a PostgreSQL connection string.
    // Use the session pooler (port 6543) for serverless-friendly connections,
    // or the direct connection (port 5432) for persistent servers.
    // Prefer SUPABASE_DATABASE_URL if set, fall back to DATABASE_URL for backward compat.
    const dbUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL || '';
    if (!dbUrl) throw new Error('SUPABASE_DATABASE_URL or DATABASE_URL not set');

    _pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return _pool;
}

// Tagged template interface — same API as before
export default function sql(strings: TemplateStringsArray, ...values: any[]) {
  const text = strings.reduce((acc, str, i) => acc + str + (i < values.length ? `$${i + 1}` : ''), '');
  const params = values;

  return {
    text,
    params,
    async then(resolve: (value: QueryResultRow[]) => void, reject: (err: Error) => void) {
      try {
        const pool = getPool();
        const result = await pool.query(text, params);
        resolve(result.rows);
      } catch (e) {
        reject(e as Error);
      }
    },
  } as any;
}

/** Raw query with explicit parameters (ORDER BY safe — no parameterization of column names) */
sql.raw = async function(query: string, params: any[] = []): Promise<QueryResultRow[]> {
  const pool = getPool();
  const result = await pool.query(query, params);
  return result.rows;
};
