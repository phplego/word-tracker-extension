// Initialize the WordHistoryService
let wordHistoryService;

// Define default prompts for each language
const DEFAULT_PROMPTS = {
  en: `Give the transcription of the word "{word}" from the sentence "{sentence}" and translate the sentence into English.
Make the word **bold** in the translated text.

Example:
\`\`\`
**rápido** /ˈrapido/ fast, rapid
The train is very **fast** and will arrive soon.
\`\`\`

without wrapping "\`\`\`"`,
  // --------------------
  ru: `Give the transcription of the word "{word}" from the sentence "{sentence}" and translate the sentence into Russian.
And make the word **bold** in the translated text.

Example:
\`\`\`
**vaguely** /ˈveɪɡli/ - смутно, расплывчато
Модсли повернул голову, **смутно** посмотрел в сторону Кармоди, затем вернулся к разговору.
\`\`\`

without wrapping "\`\`\`"`,
  // --------------------
  th: `Give the transcription of the word "{word}" from the sentence "{sentence}" and translate the sentence into Thai.
And make the word **bold** in the translated text.

Example:
\`\`\`
**squelched** [skwɛltʃt] - เหยียบอย่างเปียกแฉะ, เดินลุยน้ำ 
เขา**ย่ำเท้าอย่างเปียกแฉะ**ข้ามพื้นผิวที่ชื้นของแท่นข้ามมิติ พยายามไม่คิดว่ามีอะไรซึมออกมาระหว่างนิ้วเท้าของเขา.
\`\`\`

without wrapping "\`\`\`"`
};

