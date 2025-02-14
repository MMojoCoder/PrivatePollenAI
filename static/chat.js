// ------------------------------------------ Core Variables --------------------------------------------------------
let chatHistory;
try {
    chatHistory = JSON.parse(localStorage.getItem('local_chat_history')) || [];
} catch {
    chatHistory = [];
}

let model = JSON.parse(localStorage.getItem('model')) || "openai";
let system_message = JSON.parse(localStorage.getItem('custom_system_message')) || "";
const popup_displayed = JSON.parse(localStorage.getItem('displayed_popup')) | false

// ------------------------------------------ Variables --------------------------------------------------------
const textAreaMessage = document.querySelector('#message');
const chat = document.querySelector('.chat');
const sendMessageButton = document.querySelector('.send-message-btn');
const modelSettings = document.querySelector('.settings-logo');
const modelDisplay = document.querySelector('.model-settings');
const modelClose = document.querySelector('#model-close');
const modelChosen = document.querySelector('#model-options');
const modelLabel = document.querySelector('#displayModel');
const custom_system_message = document.querySelector('#system-instructions');
const popup = document.querySelector('.popup');
const support = document.querySelector('#support');
const commandClose = document.querySelector('#commands-close');

// ------------------------------------------ Loading Everything --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // Adding Title
    const title = localStorage.getItem('title');
    const messageContainer = document.createElement('div');
    messageContainer.className = 'title';
    messageContainer.textContent = title
    chat.appendChild(messageContainer);

    if(chatHistory.length===0){
        const welcome_message = document.createElement('div');
        const h1 = document.createElement('h1');
        const p = document.createElement('p');
        welcome_message.className = 'welcome-message';
        h1.innerHTML = "Welcome to <span class='gradient-text'>PrivatePollenAI<span>";
        p.textContent = 'Send your first message to get started!';
        welcome_message.appendChild(h1);
        welcome_message.appendChild(p);
        chat.appendChild(welcome_message);
    }

    // Loads message history
    chatHistory.forEach(([role, message]) => {
        if(role==='user') {
            const messageContainer = document.createElement('div');
            messageContainer.setAttribute('style',`
                background-color: rgb(46, 46, 46);
                padding: 10px;
                border-radius: 10px;
                width: fit-content;
                max-width: 70%;
                margin-left: auto;
            `);
        
            const messageUser = document.createElement('span');
            messageUser.textContent = message;
            messageUser.setAttribute("style", `
                color: #f5f5f5; 
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
            message = codeBlockUIEnhancer(message);
            
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

    hljs.highlightAll(); // Creates special code block look

    scrollDown();

    custom_system_message.value = system_message;

    if(!popup_displayed) {
        popup.showModal();
    }
})

// ------------------------------------------ Message Box Changes ---------------------------------------------
textAreaMessage.addEventListener("input", () => {
    if(textAreaMessage.textContent==="") {
        textAreaMessage.style.height = `20px`; 
    }
    textAreaMessage.style.height = `${textAreaMessage.scrollHeight}px`; 
})

// -------------------------------------- Input For Sending Messages ------------------------------------------

sendMessageButton.addEventListener('click', () => {
    if((textAreaMessage.value).trim()!="") {        
        if(chatHistory.length===0) {
            chat.removeChild(document.querySelector('.welcome-message'));
        } 
        
        if(textAreaMessage.value==='/clear') {
            resetHistory();
        } else if(textAreaMessage.value.substring(0, 6) ==='/image') {
            sendMessage(textAreaMessage.value);
            generateImage(textAreaMessage.value);
        } else {
            sendMessage(textAreaMessage.value);
            returnAIMessage();
        }

        
        textAreaMessage.value = "";
        e.preventDefault();
        textAreaMessage.style.height = "20px";
    }
})
// Press enter to send message
textAreaMessage.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {   
        
        if((textAreaMessage.value).trim()!="") {
            if(chatHistory.length===0) {
                chat.removeChild(document.querySelector('.welcome-message'));
            }

            if(textAreaMessage.value==='/clear') {
                resetHistory();
            } else if(textAreaMessage.value.substring(0, 6) ==='/image') {
                sendMessage(textAreaMessage.value);
                generateImage(textAreaMessage.value);
            } else {
                sendMessage(textAreaMessage.value);
                returnAIMessage();
            }

            textAreaMessage.value = "";
            e.preventDefault();
            textAreaMessage.style.height = "20px";
        }
    }
})

// ------------------------------------------ MAJOR FUNCTIONS --------------------------------------------------

function sendMessage(input) {
    chatHistory.push(['user',input]);
    saveChatHistory();

    if(chatHistory.length === 1) {
        generateTitle();
    }
    
    const messageContainer = document.createElement('div');
    messageContainer.setAttribute('style',`
        background-color: rgb(46, 46, 46);
        padding: 10px;
        border-radius: 10px;
        width: fit-content;
        max-width: 70%;
        margin-left: auto;
    `);

    const message = document.createElement('span');
    message.textContent = input;
    message.setAttribute("style", `
        color: #f5f5f5; 
        display: inline-block;
        word-break: break-word;
        white-space: pre-wrap; 
    `);

    messageContainer.appendChild(message);
    const breakElement = document.createElement('br');

    chat.appendChild(messageContainer);
    chat.appendChild(breakElement);
}

async function returnAIMessage() {
    textAreaMessage.disabled = true;
    textAreaMessage.style.cursor = 'wait';

    let thinking = displayThinking();
    scrollDown();
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(chat_history.join("\n"), systemMessage=system_message, chosenModel=model);
    clearInterval(thinking);
    chat.removeChild(document.querySelector('.thinking'));

    chatHistory.push(['ai', response]);
    saveChatHistory();
    response = marked.marked(response);

    response = codeBlockUIEnhancer(response);

    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-response';
    messageContainer.innerHTML = response.trim();

    chat.appendChild(messageContainer);
    chat.appendChild(document.createElement('br'));
    textAreaMessage.disabled = false; 
    textAreaMessage.focus();
    textAreaMessage.style.cursor = 'pointer';
    hljs.highlightAll();
}


async function generateImage(input) {
    const image_system_prompt = `
    Generate a image based on users prompt. First improve/enhance the given prompt for better results.
    Rules: 
    - Use URL encoding for the prompt to handle special characters.
    - If the user requests multiple images, generate unique seeds for each and generate each image according to format.
    
    Example format:

    Original Prompt: 
    Enhanced Prompted:
    ![Image](https://image.pollinations.ai/prompt/{description}?width={width}&height={height}&seed=(random_seed)&nologo=true)  
    `

    textAreaMessage.disabled = true;
    textAreaMessage.style.cursor = 'wait';

    let thinking = displayThinking();
    scrollDown();
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(prompt=input, systemMessage=image_system_prompt, model='openai');
    clearInterval(thinking);
    chat.removeChild(document.querySelector('.thinking'));

    chatHistory.push(['ai', response]);
    saveChatHistory();
    response = marked.marked(response);

    response = codeBlockUIEnhancer(response);

    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-response';
    messageContainer.innerHTML = response.trim();

    chat.appendChild(messageContainer);
    chat.appendChild(document.createElement('br'));

    textAreaMessage.disabled = false; 
    textAreaMessage.focus();
    textAreaMessage.style.cursor = 'pointer';
    hljs.highlightAll();
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
// ------------------------------------------ MINOR FUNCTIONS ---------------------------------------------

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

// ------------------------------------------ Chat History ---------------------------------------------------------
function saveChatHistory() {
    localStorage.setItem('local_chat_history', JSON.stringify(chatHistory));
}

function saveModel() {
    localStorage.setItem('model', JSON.stringify(model));
}

function resetHistory() {
    chatHistory = [];
    localStorage.setItem('title', '');
    localStorage.setItem('local_chat_history', JSON.stringify([]));
    chat.innerHTML = '';
    const messageContainer = document.createElement('div');
    messageContainer.className = 'title';
    messageContainer.textContent = '';
    chat.appendChild(messageContainer);
    const welcome_message = document.createElement('div');
    const h1 = document.createElement('h1');
    const p = document.createElement('p');
    welcome_message.className = 'welcome-message';
    h1.innerHTML = "Welcome to <span class='gradient-text'>PrivatePollenAI<span>";
    p.textContent = 'Send your first message to get started!';
    welcome_message.appendChild(h1);
    welcome_message.appendChild(p);
    chat.appendChild(welcome_message);
}

async function generateTitle() {
    const title = document.querySelector('.title');
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(chat_history.join("\n"), systemMessage="Generate a very short title based on the user's input. Nothing else. Do not respond to users prompt, merely generate a title based on user input.");
    localStorage.setItem('title', response);
    title.textContent = response;
}

// ------------------------------------------ FORMATTING ---------------------------------------------------------


function codeBlockUIEnhancer(message) {
    const languageRegex = /<code class="language-([a-zA-Z0-9]+)">/g;
    let match = languageRegex.exec(message);

    if (match != null) {
        let remainder = message.trim();
        let temp = '';
        let count = 1;
        while(true) {
            let index = remainder.indexOf('<pre>');
            if(index===-1) {
                temp += remainder;
                break;
            }

            languageRegex.lastIndex = 0;
            match = languageRegex.exec(remainder);

            if (!match) {
                console.error("No language match found:", remainder);
                break;
            }
            
            try { // Remove later
                match = match[1];
            } catch(error) {
                alert(error);
                break;
            }


            temp += remainder.slice(0, index) + `<div class='code-container'><div class='code-language'>${match}</div><pre>`;
            remainder = remainder.slice(index+5, remainder.length);

            index = remainder.indexOf('</pre>');

            temp += remainder.slice(0, index+6) + `</div>`;
            remainder = remainder.slice(index+6, remainder.length);
        }
        message = temp;
    }
    return message;
}

function scrollDown() {
    chat.scrollTo(0, chat.scrollHeight);
}


// ------------------------------------------ Contact/Support ---------------------------------------------------------

function contactSupport() {
    if((support.value).length == 0) {
        alert("Don't press this button unless you mean it.");
        return null;
    }
    
    $.ajax({
        url: 'http://127.0.0.1:5000/contact-support',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({message: support.value}),
        success: function(response) {
            alert('Message was sent.');
            support.textContent = '';
        },
        error: function(error) {
            alert('Error. Contacting support failed.');
        }
    });
    support.value = '';
}

const feedback = document.querySelector('#feedback');
function submitFeedback() {
    if((feedback.value).length == 0) {
        alert("Don't press this button unless you mean it.");
        return null;
    }

    $.ajax({
        url: 'http://127.0.0.1:5000/submit-feedback',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({message: feedback.value}),
        success: function(response) {
            alert('Message was sent.');
            feedback.value = '';
        },
        error: function(error) {
            alert('Error. Feedback failed was not delivered.');
        }
    });
    feedback.value = '';
}

// ------------------------------------------ SAVE CUSTOM SYSTEM MESSAGE ---------------------------------------------------------
custom_system_message.addEventListener('change', () => {
    system_message = custom_system_message.value;
    localStorage.setItem('custom_system_message', JSON.stringify(custom_system_message.value));
})
// ------------------------------------------ WELCOME POPUP ---------------------------------------------------------


const popupClose = document.querySelector('#popup-close');

popupClose.addEventListener('click', () => {
    popup.close();
    localStorage.setItem('displayed_popup', true);
})

// ------------------------------------------ COMMANDS POPUP ---------------------------------------------------------


const command = document.querySelector('.commands');

function commandsPopup() {
    command.showModal();
}

commandClose.addEventListener('click', () => {
    command.close();
})

// ------------------------------------------ EXTRA CODE IM TOO LAZY TO ORGANIZE ---------------------------------------------------------
