// Function to get + decode API key
const getKey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['openai-key'], (result) => {
          if (result['openai-key']) {
            const decodedKey = atob(result['openai-key']);
            resolve(decodedKey);
          }
        });
      });
    };

const sendMessage = (content) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0].id;

    chrome.tabs.sendMessage(
      activeTab,
      { message: 'inject', content },
      (response) => {
        if (response.status === 'failed') {
          console.log('injection failed.');
        }
      }
    );
  });
};

const generate = async (prompt) => {
  // Get your API key from storage
  const key = await getKey();
  const url = 'https://api.openai.com/v1/completions';
	
  // Call completions endpoint
  const completionResponse = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 1000,
      temperature: 0.7,
    }),
  });
	
  // Select the top choice and send back
  const completion = await completionResponse.json();
  return completion.choices.pop();
}
const generateCompletionAction = async (info) => {
    try {
        sendMessage('generating...');
        const { selectionText } = info;
        const basePromptPrefix = `
        Develop a fitness program and diet plan based on one's height (cm) and weight (kg) input as below.
        `;
        const baseCompletion = await generate(`${basePromptPrefix}${selectionText}`);

        // Let's see what we get!
        sendMessage(baseCompletion.text);
      } catch (error) {
        console.log(error);
        sendMessage(error.toString());
      }
    };

// Add this in scripts/contextMenuServiceWorker.js
chrome.contextMenus.create({
    id: 'context-run',
    title: 'Generate your fitness plan',
    contexts: ['selection'],
  });
  
// Add listener
chrome.contextMenus.onClicked.addListener(generateCompletionAction);