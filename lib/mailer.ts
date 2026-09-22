// lib/mailer.ts — E-Mail-Versand via SMTP (nodemailer) oder Console-Fallback
// Env: SMTP_HOST, SMTP_PORT (default 465), SMTP_USER, SMTP_PASS, MAIL_FROM (default hello@fachschmiede.de)
import nodemailer from 'nodemailer'

let transporter: any = null

function getTransporter() {
  if (transporter) return transporter
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '465', 10),
    secure: (parseInt(SMTP_PORT || '465', 10) === 465),
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  })
  return transporter
}

export async function sendMail(opts: { to: string; subject: string; html: string; text?: string }): Promise<boolean> {
  const t = getTransporter()
  if (!t) {
    console.log('[mailer] SMTP nicht konfiguriert – Mail nicht versendet:', opts.to, '|', opts.subject)
    return false
  }
  try {
    await t.sendMail({
      from: `fachschmiede.de <${process.env.MAIL_FROM || 'hello@fachschmiede.de'}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    })
    return true
  } catch (err) {
    console.error('[mailer] Fehler:', err)
    return false
  }
}

// ── Templates ──

export function leadMailToTenant(data: { tenantName: string; company: string; city: string; trade: string; leadName: string; leadPhone: string; leadMessage: string; pageUrl: string }): { subject: string; html: string } {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return {
    subject: `🔔 Neue Anfrage auf Ihrer Seite (${esc(data.city)})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#1a2b3c;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <strong style="font-size:18px">Neue Kundenanfrage! 🔔</strong><br>
          <span style="font-size:13px;opacity:.8">${esc(data.trade)} · ${esc(data.city)}</span>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
          <p>Hallo ${esc(data.tenantName)},</p>
          <p>über Ihre Mietseite <strong>${esc(data.pageUrl)}</strong> ist eine neue Anfrage eingegangen:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;width:110px">Name</td><td style="padding:8px 12px">${esc(data.leadName)}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold">Telefon</td><td style="padding:8px 12px"><a href="tel:${esc(data.leadPhone)}">${esc(data.leadPhone)}</a></td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;vertical-align:top">Nachricht</td><td style="padding:8px 12px;white-space:pre-line">${esc(data.leadMessage)}</td></tr>
          </table>
          <p style="font-size:13px;color:#6b7280">Tipp: Rufen Sie zeitnah zurück – Anfragen, die innerhalb einer Stunde beantwortet werden, werden am häufigsten zu Aufträgen.</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0">
          <p style="font-size:12px;color:#9ca3af">Ihre fachschmiede.de Mietseite · <a href="https://www.fachschmiede.de/mieter.html">Dashboard</a></p>
        </div>
      </div>`,
  }
}

export function welcomeMailTenant(data: { name: string; email: string; password: string; pageUrl: string; trade: string; city: string; trialEnds?: string }): { subject: string; html: string } {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return {
    subject: `🎉 Willkommen bei fachschmiede.de – Ihre Seite ${esc(data.city)} ist live!`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto">
        <div style="background:#16a34a;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
          <strong style="font-size:18px">Willkommen an Bord! 🎉</strong><br>
          <span style="font-size:13px;opacity:.9">${esc(data.trade)} · ${esc(data.city)}</span>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:0;padding:24px;border-radius:0 0 12px 12px">
          <p>Hallo ${esc(data.name)},</p>
          <p>Ihre Mietseite <strong><a href="${esc(data.pageUrl)}">${esc(data.pageUrl)}</a></strong> ist jetzt mit Ihren Daten online.</p>
          ${data.trialEnds ? `<p style="background:#f0fdf4;border:1px solid #bbf7d0;padding:12px 16px;border-radius:8px">🎁 <strong>Testphase bis ${esc(data.trialEnds)}</strong> – danach läuft die Miete weiter. Jederzeit im Dashboard kündbar.</p>` : ''}
          <h3 style="margin:20px 0 8px">Ihre Zugangsdaten</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold;width:110px">Dashboard</td><td style="padding:8px 12px"><a href="https://www.fachschmiede.de/mieter.html">fachschmiede.de/mieter.html</a></td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold">E-Mail</td><td style="padding:8px 12px">${esc(data.email)}</td></tr>
            <tr><td style="padding:8px 12px;background:#f8fafc;font-weight:bold">Passwort</td><td style="padding:8px 12px;font-family:monospace">${esc(data.password)}</td></tr>
          </table>
          <p>Im Dashboard können Sie Firmennamen, Telefonnummer, WhatsApp, E-Mail und Texte jederzeit selbst ändern.</p>
          <p style="font-size:12px;color:#9ca3af">Fragen? Antworten Sie einfach auf diese E-Mail.</p>
        </div>
      </div>`,
  }
}
