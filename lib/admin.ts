export const ADMIN_EMAILS = ['mastenbroekrobertjan@gmail.com'];

export function isAdminRequest(request: Request): boolean {
  const cookieHeader = request.headers.get('cookie') || '';
  const sessionMatch = cookieHeader.match(/session=([^;]+)/);
  if (!sessionMatch) return false;
  try {
    const [payload] = sessionMatch[1].split('.');
    const session = JSON.parse(Buffer.from(payload, 'base64').toString());
    return ADMIN_EMAILS.includes(session.email);
  } catch { return false; }
}
