let _sql: any = null;

function getSql() {
  if (!_sql) {
    const { neon } = require('@neondatabase/serverless');
    _sql = neon(process.env.DATABASE_URL || 'postgresql://localhost/nodb');
  }
  return _sql;
}

export default function sql(strings: TemplateStringsArray, ...values: any[]) {
  return getSql()(strings, ...values);
}
