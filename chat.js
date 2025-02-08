let chatHistory = [];
let model = "openai";

// ------------------------------------------ Variables --------------------------------------------------------
const textAreaMessage = document.querySelector('#message');
const chat = document.querySelector('.chat');
const sendMessageButton = document.querySelector('.send-message-btn');

// ------------------------------------------ Message Box Changes ---------------------------------------------
textAreaMessage.addEventListener("input", () => {
    if(textAreaMessage.textContent==="") {
        textAreaMessage.style.height = `20px`; 
    }
    textAreaMessage.style.height = `${textAreaMessage.scrollHeight}px`; 
})

// -------------------------------------- Input For Sending Messages ------------------------------------------


// Click button to send message
sendMessageButton.addEventListener('click', () => {
    if((textAreaMessage.value).trim()!="") {
        sendMessage(textAreaMessage.value);
        textAreaMessage.value = "";
        e.preventDefault();
        textAreaMessage.style.height = "20px";
    }
})
// Press enter to send message
textAreaMessage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {   
        if((textAreaMessage.value).trim()!="") {
            sendMessage(textAreaMessage.value);
            textAreaMessage.value = "";
            e.preventDefault();
            textAreaMessage.style.height = "20px";
        }
    }
})

// ------------------------------------------ sendMessage Function --------------------------------------------------


// Send message function
function sendMessage(input) {
    chatHistory.push('USER: ' + input);
    
    const messageContainer = document.createElement('div');
    messageContainer.setAttribute('style',`
        background-color: rgb(46, 46, 46);
        padding: 15px;
        border-radius: 10px;
        width: fit-content;
        margin-left: auto;
    `);

    const message = document.createElement('span');
    message.textContent = input;
    message.setAttribute("style", `
        color: white; 
        display: inline-block;
        word-break: break-word;
        white-space: pre-wrap; 
    `);

    messageContainer.appendChild(message);
    const breakElement = document.createElement('br');

    chat.appendChild(messageContainer);
    chat.appendChild(breakElement);

    returnAIMessage();
}

async function returnAIMessage() {
    const response = await generatePrivateText(chatHistory.join("\n"));
    chatHistory.push("AI" + response);

    const messageContainer = document.createElement('div');
    messageContainer.setAttribute('style',`
        padding: 15px;
        width: fit-content;
        margin-right: auto;
    `);

    const message = document.createElement('span');
    message.textContent = response;
    message.setAttribute("style", `
        color: white; 
        display: inline-block;
        word-break: break-word;
        white-space: pre-wrap; 
    `);

    messageContainer.appendChild(message);
    const breakElement = document.createElement('br');

    chat.appendChild(messageContainer);
    chat.appendChild(breakElement);
}



async function generatePrivateText(prompt, systemMessage = "assistant") {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
            {
                role: "system",
                content: systemMessage,
            },
            {
                role: "user",
                content: prompt,
            },
        ],
        model: model,
        private: true
      })
    });
    
    const data = await response.text();
    return data;
}

// ------------------------------------------ Model ---------------------------------------------
const modelSettings = document.querySelector('.settings');
const modelDisplay = document.querySelector('.model-settings');
const modelClose = document.querySelector('#model-close');
const modelChosen = document.querySelector('#model-options');
const modelLabel = document.querySelector('#displayModel');

modelSettings.addEventListener('click', () => {
    modelDisplay.showModal();
})

modelClose.addEventListener('click', () => {
    modelDisplay.close();
})

modelChosen.addEventListener('change', (chosenModel) => {
    model = chosenModel.target.value;
    modelLabel.textContent = chosenModel.target.options[chosenModel.target.selectedIndex].textContent; 
    
})


