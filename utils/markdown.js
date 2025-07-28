/**
 * Simple markdown parser that converts basic markdown syntax to HTML
 * @param {string} md - The markdown text to convert
 * @return {string} The HTML converted text
 */
function simpleMarkdownToHtml(md) {
  const html = md
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.+?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/\r\n|\r|\n/g, '<br>');                   // newline
  return sanitizeHtml(html);
}

/**
 * Sanitize HTML to prevent XSS attacks (works in background.js)
 * @param {string} html - The HTML to sanitize
 * @returns {string} The sanitized HTML
 */
function sanitizeHtml(html) {
  const allowedTags = ['strong', 'em', 'br'];

  // Escape all tags
  let sanitized = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Allow only known tags (without attributes)
  for (const tag of allowedTags) {
    const tagPattern = new RegExp(`&lt;(${tag})&gt;`, 'gi');
    const endTagPattern = new RegExp(`&lt;\/(${tag})&gt;`, 'gi');

    sanitized = sanitized
        .replace(tagPattern, `<$1>`)
        .replace(endTagPattern, `</$1>`);
  }

  return sanitized;
}
