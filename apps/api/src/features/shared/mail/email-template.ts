const SPARK = "#FF4500";
const INK = "#0F172A";
const LINE = "#E2E8F0";
const MUTED = "#475569";

export const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export interface EmailContent {
  heading: string;
  paragraphs: string[];
  actionLabel?: string;
  actionUrl?: string;
  footerNote?: string;
}

/**
 * The one transactional layout: a plain, readable message with a single
 * primary action. Table-based so Outlook renders it, and no external images so
 * a clinic firewall cannot turn the mail into a blank box.
 */
export const buildEmailHtml = (content: EmailContent): string => {
  const body = content.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin: 0 0 16px; font-size: 15px; line-height: 24px; color: ${INK};">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const action =
    content.actionUrl === undefined || content.actionLabel === undefined
      ? ""
      : `<p style="margin: 24px 0;"><a href="${content.actionUrl}" style="display: inline-block; background: ${SPARK}; color: ${INK}; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 22px; border-radius: 6px;">${escapeHtml(content.actionLabel)}</a></p>`;
  const footer =
    content.footerNote === undefined
      ? ""
      : `<p style="margin: 0 0 8px; font-size: 12px; line-height: 18px; color: ${MUTED};">${escapeHtml(content.footerNote)}</p>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(content.heading)}</title>
  </head>
  <body style="margin: 0; padding: 24px; background: #F8FAFC; font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border: 1px solid ${LINE}; border-radius: 12px;">
      <tr>
        <td style="padding: 20px 24px; border-bottom: 1px solid ${LINE};">
          <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: ${INK};">Hermes Care</span>
        </td>
      </tr>
      <tr>
        <td style="padding: 28px 24px;">
          <h1 style="margin: 0 0 16px; font-size: 20px; line-height: 28px; color: ${INK};">${escapeHtml(content.heading)}</h1>
          ${body}
          ${action}
          ${footer}
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px; border-top: 1px solid ${LINE};">
          <p style="margin: 0; font-size: 11px; line-height: 16px; color: ${MUTED};">
            Hermes Care sends this because you or your clinic use the care loop.
            Never share sign-in codes or links with anyone.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
};
