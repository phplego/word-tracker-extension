// content.js

// Create and append the explanation tooltip element to the body
const explanationTooltip = document.createElement('div');
explanationTooltip.id = 'word-tracker-explanation-tooltip';
document.body.appendChild(explanationTooltip);

// Variables to store the current selection information
let currentSelectionPosition = null;

let options = {
    isEnabled: false,
};

// Function to update options from storage
function updateOptions() {
    chrome.storage.local.get(['isEnabled'], (result) => {
        options.isEnabled = result.isEnabled || false;
    });
}

// Initial check
updateOptions();

// Listen for changes in storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.isEnabled) {
            options.isEnabled = changes.isEnabled.newValue;
        }
    }
});

// Function to get the sentence containing the selected text
function getSentenceFromSelection() {
    const selection = window.getSelection();
    if (!selection.rangeCount) return null;

    const range = selection.getRangeAt(0);
    const edgeChars = ['.', '!', '?'];

    // 1. Find the paragraph container of the selection
    let container = range.commonAncestorContainer;
    while (container.parentNode) {
        if (container.nodeType === Node.TEXT_NODE) {
            container = container.parentNode;
            continue;
        }
        const display = getComputedStyle(container).display;
        if (display === 'block' || display === 'flex' || // break by block elements
            display === 'grid'  || display === 'table') {
            break;
        }
        container = container.parentNode;
    }

    // 2. The range of the entire container (paragraph usually)
    const containerRange = document.createRange();
    containerRange.selectNodeContents(container);

    // 3. Offset of the selection start: length of text from the start of the paragraph to range.start*
    const preRange = containerRange.cloneRange();
    preRange.setEnd(range.startContainer, range.startOffset);
    const selectionIndex = preRange.toString().length;   // ← exact position of the selection in the paragraph

    // 4. Selected text
    const selectionText = range.toString();
    const fullText = containerRange.toString();

    // find the start of the sentence
    let start = selectionIndex;
    while (start > 0) {
        if (edgeChars.includes(fullText[start - 1]) && fullText[start] === ' ') {
            break;
        }
        if (selectionIndex - start > 500) break;
        start--;
    }

    // find the end of the sentence
    let end = selectionIndex + selectionText.length;
    while (end < fullText.length) {
        if (edgeChars.includes(fullText[end]) && end === fullText.length) {
            break;
        }
        if (edgeChars.includes(fullText[end]) && fullText[end + 1] === ' ') {
            break;
        }
        if (end - selectionIndex > 500) break;
        end++;
    }
    if (end < fullText.length && edgeChars.includes(fullText[end])) end++;

    const sentence = fullText.substring(start, end).trim();
    return sentence;
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSelectionContext') {
        // Use the stored selection context if available, otherwise try to get it now
        const sentence = getSentenceFromSelection();
        sendResponse({ sentence: sentence });
        return true; // Indicates we'll respond asynchronously
    } else if (message.action === 'showExplanation') {
        // Show the explanation in the tooltip
        if (currentSelectionPosition) {
            // Clear previous content
            explanationTooltip.innerHTML = '';

            // Create header element
            const headerElement = document.createElement('div');
            headerElement.className = 'tooltip-header';
            explanationTooltip.appendChild(headerElement);

            // Add icon to the header
            const iconElement = document.createElement('div');
            iconElement.className = 'tooltip-icon';
            headerElement.appendChild(iconElement);
            
            // Add title to the header
            const titleElement = document.createElement('div');
            titleElement.className = 'tooltip-title';
            titleElement.textContent = 'Word Tracker';
            headerElement.appendChild(titleElement);

            // Add a close button to the header
            const closeButton = document.createElement('div');
            closeButton.className = 'close-button';
            closeButton.innerHTML = '×';
            closeButton.onclick = () => {
                explanationTooltip.style.display = 'none';
            };
            headerElement.appendChild(closeButton);

            // Create content container
            const contentContainer = document.createElement('div');
            contentContainer.className = 'tooltip-content';
            explanationTooltip.appendChild(contentContainer);

            // Add the explanation content
            const contentDiv = document.createElement('div');
            contentDiv.className = message.error ? 'error' : (message.loading ? 'loading' : '');
            contentDiv.innerHTML += simpleMarkdownToHtml(message.explanation);
            contentContainer.appendChild(contentDiv);

            // Position and show the tooltip
            explanationTooltip.style.display = 'block';
            explanationTooltip.style.left = `${currentSelectionPosition.left}px`;
            explanationTooltip.style.top = `${currentSelectionPosition.bottom + 5}px`; // Position below the selection
        }
        return false; // No async response needed
    }
});

// Close the explanation tooltip when clicking outside of it
document.addEventListener('click', (e) => {
    if (!explanationTooltip.contains(e.target) && e.target !== explanationTooltip) {
        explanationTooltip.style.display = 'none';
    }
});

// Store selection information when text is selected
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.toString().trim().length > 0) {
        // Get the selection position
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();

            currentSelectionPosition = {
                left: rect.left + window.scrollX,
                top: rect.top + window.scrollY,
                bottom: rect.bottom + window.scrollY,
                right: rect.right + window.scrollX
            };
        }
    }
});
