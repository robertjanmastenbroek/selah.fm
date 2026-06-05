import { Pool, QueryResultRow } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const dbUrl = process.env.SUPABASE_DATABASE_URL;
    if (!dbUrl) throw new Error('SUPABASE_DATABASE_URL is required');

    // Add ?pgbouncer=true for Supabase connection pooler compatibility
    // (session mode via port 6543 is the default; this flag is for the pg driver)
    const connStr = dbUrl.includes('?') ? dbUrl : dbUrl + '?pgbouncer=true';
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
