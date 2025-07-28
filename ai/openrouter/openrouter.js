/**
 * OpenRouter API Client
 * 
 * A class for interacting with the OpenRouter API for AI completions.
 */
class OpenRouterClient {
  /**
   * Create a new OpenRouter API client
   * 
   * @param {string} apiKey - The OpenRouter API key
   * @param {string} [model='moonshotai/kimi-k2:free'] - The model to use for completions
   */
  constructor(apiKey, model = 'moonshotai/kimi-k2:free') {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required');
    }

    // Trim the API key to remove any whitespace
    this.apiKey = apiKey.trim();
    this.model = model;
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  /**
   * Get a list of available models from OpenRouter
   *
   * @returns {Promise<Object>} - The list of available models
   */
  async getModels() {
    const url = `${this.baseUrl}/models`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': chrome.runtime.getURL(''),
          'X-Title': 'Word Tracker Extension'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw new Error(`OpenRouter API authentication error: Please check that your API key is correct and not expired.`);
        } else {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData?.error?.message)}`);
        }
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a completion from the model
   * 
   * @param {string} prompt - The prompt to send to the model
   * @param {Object} [options={}] - Additional options for the completion request
   * @param {number} [options.temperature=0.7] - Controls randomness (0-1)
   * @param {number} [options.maxTokens=1024] - Maximum number of tokens to generate
   * @returns {Promise<Object>} - The model's response
   */
  async completion(prompt, options = {}) {
    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const url = `${this.baseUrl}/chat/completions`;

    const requestOptions = {
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      ...options
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': chrome.runtime.getURL(''),
          'X-Title': 'Word Tracker Extension'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: prompt }
          ],
          ...requestOptions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        // Provide more specific error messages for common issues
        if (response.status === 401) {
          throw new Error(`OpenRouter API authentication error: Please check that your API key is correct and not expired.`);
        } else if (response.status === 403) {
          throw new Error(`OpenRouter API authorization error: Your API key doesn't have permission to use this model.`);
        } else {
          throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData?.error?.message)}`);
        }
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

// Export the class for use in other files
if (typeof module !== 'undefined') {
  module.exports = { OpenRouterClient };
}
// Make OpenRouterClient available globally for service worker
if (typeof self !== 'undefined') {
  self.OpenRouterClient = OpenRouterClient;
}
