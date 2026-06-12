/* ───────────────────────────────────────────────────────────────────────
 * Proto alert email template (React port)
 *
 * Faithful TS port of the prototype's email-template.js (Figma node
 * 1173:5715). Brand chrome — logo bar, body grid, divider, address block,
 * social icons, legal links — is verbatim from the design; the alert payload
 * fills the headline / paragraph / CTA. Used to render a true rich-text
 * preview inside the Add rule modal (dropped into an <iframe srcDoc>).
 *
 * HTML email constraints honored: table-based layout, inline styles only,
 * 600px max width, web-safe font stack, renders without external images.
 * ─────────────────────────────────────────────────────────────────────── */

import type { NotificationSeverity } from "@/protoFleet/features/notifications/lib/seedNotificationActivity";

export interface AlertEmailInput {
  subject: string;
  /** Headline copy — typically the notification summary. */
  headline: string;
  /** Where the alert fired, e.g. "fleet-wide across 3 sites" or "Denver". */
  scopePhrase: string;
  severity: NotificationSeverity;
  ruleName?: string;
  channelNames?: string[];
  recipientNames?: string[];
  dashboardUrl?: string;
}

// ── Brand tokens lifted from the Figma variables on node 1173:5715.
const FONT = `'Inter Tight', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`;
const TEXT_PRIMARY = "rgba(0,0,0,0.9)"; // Text/Primary
const TEXT_PRIMARY_30 = "rgba(0,0,0,0.3)"; // Text/Primary 30
const BORDER_10 = "rgba(0,0,0,0.1)"; // Border/Border 10
const CONTRAST = "#ffffff"; // Text/Contrast

// Inline SVGs so the email renders without external assets.
const LOGO_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" width="94" height="24" viewBox="0 0 94 24" fill="none">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M10.365.13C9.42.33 8.52.836 6.74 1.85L4.934 2.879C3.135 3.903 2.234 4.416 1.58 5.135.99 5.776.55 6.531.301 7.336 0 8.255 0 9.288 0 11.351v1.317c0 2.071 0 3.107.304 4.033.27.819.71 1.571 1.296 2.208.66.72 1.566 1.232 3.379 2.253l1.811 1.02c1.765.997 2.65 1.495 3.588 1.69a6.17 6.17 0 0 0 2.514 0c.937-.197 1.82-.694 3.586-1.692l1.792-1.012c1.81-1.02 2.717-1.534 3.376-2.252.58-.636 1.022-1.39 1.293-2.207.304-.926.304-1.961.304-4.03v-1.327c0-2.058 0-3.089-.301-4.008a4.063 4.063 0 0 0-1.282-2.202c-.653-.718-1.55-1.231-3.346-2.256L17.523 1.85C15.738.84 14.844.33 13.9.13a6.17 6.17 0 0 0-2.535 0ZM8.337 8.97a3.032 3.032 0 1 0 0 6.063h6.568a3.032 3.032 0 0 0 0-6.063H8.337Z" fill="${TEXT_PRIMARY}"/>
    <text x="30" y="17" font-family="${FONT}" font-size="16" font-weight="500" fill="${TEXT_PRIMARY}" letter-spacing="-0.3">proto</text>
  </svg>`;

const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M9.4 6.8 14.5 1h-1.2L8.9 6.04 5.4 1H1.3l5.36 7.8L1.3 15h1.2l4.7-5.46L11 15h4.1L9.4 6.8Zm-1.66 1.93-.54-.78L2.94 1.9h1.85L8.22 6.8l.55.78 4.55 6.5h-1.85L7.74 8.73Z" fill="${TEXT_PRIMARY}"/></svg>`;
const ICON_LI = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M13.6 13.6h-2.36V9.91c0-.88-.02-2.01-1.23-2.01-1.22 0-1.41.96-1.41 1.95v3.75H6.24v-7.6h2.27v1.04h.03c.32-.6 1.1-1.23 2.26-1.23 2.4 0 2.85 1.58 2.85 3.64v4.15Zm-9.98-8.64a1.37 1.37 0 1 1 0-2.74 1.37 1.37 0 0 1 0 2.74Zm1.18 8.64H2.43v-7.6H4.8v7.6ZM14.78 0H1.22C.55 0 0 .54 0 1.2v13.6c0 .67.55 1.2 1.22 1.2h13.56c.67 0 1.22-.53 1.22-1.2V1.2C16 .54 15.45 0 14.78 0Z" fill="${TEXT_PRIMARY}"/></svg>`;
const ICON_YT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M15.66 4.14a2 2 0 0 0-1.41-1.42C13 2.4 8 2.4 8 2.4s-5 0-6.25.32A2 2 0 0 0 .34 4.14C.02 5.4.02 8 .02 8s0 2.6.32 3.86c.18.7.73 1.24 1.41 1.42C3 13.6 8 13.6 8 13.6s5 0 6.25-.32a2 2 0 0 0 1.41-1.42c.32-1.26.32-3.86.32-3.86s0-2.6-.32-3.86ZM6.4 10.4V5.6L10.6 8 6.4 10.4Z" fill="${TEXT_PRIMARY}"/></svg>`;

