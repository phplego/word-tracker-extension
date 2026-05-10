# Word Tracker Chrome Extension

## Project Idea

**Word Tracker** is a Chrome extension designed for language learners. It helps users understand unfamiliar words and phrases encountered while browsing the web. The extension leverages AI to provide explanations, pronunciations, and translations of selected words in context.

The current implementation provides the following functionality:
- Right-click on any word or phrase to get an AI-powered explanation via the context menu
- View word explanations in a convenient tooltip directly on the webpage
- Maintain a history of looked-up words and their explanations
- Customize AI settings including API key, model selection, and prompt templates

## File Structure

```
word-tracker/
├── manifest.json
├── popup.html
├── popup.js
├── background.js
├── content.js
├── services/
│   └── WordHistoryService.js
├── ai/
│   └── openrouter/
│       ├── openrouter.js
│       ├── test-openrouter.html
│       └── test-openrouter.js
├── utils/
│   └── markdown.js
├── styles/
│   └── content.css
└── images/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### File Descriptions:

- **`manifest.json`**: Extension manifest that defines the name, version, permissions, and entry points (popup, background script, content script).

- **`popup.html`**: HTML file displayed when clicking the extension icon in the Chrome toolbar. Contains tabs for history and settings.

- **`popup.js`**: JavaScript for the popup interface, handling user interactions, settings management, and history display.

- **`background.js`**: Service worker running in the background. Manages context menu creation, processes explanation requests, and communicates with the OpenRouter AI service.

- **`content.js`**: Content script injected into web pages. Handles text selection, extracts sentence context, and displays explanation tooltips.

- **`services/WordHistoryService.js`**: Service for storing and retrieving word history using IndexedDB.

- **`ai/openrouter/`**: Contains files for interacting with the OpenRouter AI service.

- **`utils/markdown.js`**: Utility for converting simple markdown to HTML for displaying explanations.

- **`styles/content.css`**: CSS for styling the explanation tooltips and other injected elements.

- **`images/`**: Directory containing extension icons in various sizes.

