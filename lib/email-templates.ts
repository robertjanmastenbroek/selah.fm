/**
 * Selah.fm — Email Templates
 * Light-themed, professional, with logo.
 */

const LOGO_URL = 'https://selah.fm/images/Selah Logo Transparant.png';
const PRIMARY = '#5B7FFF';
const TEXT = '#1A1A2E';
const MUTED = '#6B7280';
const BG = '#FFFFFF';
const BORDER = '#E5E7EB';

export function emailWrapper({ title, body, cta }: { title: string; body: string; cta?: { text: string; url: string } }) {
  const ctaHtml = cta
    ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;padding:14px 32px;background:${PRIMARY};color:#FFFFFF;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px">${cta.text}</a>`
    : '';

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG}">
    <tr><td align="center" style="padding:40px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BG};border:1px solid ${BORDER};border-radius:16px;overflow:hidden">

        <!-- Header -->
        <tr><td style="padding:32px 32px 0;text-align:center">
          <img src="${LOGO_URL}" alt="Selah.fm" style="height:36px;width:auto;margin-bottom:24px" />
          <h1 style="font-size:22px;font-weight:700;color:${TEXT};margin:0 0 12px;line-height:1.3">${title}</h1>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:8px 32px 32px">
          <div style="font-size:15px;line-height:1.7;color:${MUTED}">
            ${body.replace(/\n/g, '<br>')}
          </div>
          ${ctaHtml ? `<div style="text-align:center">${ctaHtml}</div>` : ''}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:0 32px 32px;text-align:center">
          <div style="border-top:1px solid ${BORDER};padding-top:24px;font-size:12px;color:${MUTED}">
            <p style="margin:0 0 4px">— The Selah.fm team</p>
            <p style="margin:0"><a href="https://selah.fm" style="color:${PRIMARY};text-decoration:none">selah.fm</a></p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Quick transactional email (no logo header, simpler) */
export function emailSimple({ body }: { body: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:system-ui,-apple-system,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG}">
    <tr><td align="center" style="padding:32px 16px">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BG};border:1px solid ${BORDER};border-radius:16px;overflow:hidden">
        <tr><td style="padding:32px">
          <div style="font-size:15px;line-height:1.7;color:${MUTED}">
            ${body.replace(/\n/g, '<br>')}
          </div>
        </td></tr>
        <tr><td style="padding:0 32px 24px;text-align:center">
          <div style="border-top:1px solid ${BORDER};padding-top:20px;font-size:12px;color:${MUTED}">
            <p style="margin:0"><a href="https://selah.fm" style="color:${PRIMARY};text-decoration:none">selah.fm</a></p>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
