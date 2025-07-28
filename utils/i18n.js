// utils/i18n.js

/**
 * Function to localize HTML content by replacing __MSG_ placeholders with localized strings
 * This function processes all text nodes in the document to find and replace
 * localization placeholders with their corresponding translations from the messages.json files.
 */
function localizeHtml() {
  // Get all elements
  const elements = document.querySelectorAll('*');

  // Regular expression to find __MSG_messageName__ patterns
  const msgRegex = /__MSG_(\w+)__/g;

  // Process each element
  elements.forEach(element => {
    // Skip script elements
    if (element.tagName === 'SCRIPT') return;

    // Process text nodes directly under this element
    Array.from(element.childNodes)
      .filter(node => node.nodeType === Node.TEXT_NODE)
      .forEach(textNode => {
        const text = textNode.nodeValue;
        if (text && text.includes('__MSG_')) {
          // Replace all __MSG_messageName__ patterns with localized strings
          textNode.nodeValue = text.replace(msgRegex, (match, messageName) => {
            return chrome.i18n.getMessage(messageName) || match;
          });
        }
      });
  });
}
