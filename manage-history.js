// Initialize the WordHistoryService
let wordHistoryService;
let openRouterClient;
let savedPrompt;

// The localizeHtml function is now imported from utils/i18n.js

document.addEventListener('DOMContentLoaded', async function() {
  // Localize HTML content
  localizeHtml();

  // Initialize WordHistoryService
  try {
    wordHistoryService = new WordHistoryService();
    await wordHistoryService.init();
    loadHistoryEntries();
  } catch (error) {
    console.error('Failed to initialize WordHistoryService:', error);
    document.getElementById('history-container').innerHTML = 
      `<div class="error">${chrome.i18n.getMessage('errorPrefix')}Failed to load history. Please try again later.</div>`;
  }

  // Load OpenRouter API key, model, and prompt from storage
  chrome.storage.local.get(['openrouterApiKey', 'model', 'prompt'], function(result) {
    if (result.openrouterApiKey) {
      openRouterClient = new OpenRouterClient(result.openrouterApiKey, result.model || 'deepseek/deepseek-chat:free');
    }
    // Store the prompt or use a default if not available
    savedPrompt = result.prompt || 'Tell me more about the word "{word}" in the context: "{sentence}"';
  });
  
  // Export history to JSON functionality
  document.getElementById('export-history').addEventListener('click', async function() {
    try {
      // Get all entries (using a large limit to ensure we get everything)
      const allEntries = await wordHistoryService.getEntries(10000, true);

      // Convert to JSON
      const jsonData = JSON.stringify(allEntries, null, 2);

      // Create a Blob with the JSON data
      const blob = new Blob([jsonData], { type: 'application/json' });

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `word-tracker-history-${new Date().toISOString().split('T')[0]}.json`;

      // Append to the document, click it, and remove it
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Release the URL object
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export history to JSON:', error);
      alert('Failed to export history to JSON. See console for details.');
    }
  });
});

// Function to load and display all history entries
async function loadHistoryEntries() {
  try {
    document.getElementById('loading-history').style.display = 'block';

    // Get all entries (using a large limit to ensure we get everything)
    const entries = await wordHistoryService.getEntries(10000, true);

    const historyContainer = document.getElementById('history-container');

    if (entries.length === 0) {
      historyContainer.innerHTML = `<p>${chrome.i18n.getMessage('noHistoryEntries')}</p>`;
      return;
    }

    // Clear loading message
    document.getElementById('loading-history').style.display = 'none';

    // Create a container for the entries
    const entriesContainer = document.createElement('div');
    entriesContainer.id = 'entries-list';

    // Add each entry to the list
    entries.forEach(entry => {
      const entryElement = createHistoryEntryElement(entry);
      entriesContainer.appendChild(entryElement);
    });

    // Clear previous entries and add the new ones
    historyContainer.innerHTML = '';
    historyContainer.appendChild(entriesContainer);

  } catch (error) {
    console.error('Failed to load history entries:', error);
    document.getElementById('history-container').innerHTML = 
      `<div class="error">${chrome.i18n.getMessage('errorPrefix')}Failed to load history. Please try again later.</div>`;
  }
}

