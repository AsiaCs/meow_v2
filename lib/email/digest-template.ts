// Inline-styled email template — most mail clients strip <style> blocks and
// only render inline CSS. No deps.

export interface DigestEvent {
  title: string
  startDate: Date
  location?: string | null
  isVirtual: boolean
  registrationUrl: string
  imageUrl?: string | null
  tags?: string[]
}

interface DigestData {
  firstName: string
  city: string | null
  events: DigestEvent[]
  unsubUrl: string
  webUrl: string
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatWhen(d: Date): string {
  return d.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

function renderEvent(ev: DigestEvent): string {
  const safeTitle = escapeHtml(ev.title)
  const when = escapeHtml(formatWhen(ev.startDate))
  const loc = ev.isVirtual ? "Virtual" : escapeHtml(ev.location ?? "")
  const url = escapeHtml(ev.registrationUrl)
  const thumb = ev.imageUrl
    ? `<img src="${escapeHtml(ev.imageUrl)}" width="96" height="96" alt="" style="display:block;border-radius:10px;object-fit:cover;border:1px solid #2a2a2a">`
    : `<div style="width:96px;height:96px;border-radius:10px;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%)"></div>`

  return `
  <tr>
    <td style="padding:0 0 16px 0">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#16161a;border:1px solid #232328;border-radius:14px">
        <tr>
          <td style="padding:14px" width="112" valign="top">${thumb}</td>
          <td style="padding:14px 14px 14px 0" valign="top">
            <div style="font:600 11px/1 -apple-system,Segoe UI,sans-serif;color:#8a8a92;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">${when}</div>
            <a href="${url}" style="font:600 15px/1.35 -apple-system,Segoe UI,sans-serif;color:#f4f4f5;text-decoration:none">${safeTitle}</a>
            ${loc ? `<div style="font:400 12px/1.4 -apple-system,Segoe UI,sans-serif;color:#9ca3af;margin-top:6px">${loc}</div>` : ""}
            <div style="margin-top:10px"><a href="${url}" style="display:inline-block;font:600 12px/1 -apple-system,Segoe UI,sans-serif;color:#fff;text-decoration:none;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);padding:8px 14px;border-radius:999px">RSVP →</a></div>
          </td>
        </tr>
      </table>
    </td>
  </tr>`
}

export function renderDigestHtml(d: DigestData): string {
  const heroSubtitle = d.city
    ? `Top events in ${escapeHtml(d.city)} this week`
    : "Top events this week"

  const eventRows = d.events.map(renderEvent).join("\n")

  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>meow weekly</title></head>
<body style="margin:0;padding:0;background:#0a0a0c;color:#f4f4f5;font-family:-apple-system,Segoe UI,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#0a0a0c">
    <tr><td align="center" style="padding:32px 16px">
      <table cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;width:100%">
        <tr><td style="padding-bottom:24px">
          <div style="font:700 22px/1 -apple-system,Segoe UI,sans-serif;background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;background-clip:text;color:transparent;display:inline-block">meow</div>
          <span style="font:500 11px/1 -apple-system,Segoe UI,sans-serif;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;margin-left:10px">weekly digest</span>
        </td></tr>

        <tr><td style="padding-bottom:18px">
          <h1 style="font:700 26px/1.2 -apple-system,Segoe UI,sans-serif;color:#f4f4f5;margin:0 0 6px 0">Hey ${escapeHtml(d.firstName)} 👋</h1>
          <p style="font:400 14px/1.5 -apple-system,Segoe UI,sans-serif;color:#a1a1aa;margin:0">${heroSubtitle}.</p>
        </td></tr>

        <tr><td style="padding-bottom:18px">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            ${eventRows}
          </table>
        </td></tr>

        <tr><td align="center" style="padding:14px 0 0 0;border-top:1px solid #1f1f23">
          <a href="${escapeHtml(d.webUrl)}" style="font:500 12px/1 -apple-system,Segoe UI,sans-serif;color:#a1a1aa;text-decoration:none;margin-right:14px">Open in meow</a>
          <a href="${escapeHtml(d.unsubUrl)}" style="font:500 12px/1 -apple-system,Segoe UI,sans-serif;color:#71717a;text-decoration:none">Unsubscribe</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`
}

export function renderDigestText(d: DigestData): string {
  const lines = [
    `meow — weekly digest`,
    ``,
    `Hey ${d.firstName},`,
    d.city ? `Top events in ${d.city} this week:` : `Top events this week:`,
    ``,
    ...d.events.map((e) => `- ${e.title}  (${formatWhen(e.startDate)})  ${e.registrationUrl}`),
    ``,
    `Open in meow: ${d.webUrl}`,
    `Unsubscribe: ${d.unsubUrl}`,
  ]
  return lines.join("\n")
}