document.addEventListener('DOMContentLoaded', async function() {
  // Localize HTML content
  localizeHtml();

  const isEnabledCheckbox = document.getElementById('isEnabled');
  const openrouterApiKey = document.getElementById('openrouter-api-key');
  const modelSelector = document.getElementById('model-selector');
  const fetchModelsBtn = document.getElementById('fetch-models-btn');
  const prompt = document.getElementById('prompt');
  const status = document.getElementById('status');
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  let timeoutId;

  // Initialize WordHistoryService
  try {
    wordHistoryService = new WordHistoryService();
    await wordHistoryService.init();
    loadHistoryEntries();
  } catch (error) {
    console.error('Failed to initialize WordHistoryService:', error);
  }

  // Tab switching functionality
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');

      // Update active tab button
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      button.classList.add('active');

      // Show the selected tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName) {
          content.classList.add('active');
        }
      });
    });
  });

  // Add event listeners for reset prompt links
  document.querySelectorAll('.reset-prompt').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.stopPropagation(); // Prevent the click from toggling the entry expansion
      const lang = button.getAttribute('data-lang');
      prompt.value = DEFAULT_PROMPTS[lang];
      handleInputChange();
    });
  });

  // Load saved settings
  chrome.storage.local.get(['isEnabled', 'openrouterApiKey', 'model', 'prompt', 'cachedModels'], function(result) {
    isEnabledCheckbox.checked = result.isEnabled ?? true;
    openrouterApiKey.value = result.openrouterApiKey ?? '';
    // Use the browser's locale to determine which default prompt to use
    const locale = chrome.i18n.getUILanguage().split('-')[0];
    let defaultPrompt = DEFAULT_PROMPTS.en;
    if (locale in DEFAULT_PROMPTS) {
        defaultPrompt = DEFAULT_PROMPTS[locale];
    }
    prompt.value = result.prompt || defaultPrompt;

    // Check if we have cached models
    if (result.cachedModels && Array.isArray(result.cachedModels) && result.cachedModels.length > 0) {
      // Populate the model selector with cached models
      populateModelSelector(result.cachedModels, result.model);
    }
  });

  const handleInputChange = () => {
    status.textContent = chrome.i18n.getMessage('statusChanged');
    status.style.color = '#db7b00';
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const settings = {
        isEnabled: isEnabledCheckbox.checked,
        openrouterApiKey: openrouterApiKey.value.trim(),
        model: modelSelector.value,
        prompt: prompt.value
      };
      chrome.storage.local.set(settings, function() {
        status.textContent = chrome.i18n.getMessage('statusSaved');
        status.style.color = 'green';
      });
    }, 500);
  };

  isEnabledCheckbox.addEventListener('change', handleInputChange);
  openrouterApiKey.addEventListener('input', handleInputChange);
  modelSelector.addEventListener('change', handleInputChange);
  prompt.addEventListener('input', function() {
    handleInputChange();
  });

  // Function to populate model selector with models
  function populateModelSelector(models, currentModel) {
    // Clear existing options
    modelSelector.innerHTML = '';

    // Sort and process models
    const sortedModels = [...models];

    const recommendedModels = [
      'qwen3-235b-a22b-2507',
      'deepseek-chat-v3-0324',
      'kimi-k2'
    ]
    
    // Sort models: recommended models first, then by creation date (newest first)
    sortedModels.sort((a, b) => {
      // Check if model IDs are in the recommendedModels array
      const aIsRecommended = recommendedModels.some(id => a.id.includes(id));
      const bIsRecommended = recommendedModels.some(id => b.id.includes(id));
      
      // Make recommended models first
      if (aIsRecommended && !bIsRecommended) return -1;
      if (!aIsRecommended && bIsRecommended) return 1;
      
      // Sort by model date created (newest first)
      if (a.created > b.created) return -1;
      if (a.created < b.created) return 1;
      return 0;
    });

    // Add new options from the sorted models array
    sortedModels.forEach(model => {
      const option = document.createElement('option');
      option.value = model.id;
      
      // Check if this model is in the recommended list
      const isRecommended = recommendedModels.some(id => model.id.includes(id));
      
      // Add a star emoji and style for recommended models
      if (isRecommended) {
        option.textContent = `⭐ ${model.id}`;
        option.classList.add('recommended-model');
      } else {
        option.textContent = model.id;
      }
      
      modelSelector.appendChild(option);
    });

    // Try to restore the previously selected model if it still exists
    if (Array.from(modelSelector.options).some(opt => opt.value === currentModel)) {
      modelSelector.value = currentModel;
    }
  }

  // Fetch models button functionality
  fetchModelsBtn.addEventListener('click', async function() {
    try {
      const apiKey = openrouterApiKey.value.trim();

      // Show loading status
      status.textContent = chrome.i18n.getMessage('statusFetchingModels');
      status.style.color = '#db7b00';

      // Create OpenRouterClient instance
      const client = new OpenRouterClient(apiKey || 'dummy-api-key');

      // Fetch models
      const modelsData = await client.getModels();

      if (!modelsData || !modelsData.data || !Array.isArray(modelsData.data)) {
        throw new Error('Invalid response format from OpenRouter API');
      }


      // Store the current selected model
      const currentModel = modelSelector.value;

      // Populate the model selector with the fetched models
      populateModelSelector(modelsData.data, currentModel);

      // Save the updated model selection
      handleInputChange();

      // Save the raw models to storage for future use
      chrome.storage.local.set({ 'cachedModels': modelsData.data });

      // Show success message
      status.textContent = chrome.i18n.getMessage('statusModelsUpdated');
      status.style.color = 'green';
    } catch (error) {
      console.error('Failed to fetch models:', error);
      status.textContent = chrome.i18n.getMessage('errorPrefix') + error.message;
      status.style.color = 'red';
    }
  });

  // Function to load and display history entries
  async function loadHistoryEntries() {
    try {
      const entries = await wordHistoryService.getEntries(100, true);

      // a list to display the entries
      const historyList = document.getElementById('history-list');

      if (entries.length === 0) {
        historyList.innerHTML = '<p>' + chrome.i18n.getMessage('noHistoryEntries') + '</p>';
        return;
      }

      historyList.innerHTML = ''; // Clear previous entries

      // Add each entry to the list
      entries.forEach(entry => {
        const entryElement = document.createElement('div');
        entryElement.className = 'history-entry';

        // prevent empty
        entry.sentence = entry.sentence || '';
        entry.explanation = entry.explanation || '';

        const firstLine = entry.explanation.split('\n')[0];
        const restLines = entry.explanation.split('\n').slice(1).join('\n').trim();
        const sentenceWithHighlightedWord = entry.sentence.replaceAll(
            new RegExp(`\\b${entry.word}\\b`, 'gi'), `<strong>${entry.word}</strong>`);


        entryElement.innerHTML = `
          <div class="history-entry-header">
            <span class="history-first-line">${simpleMarkdownToHtml(firstLine)}</span>
            <div class="delete-entry" data-id="${entry.id}">×</div>
          </div>
          <div class="history-explanation">${simpleMarkdownToHtml(restLines)}</div>
          ${entry.sentence ? `<div class="history-sentence">"${sentenceWithHighlightedWord}"</div>` : ''}
        `;

        historyList.appendChild(entryElement);
      });

      // Add event listeners for delete buttons
      document.querySelectorAll('.delete-entry').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.stopPropagation(); // Prevent the click from toggling the entry expansion
          const id = parseInt(e.target.getAttribute('data-id'));
          try {
            await wordHistoryService.deleteEntry(id);
            // Reload the history after deletion
            loadHistoryEntries();
          } catch (error) {
            console.error('Failed to delete entry:', error);
          }
        });
      });

      // Add event listeners for expanding entries (clicking on the header)
      document.querySelectorAll('.history-entry-header').forEach(header => {
        header.addEventListener('click', (e) => {
          const entry = e.currentTarget.parentElement;
          entry.classList.toggle('expanded');
        });
      });

    } catch (error) {
      console.error('Failed to load history entries:', error);
    }
  }

  // Refresh history when the history tab is clicked
  tabButtons.forEach(button => {
    if (button.getAttribute('data-tab') === 'history') {
      button.addEventListener('click', loadHistoryEntries);
    }
  });

  // Manage history button functionality
  document.getElementById('manage-history').addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('manage-history.html') });
  });
});
