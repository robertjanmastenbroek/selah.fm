import { Pool, QueryResultRow } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || '';
    if (!dbUrl) throw new Error('DATABASE_URL not set');

    _pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      max: 5,
    });
  }
  return _pool;
}

// Tagged template interface mimicking neon's API
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
