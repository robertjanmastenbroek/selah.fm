let _sql: any = null;

function getSql() {
  if (!_sql) {
    const { neon } = require('@neondatabase/serverless');
    _sql = neon(process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL || 'postgresql://localhost/nodb');
  }
  return _sql;
}

export default function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSql()(strings, ...values);
}
