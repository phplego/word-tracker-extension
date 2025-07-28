// background.js

// Import the OpenRouterClient script, WordHistoryService, and utilities
importScripts('ai/openrouter/openrouter.js');
importScripts('services/WordHistoryService.js');
importScripts('utils/markdown.js');

// Initialize the WordHistoryService
const wordHistoryService = new WordHistoryService();
wordHistoryService.init().catch(error => {
  console.error('Failed to initialize WordHistoryService:', error);
});

// When the extension is installed, initialize the state and create the context menu
chrome.runtime.onInstalled.addListener(() => {
  // Set the initial state to enabled
  chrome.storage.local.set({ isEnabled: true });

  // Create the explain menu item for selected text
  chrome.contextMenus.create({
    id: "explainSelection",
    title: chrome.i18n.getMessage('contextMenuExplain'),
    contexts: ["selection"],
    documentUrlPatterns: ["*://*/*","file:///*/*"], // apply the pattern to exclude chrome-extension:// URLs (yes, magic)
  });

  console.log('Word Tracker extension installed and context menu created.');
});



// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "explainSelection" && info.selectionText) {
    // Handle the explain selection action
    chrome.storage.local.get(['openrouterApiKey', 'model', 'prompt', 'isEnabled'], (data) => {
      if (!data.isEnabled) {
        console.log('Plugin is disabled, not processing explanation request');
        return;
      }

      if (!data.openrouterApiKey) {
        console.log('OpenRouter API key not set');
        // Notify the user that the API key is not set
        chrome.tabs.sendMessage(tab.id, {
          action: 'showExplanation',
          explanation: chrome.i18n.getMessage('apiKeyNotSet'),
          error: true
        });
        return;
      }

      // Send a message to the content script to get the sentence context
      chrome.tabs.sendMessage(tab.id, {
        action: 'getSelectionContext',
        selectedText: info.selectionText
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending message:', JSON.stringify(chrome.runtime.lastError), "possibly need to reload the page");
          return;
        }

        if (response && response.sentence) {
          // Process the explanation request
          processExplanationRequest(tab.id, info.selectionText, response.sentence, data.openrouterApiKey, data.prompt, data.model);
        } else {
          console.log('Could not get sentence context');
          // Still try to process with just the selected text
          processExplanationRequest(tab.id, info.selectionText, '', data.openrouterApiKey, data.prompt, data.model);
        }
      });
    });
  }
});

// Function to process the explanation request
async function processExplanationRequest(tabId, selectedText, sentence, apiKey, promptTemplate, model) {
  try {
    // Show loading message
    chrome.tabs.sendMessage(tabId, {
      action: 'showExplanation',
      explanation: chrome.i18n.getMessage('loadingExplanation'),
      loading: true
    });

    // Create the prompt by replacing placeholders
    const prompt = promptTemplate
      .replace('{word}', selectedText)
      .replace('{sentence}', sentence || selectedText);

    // Create a client instance
    const client = new OpenRouterClient(apiKey, model);

    // Get the completion
    const response = await client.completion(prompt);

    // Extract the explanation from the response
    let explanation = response.choices && response.choices[0] && response.choices[0].message
      ? response.choices[0].message.content
      : chrome.i18n.getMessage('noExplanationAvailable');

    // Trim the explanation to remove unnecessary whitespace/NL if any
    explanation = explanation.trim();
    explanation = sanitizeHtml(explanation); // Sanitize to prevent XSS

    // Store the explanation in history
    try {
      await wordHistoryService.addEntry(selectedText, explanation, sentence);
    } catch (historyError) {
      console.error('Failed to add explanation to history:', historyError);
    }

    // Send the explanation to the content script
    chrome.tabs.sendMessage(tabId, {
      action: 'showExplanation',
      explanation: explanation,
    });

  } catch (error) {
    // Send error message to content script
    chrome.tabs.sendMessage(tabId, {
      action: 'showExplanation',
      explanation: chrome.i18n.getMessage('errorPrefix') + error.message,
      error: true
    });
  }
}
