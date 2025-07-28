// Test script for OpenRouterClient

// Import the OpenRouterClient class
// Note: In a Chrome extension, you would typically include this script with a <script> tag in your HTML
// This test script is for demonstration purposes

// Mock chrome.runtime.getURL for testing outside of the extension context
if (typeof chrome === 'undefined' || !chrome.runtime) {
  globalThis.chrome = {
    runtime: {
      getURL: () => 'chrome-extension://test-extension'
    }
  };
}

// Function to test getting available models
async function testGetModels() {
  console.log('Testing getModels method...');

  // Replace with your actual API key for testing
  let apiKey = localStorage.getItem('openrouterApiKey');
  if (!apiKey) {
    apiKey = prompt('OpenRouter API key');
    localStorage.setItem('openrouterApiKey', apiKey);
  }

  try {
    // Create a new client instance
    const client = new OpenRouterClient(apiKey);
    console.log('Client created successfully');

    console.log('Fetching available models...');
    const models = await client.getModels();

    const modelsSimplified = models.data.map(model => ({
        id: model.id,
        name: model.name,
        //description: model.description,
        created: new Date(model.created * 1000).toISOString(),
    }));

    console.log(models.data.length, 'models received in total.');

    const freeModels = modelsSimplified.filter(model => model.id.includes(':free'));
    console.log('Free models available:', freeModels.length);

    const countByModality = models.data.reduce((acc, model) => {
      const modality = model.architecture.modality;
      acc[modality] = (acc[modality] || 0) + 1;
      return acc;
    }, {});
    console.log('Model count by modality:', countByModality);

    console.log(JSON.stringify(freeModels, null, 2));

    return 'Models test completed successfully';
  } catch (error) {
    console.error('Models test failed:', error);
    return `Models test failed: ${error.message}`;
  }
}

// Function to test the OpenRouterClient
async function testOpenRouterClient() {
  console.log('Testing OpenRouterClient...');

  // Replace with your actual API key for testing
  let apiKey = localStorage.getItem('openrouterApiKey');
    if (!apiKey) {
        apiKey = prompt('OpenRouter API key');
        localStorage.setItem('openrouterApiKey', apiKey);
    }


  try {
    // Create a new client instance
    const client = new OpenRouterClient(apiKey);
    console.log('Client created successfully');

    await new Promise(resolve => setTimeout(resolve, 500));

    // Test with a simple prompt
    const prompt = 'Give the transcription of the word "multitud" from the sentence "Hizo un gesto para que la multitud guardara silencio. “Oh, computadora Pensamiento Profundo,” dijo, “la tarea para la que te hemos diseñado es ésta." and translate the sentence into English.\nMake the word **bold** in the translated text.';
    console.log(`Sending prompt: "${prompt}" ...`);

    const response = await client.completion(prompt, { 
      temperature: 0.7,
      maxTokens: 100
    });

    console.log('Response received:');
    console.log(JSON.stringify(response, null, 2));

    // Extract and display the actual completion text
    if (response.choices && response.choices.length > 0) {
      const completionText = response.choices[0].message.content;
      console.log('Completion text:');
      console.log(completionText);
    }

    return 'Test completed successfully';
  } catch (error) {
    console.error('Test failed:', error);
    return `Test failed: ${error.message}`;
  }
}

// Run the test when the script is loaded
// In a real extension, you would trigger this based on user action
console.log('OpenRouterClient test script loaded');

// Uncomment to run the tests automatically
// Note: You'll be prompted for the API key if not set in localStorage
// testOpenRouterClient().then(console.log);
// testGetModels().then(console.log);
