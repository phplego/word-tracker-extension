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

## Development Principles

### Minimalist Code Approach

When working on this project, it's important to follow the principle of minimalism:

#### What to add:
- Only **necessary** functionality to solve specific tasks
- Simple and readable code without excessive abstractions
- Basic logic without unnecessary "improvements"

#### What NOT to add:
- Error handling (unless critical)
- Performance optimizations (in early stages)
- Additional "future" features
- Complex patterns and architectural solutions
- Validation and checks (unless required)

### Why This Matters

1. **Readability**: Simple code is easier to understand for developers continuing the work
2. **Debugging**: Less code = fewer places for bugs
3. **Flexibility**: A simple foundation is easier to modify and extend
4. **Development Speed**: Focusing on essentials accelerates MVP creation
5. **Logic Understanding**: Clear structure helps understand developer intentions

### Development Approach

1. First create a **minimally working** version
2. Test basic functionality
3. Only then add improvements one by one
4. Each change should have a **specific purpose**

### Example of the Right Approach

Instead of creating a complex highlighting system with element filtering, scroll handling, and caching - we created simple functions with classList.add/remove. It works and is easy to understand.

### Remember

> A simple working solution is better than a complex perfect one that's difficult to understand and modify.
