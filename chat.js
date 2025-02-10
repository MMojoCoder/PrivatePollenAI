// ------------------------------------------ Core Variables --------------------------------------------------------
let chatHistory;
try {
    chatHistory = JSON.parse(localStorage.getItem('local_chat_history')) || [];
} catch {
    chatHistory = [];
}

let model = JSON.parse(localStorage.getItem('model')) || "openai";

// ------------------------------------------ Variables --------------------------------------------------------
const textAreaMessage = document.querySelector('#message');
const chat = document.querySelector('.chat');
const sendMessageButton = document.querySelector('.send-message-btn');
const modelSettings = document.querySelector('.settings-logo');
const modelDisplay = document.querySelector('.model-settings');
const modelClose = document.querySelector('#model-close');
const modelChosen = document.querySelector('#model-options');
const modelLabel = document.querySelector('#displayModel');

// ------------------------------------------ Loading Everything --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    
    // Adding Title
    const title = localStorage.getItem('title');
    const messageContainer = document.createElement('div');
    messageContainer.classList = 'title';
    messageContainer.textContent = title;
    chat.appendChild(messageContainer);

    // Loads message history
    chatHistory.forEach(([role, message]) => {
        if(role==='user') {
            const messageContainer = document.createElement('div');
            messageContainer.setAttribute('style',`
                background-color: rgb(46, 46, 46);
                padding: 10px;
                border-radius: 10px;
                width: fit-content;
                margin-left: auto;
            `);
        
            const messageUser = document.createElement('span');
            messageUser.textContent = message;
            messageUser.setAttribute("style", `
                color: white; 
                display: inline-block;
                word-break: break-word;
                white-space: pre-wrap; 
            `);
        
            messageContainer.appendChild(messageUser);
            const breakElement = document.createElement('br');
        
            chat.appendChild(messageContainer);
            chat.appendChild(breakElement);
        } else if(role==='ai') {
            message = marked.marked(message);
        
            const messageContainer = document.createElement('div');
            messageContainer.className = 'ai-response';
            messageContainer.innerHTML = message.trim();
        
            chat.appendChild(messageContainer);
            chat.appendChild(document.createElement('br'));
        }
    })

    // Loads label for ai model
    modelChosen.value = model;
    modelLabel.textContent = modelChosen.options[modelChosen.selectedIndex].textContent;  
})

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
    chatHistory.push(['user',input]);

    if(chatHistory.length === 1) {
        generateTitle();
    }

    saveChatHistory()
    
    const messageContainer = document.createElement('div');
    messageContainer.setAttribute('style',`
        background-color: rgb(46, 46, 46);
        padding: 10px;
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
    textAreaMessage.disabled = true;
    textAreaMessage.style.cursor = 'wait';

    let thinking = displayThinking();
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(chat_history.join("\n"), 'assistant', chosenModel=model);
    clearInterval(thinking);
    chat.removeChild(document.querySelector('.thinking'));

    chatHistory.push(['ai', response]);
    saveChatHistory()
    response = marked.marked(response);

    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-response';
    messageContainer.innerHTML = response.trim();

    chat.appendChild(messageContainer);
    chat.appendChild(document.createElement('br'));
    textAreaMessage.disabled = false; 
    textAreaMessage.style.cursor = 'pointer';
}



async function pollinationsAI(prompt, systemMessage = "assistant", chosenModel='openai') {
    try {
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
            model: chosenModel,
            private: true
          })
        });
    
        if (response.ok ) {
            const data = await response.text();
            return data;
        } else {
            return "This model appears to be down. Please try again later. If the issue persists, feel free to contact support."
        }
    } catch(error) {
        return "There was a problem connecting to the AI server. Please try again later."
    }
}

function displayThinking() {
    const tempMessageContainer = document.createElement('div');
    tempMessageContainer.className = 'thinking';
    chat.appendChild(tempMessageContainer);
    let dots = "";
    return setInterval(() => {
        if(dots.length < 3) {
            dots = dots + ".";
        } else {
            dots = "";
        }
        tempMessageContainer.textContent = "Thinking" + dots;
    }, 200);
}

// ------------------------------------------ Model ---------------------------------------------

modelSettings.addEventListener('click', () => {
    modelDisplay.showModal();
})

modelClose.addEventListener('click', () => {
    modelDisplay.close();
})
 
modelChosen.addEventListener('change', (chosenModel) => {
    model = chosenModel.target.value;
    saveModel();
    modelLabel.textContent = chosenModel.target.options[chosenModel.target.selectedIndex].textContent; 
})

// ------------------------------------------ SIDEBAR ----------------------------------------------------------
const sidebar = document.querySelector('.sidebar');
const closeSidebar = document.querySelector('.left');
const openSidebar = document.querySelector('.right');

closeSidebar.addEventListener('click', () => {
    sidebar.setAttribute('style','display:none');
    openSidebar.setAttribute('style', 'display:flex');
})

openSidebar.addEventListener('click', () => {
    sidebar.setAttribute('style','display:flex');
    openSidebar.setAttribute('style', 'display:none');
})

// ------------------------------------------ Save Chat History ---------------------------------------------------------
function saveChatHistory() {
    localStorage.setItem('local_chat_history', JSON.stringify(chatHistory));
}

function saveModel() {
    localStorage.setItem('model', JSON.stringify(model));
}

// RESET HISTORY FUNCTION
function resetHistory() {
    chatHistory = [];
    localStorage.setItem('title', '');
    localStorage.setItem('local_chat_history', []);
    chat.innerHTML = '';
}

async function generateTitle() {
    const title = document.querySelector('.title');
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(chat_history.join("\n"), systemMessage="Generate a very short title for the user's input. Nothing else.");
    localStorage.setItem('title', response);
    title.textContent = await response;
}
