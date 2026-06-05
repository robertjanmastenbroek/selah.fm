import { Pool, QueryResultRow } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const dbUrl = process.env.SUPABASE_DATABASE_URL;
    if (!dbUrl) throw new Error('SUPABASE_DATABASE_URL is required');

    // Strip PgBouncer query param — transaction mode forces read-only under load.
    // Also switch from pooler.supabase.com to direct db.supabase.com connection
    // so writes work reliably. Pooler is only needed for >100 concurrent connections.
    let connStr = dbUrl.split('?')[0];
    // Replace pooler host with direct host for read-write access
    connStr = connStr.replace('.pooler.supabase.com', '.supabase.co');
    // Note: direct connections may have fewer concurrent slots. If you hit
    // connection limits, set USE_DIRECT_DB=false in Railway env to revert to pooler.
    _pool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 10,
    });
  }
  return _pool;
}

// Tagged template interface
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

/** Raw query with explicit parameters */
sql.raw = async function(query: string, params: any[] = []): Promise<QueryResultRow[]> {
  const pool = getPool();
  const result = await pool.query(query, params);
  return result.rows;
};