const escapeHtml = (s: string): string =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

const fmtWhen = (date: Date): string =>
  date.toLocaleString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const joinNames = (names: string[]): string =>
  names.length === 1
    ? escapeHtml(names[0])
    : names.slice(0, -1).map(escapeHtml).join(", ") + " and " + escapeHtml(names[names.length - 1]);

// Natural-language body prose so the visual matches the design — a single
// block of copy below the headline, no labeled list.
const bodyParagraph = (input: AlertEmailInput): string => {
  const parts: string[] = [];
  parts.push(`On ${fmtWhen(new Date())}, ${escapeHtml(input.scopePhrase)} triggered an alert.`);
  if (input.ruleName) {
    parts.push(
      `This was matched by your <strong style="font-weight:500;color:${TEXT_PRIMARY};">${escapeHtml(input.ruleName)}</strong> rule.`,
    );
  }
  if (input.channelNames?.length) {
    parts.push(`Delivered to ${joinNames(input.channelNames)}.`);
  }
  if (input.recipientNames?.length) {
    parts.push(`Notifying ${joinNames(input.recipientNames)}.`);
  }
  return parts.join(" ");
};

export const renderAlertEmail = (input: AlertEmailInput): string => {
  const headline = input.headline;
  const body = bodyParagraph(input);
  const dashUrl = input.dashboardUrl || "https://app.protofleet.example/inbox";
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(input.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${FONT};color:${TEXT_PRIMARY};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;padding:0;">
    <tr><td align="center" style="padding:0 24px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- Logo Bar -->
        <tr><td style="padding:24px 0 24px 0;height:72px;">
          ${LOGO_SVG}
        </td></tr>

        <tr><td style="height:48px;line-height:48px;font-size:0;">&nbsp;</td></tr>

        <!-- Headline -->
        <tr><td style="padding:0 0 32px 0;">
          <h1 style="margin:0;font-family:${FONT};font-size:28px;font-weight:500;line-height:1.3;letter-spacing:-0.2px;color:${TEXT_PRIMARY};max-width:560px;">
            ${escapeHtml(headline)}
          </h1>
        </td></tr>

        <!-- Body paragraph -->
        <tr><td style="padding:0 0 32px 0;">
          <p style="margin:0;font-family:${FONT};font-size:16px;font-weight:400;line-height:1.45;color:${TEXT_PRIMARY};max-width:560px;">
            ${body}
          </p>
        </td></tr>

        <!-- Primary CTA -->
        <tr><td style="padding:0 0 64px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:${TEXT_PRIMARY};border-radius:6px;">
              <a href="${escapeHtml(dashUrl)}" style="display:inline-block;padding:16px 24px;color:${CONTRAST};font-family:${FONT};font-size:16px;font-weight:500;line-height:20px;text-decoration:none;letter-spacing:-0.1px;">View in Proto Fleet</a>
            </td></tr>
          </table>
        </td></tr>

        <!-- Divider -->
        <tr><td style="border-top:1px solid ${BORDER_10};height:0;line-height:0;font-size:0;">&nbsp;</td></tr>

        <!-- Address block -->
        <tr><td style="padding:32px 0 0 0;">
          <div style="font-family:${FONT};font-size:14px;line-height:1.45;color:${TEXT_PRIMARY};">
            Proto<br>
            1955 Broadway, Suite 600<br>
            Oakland, CA 94612<br>
            USA
          </div>
        </td></tr>

        <!-- Socials -->
        <tr><td style="padding:32px 0 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="padding-right:16px;"><a href="https://x.com/" style="text-decoration:none;">${ICON_X}</a></td>
              <td style="padding-right:16px;"><a href="https://www.linkedin.com/" style="text-decoration:none;">${ICON_LI}</a></td>
              <td><a href="https://www.youtube.com/" style="text-decoration:none;">${ICON_YT}</a></td>
            </tr>
          </table>
        </td></tr>

        <!-- Text links -->
        <tr><td style="padding:32px 0 32px 0;">
          <div style="font-family:${FONT};font-size:14px;line-height:1.45;color:${TEXT_PRIMARY};">
            <a href="${escapeHtml(dashUrl)}/legal/privacy" style="color:${TEXT_PRIMARY};text-decoration:underline;">Privacy Policy</a>
          </div>
          <div style="font-family:${FONT};font-size:14px;line-height:1.45;color:${TEXT_PRIMARY};margin-top:8px;">
            <a href="${escapeHtml(dashUrl)}/settings/notifications" style="color:${TEXT_PRIMARY};text-decoration:underline;">Unsubscribe or manage your preferences</a>
          </div>
          <div style="font-family:${FONT};font-size:14px;line-height:1.45;color:${TEXT_PRIMARY_30};margin-top:8px;">
            © ${year} Proto Global LLC. All rights reserved.
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};