// Function to create a history entry element
function createHistoryEntryElement(entry) {
  const entryElement = document.createElement('div');
  entryElement.className = 'history-entry';
  entryElement.id = `entry-${entry.id}`;

  // Format date
  const date = new Date(entry.timestamp);
  const formattedDate = date.toLocaleString();

  let explanationFirstLine = entry.explanation ? entry.explanation.split('\n')[0] : '';
  explanationFirstLine = simpleMarkdownToHtml(explanationFirstLine.trim());

  let restLines = entry.explanation.split('\n').slice(1).join('\n');
  restLines = simpleMarkdownToHtml(restLines.trim());

  // Highlight the word in the sentence
  const sentenceWithHighlightedWord = entry.sentence ? 
    entry.sentence.replaceAll(new RegExp(`\\b${entry.word}\\b`, 'gi'), `<strong>${entry.word}</strong>`) : '';

  // Create the entry HTML with collapsible content
  entryElement.innerHTML = `
    <div class="history-entry-header clickable">
      <div class="toggle-indicator">▼</div>
      <div class="history-word">${explanationFirstLine}</div>
      <div style="flex:1"></div>
      <div class="history-timestamp">${formattedDate}</div>
    </div>
    <div class="entry-content">
      <div class="history-explanation">${restLines}</div>
      ${entry.sentence ? `<div class="history-sentence">"${sentenceWithHighlightedWord}"</div>` : ''}

      <div class="entry-actions">
        <button class="btn btn-edit" data-id="${entry.id}">${chrome.i18n.getMessage('buttonEdit')}</button>
        <button class="btn btn-delete" data-id="${entry.id}">${chrome.i18n.getMessage('buttonDelete')}</button>
        <button class="btn btn-reexplain" data-id="${entry.id}">${chrome.i18n.getMessage('buttonReexplain')}</button>
      </div>

      <!-- Edit Form -->
      <div class="edit-form" id="edit-form-${entry.id}">
        <label for="edit-word-${entry.id}">${chrome.i18n.getMessage('labelWord')}</label>
        <input type="text" id="edit-word-${entry.id}" value="${entry.word}">

        <label for="edit-sentence-${entry.id}">${chrome.i18n.getMessage('labelSentence')}</label>
        <textarea id="edit-sentence-${entry.id}" rows="2">${entry.sentence || ''}</textarea>

        <label for="edit-explanation-${entry.id}">${chrome.i18n.getMessage('labelExplanation')}</label>
        <textarea id="edit-explanation-${entry.id}" rows="5">${entry.explanation || ''}</textarea>

        <div class="entry-actions">
          <button class="btn btn-save" data-id="${entry.id}">${chrome.i18n.getMessage('buttonSave')}</button>
          <button class="btn btn-cancel" data-id="${entry.id}">${chrome.i18n.getMessage('buttonCancel')}</button>
        </div>
      </div>

      <!-- Re-explain Form -->
      <div class="reexplain-form" id="reexplain-form-${entry.id}">
        <label for="reexplain-prompt-${entry.id}">${chrome.i18n.getMessage('labelPromptTemplate')}</label>
        <textarea id="reexplain-prompt-${entry.id}" rows="8">${savedPrompt}</textarea>

        <div class="entry-actions">
          <button class="btn btn-reexplain-submit" data-id="${entry.id}">${chrome.i18n.getMessage('buttonSubmit')}</button>
          <button class="btn btn-cancel-reexplain" data-id="${entry.id}">${chrome.i18n.getMessage('buttonCancel')}</button>
        </div>

        <div class="loading" id="reexplain-loading-${entry.id}" style="display: none;">${chrome.i18n.getMessage('loadingExplanation')}</div>

        <div class="reexplain-response" id="reexplain-response-${entry.id}"></div>

        <div class="entry-actions" id="reexplain-response-actions-${entry.id}" style="display: none;">
          <button class="btn btn-save-response" data-id="${entry.id}">${chrome.i18n.getMessage('buttonSaveToHistory')}</button>
        </div>
      </div>
    </div>
  `;

  // Add event listeners after the element is created
  setTimeout(() => {
    // Add click event to the header to toggle content visibility
    const header = entryElement.querySelector('.history-entry-header');
    const content = entryElement.querySelector('.entry-content');
    const indicator = entryElement.querySelector('.toggle-indicator');

    // Start with content collapsed
    content.style.display = 'none';
    indicator.textContent = '▶';

    header.addEventListener('click', function() {
      // Toggle the visibility of the content
      if (content.style.display === 'none') {
        content.style.display = 'block';
        indicator.textContent = '▼';
      } else {
        content.style.display = 'none';
        indicator.textContent = '▶';
      }
    });

    // Edit button
    entryElement.querySelector('.btn-edit').addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const editForm = document.getElementById(`edit-form-${id}`);
      if (editForm.style.display === 'block') {
        editForm.style.display = 'none';
      } else {
        editForm.style.display = 'block';
      }
    });

    // Delete button
    entryElement.querySelector('.btn-delete').addEventListener('click', async function() {
      const id = parseInt(this.getAttribute('data-id'));
      try {
        await wordHistoryService.deleteEntry(id);
        document.getElementById(`entry-${id}`).remove();
      } catch (error) {
        console.error('Failed to delete entry:', error);
        alert(chrome.i18n.getMessage('errorPrefix') + 'Failed to delete entry. Please try again.');
      }
    });

    // Re-explain button
    entryElement.querySelector('.btn-reexplain').addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      const reexplainForm = document.getElementById(`reexplain-form-${id}`);
      if (reexplainForm.style.display === 'block') {
        reexplainForm.style.display = 'none';
      } else {
        document.getElementById(`reexplain-form-${id}`).style.display = 'block';
      }
    });

    // Save button (for edit form)
    entryElement.querySelector('.btn-save').addEventListener('click', async function() {
      const id = parseInt(this.getAttribute('data-id'));
      const wordInput = document.getElementById(`edit-word-${id}`);
      const sentenceInput = document.getElementById(`edit-sentence-${id}`);
      const explanationInput = document.getElementById(`edit-explanation-${id}`);

      try {
        const updatedEntry = await wordHistoryService.updateEntry(id, {
          word: wordInput.value.trim(),
          sentence: sentenceInput.value.trim(),
          explanation: explanationInput.value.trim()
        });

        // Replace the current entry with an updated one
        const updatedEntryElement = createHistoryEntryElement(updatedEntry);
        document.getElementById(`entry-${id}`).replaceWith(updatedEntryElement);
      } catch (error) {
        console.error('Failed to update entry:', error);
        alert(chrome.i18n.getMessage('errorPrefix') + 'Failed to update entry. Please try again.');
      }
    });

    // Cancel button (for edit form)
    entryElement.querySelector('.btn-cancel').addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      document.getElementById(`edit-form-${id}`).style.display = 'none';
    });

    // Submit button (for re-explain form)
    entryElement.querySelector('.btn-reexplain-submit').addEventListener('click', async function() {
      const id = this.getAttribute('data-id');
      const promptInput = document.getElementById(`reexplain-prompt-${id}`);
      const loadingElement = document.getElementById(`reexplain-loading-${id}`);
      const responseElement = document.getElementById(`reexplain-response-${id}`);
      const responseActionsElement = document.getElementById(`reexplain-response-actions-${id}`);

      if (!openRouterClient) {
        alert(chrome.i18n.getMessage('apiKeyNotSet'));
        return;
      }

      try {
        // Show loading indicator
        loadingElement.style.display = 'block';
        responseElement.style.display = 'none';
        responseActionsElement.style.display = 'none';

        // Get the entry data from the DOM
        const word = document.querySelector(`#entry-${id} .history-word`).textContent;
        const sentenceElement = document.querySelector(`#entry-${id} .history-sentence`);
        const sentence = sentenceElement ? sentenceElement.textContent.replace(/^"|"$/g, '').replace(/<\/?strong>/g, '') : '';

        // Replace placeholders in the prompt template
        const finalPrompt = promptInput.value
          .replace(/{word}/g, word)
          .replace(/{sentence}/g, sentence);

        // Send prompt for re-explanation
        const response = await openRouterClient.completion(finalPrompt);
        const reexplainResponse = response.choices[0].message.content;

        // Display the response
        responseElement.innerHTML = simpleMarkdownToHtml(reexplainResponse);
        responseElement.style.display = 'block';
        responseActionsElement.style.display = 'flex';

        // Store the response for later use
        responseElement.setAttribute('data-response', reexplainResponse);
      } catch (error) {
        console.error('Failed to get re-explanation:', error);
        responseElement.innerHTML = `<div class="error">${chrome.i18n.getMessage('errorPrefix')}${error.message}</div>`;
        responseElement.style.display = 'block';
      } finally {
        loadingElement.style.display = 'none';
      }
    });

    // Cancel button (for re-explain form)
    entryElement.querySelector('.btn-cancel-reexplain').addEventListener('click', function() {
      const id = this.getAttribute('data-id');
      document.getElementById(`reexplain-form-${id}`).style.display = 'none';
    });

    // Save response button
    entryElement.querySelector('.btn-save-response').addEventListener('click', async function() {
      const id = parseInt(this.getAttribute('data-id'));
      const responseElement = document.getElementById(`reexplain-response-${id}`);
      const reexplainResponse = responseElement.getAttribute('data-response');

      try {
        // Get the current entry
        const entry = await wordHistoryService.updateEntry(id, {
          explanation: reexplainResponse
        });

        // Replace the current entry with an updated one
        const updatedEntryElement = createHistoryEntryElement(entry);
        document.getElementById(`entry-${id}`).replaceWith(updatedEntryElement);

        // Hide the re-explain form
        document.getElementById(`reexplain-form-${id}`).style.display = 'none';
      } catch (error) {
        console.error('Failed to update entry with re-explanation:', error);
        alert(chrome.i18n.getMessage('errorPrefix') + 'Failed to save re-explanation. Please try again.');
      }
    });
  }, 0);

  return entryElement;
}