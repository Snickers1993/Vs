import DOMPurify from "dompurify";

export function sanitizeRichTextHtml(html: string): string {
  if (!html) {
    return "";
  }

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
  });
}
