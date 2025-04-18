﻿// ------------------------------------------ Core Variables --------------------------------------------------------
let chatHistory;
try {
    chatHistory = JSON.parse(localStorage.getItem('local_chat_history')) || [];
} catch {
    chatHistory = [];
}

let currentMessageIndex = 0;
let model = JSON.parse(localStorage.getItem('model')) || "openai";
let configModel = JSON.parse(localStorage.getItem('config_model')) || "openai";
let imageRatio = JSON.parse(localStorage.getItem('image_ratio')) || "1:1"
let system_message = JSON.parse(localStorage.getItem('custom_system_message')) || "";
const popup_displayed = JSON.parse(localStorage.getItem('displayed_popup')) || false

// ------------------------------------------ Markdown Setup --------------------------------------------------------
marked.use(markedFootnote());

// ------------------------------------------ Variables --------------------------------------------------------
const textAreaMessage = document.querySelector('#message');
const chat = document.querySelector('.chat');
const sendMessageButton = document.querySelector('.send-message-btn');
const modelSettings = document.querySelector('.settings-logo');
const modelDisplay = document.querySelector('.model-settings');
const modelClose = document.querySelector('#model-close');
const modelChosen = document.querySelector('#model-options');
const configModelChosen = document.querySelector('#config-model-options');
const imageRatioChosen = document.querySelector('#image-ratio-options');
const modelLabel = document.querySelector('#displayModel');
const custom_system_message = document.querySelector('#system-instructions');
const popup = document.querySelector('.popup');
const commandClose = document.querySelector('#commands-close');
const reset_chat_history_btn = document.querySelector('#reset-chat-history-btn');
const regenerate_title_btn = document.querySelector('#regenerate-title-btn')

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
            const messageWrapper = document.createElement('div');
            messageWrapper.setAttribute('data-id', currentMessageIndex);
            messageWrapper.className ='user-wrapper';
        
            const messageContainer = document.createElement('span');
            messageContainer.textContent = message;
            messageContainer.className = 'user-message';
            
            messageWrapper.appendChild(messageContainer);
            
            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'user-options-wrapper';
            optionsWrapper.style.marginLeft = 'auto';

            const editButton = document.createElement('div');
            editButton.className = 'user-options';
            editButton.onclick = function() {
                const newMessage = prompt('Edit this message. "/cancel" to cancel.');
                
                if(newMessage === null) {
                    return;
                }
                
                if(newMessage.trim() === "" || newMessage === "/cancel") {
                    return;
                }

                // If user inputs command
                if(newMessage.trim()==='/clear') {
                    resetHistory();
                    return;
                } else if(newMessage.trim()==='/title') {
                    generateTitle();
                    return;
                } else if(newMessage.substring(0, 6) ==='/image') {
                    messageContainer.textContent = newMessage;
                    const index = Number(messageWrapper.getAttribute('data-id')) + 1;
                    Array.from(chat.children).forEach((message) => {
                        const currentId = Number(message.getAttribute('data-id')) + 1
                        if(currentId > Number(index)) {
                            chat.removeChild(message);
                            currentMessageIndex--;
                        }
                    });
                    chatHistory[index-1] = ['user', newMessage, index-1];
                    chatHistory = chatHistory.slice(0, index);
                    saveChatHistory();
                    generateImage(newMessage.substring(6, newMessage.length).trim());
                } else {
                    messageContainer.textContent = newMessage;
                    const index = Number(messageWrapper.getAttribute('data-id')) + 1;
                    Array.from(chat.children).forEach((message) => {
                        const currentId = Number(message.getAttribute('data-id')) + 1
                        if(currentId > Number(index)) {
                            chat.removeChild(message);
                            currentMessageIndex--;
                        }
                    });
                    chatHistory[index-1] = ['user', newMessage, index-1];
                    chatHistory = chatHistory.slice(0, index);
                    saveChatHistory();
                    returnAIMessage();
                }
            }

            const editImg = document.createElement('img');
            editImg.src = './images/edit.svg';

            editButton.appendChild(editImg);

            optionsWrapper.append(editButton);
            messageWrapper.appendChild(optionsWrapper);
            chat.appendChild(messageWrapper);
    
            currentMessageIndex++;
        } else if(role==='ai') {
            message = processLatexFormula(message);
            message = marked.parse(message);
            message = codeBlockUIEnhancer(message);

            const messageWrapper = document.createElement('div');
            messageWrapper.setAttribute('data-id', currentMessageIndex);
            messageWrapper.className = 'ai-wrapper';
            
            const messageContainer = document.createElement('div');
            messageContainer.className = 'ai-response';
            
            // Security
            messageContainer.innerHTML = DOMPurify.sanitize(message.trim());
            const links = messageContainer.querySelectorAll('a');
            links.forEach(link => {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', "noopener noreferrer");
            });


            // Image Loading
            const images = messageContainer.querySelectorAll('img');
            images.forEach(image => {
                image.onload = function() {
                    image.style.height = "auto";
                    image.style.width = "auto";
                };
            });
            
            messageWrapper.appendChild(messageContainer);

            const optionsWrapper = document.createElement('div');
            optionsWrapper.className = 'options-wrapper';
            

            // Copy
            const copyButton = document.createElement('div');
            copyButton.className = 'options';
            
            const copyImg = document.createElement('img');
            copyImg.src = './images/copy.svg';
            copyButton.appendChild(copyImg);

            copyButton.onclick = function() {
                navigator.clipboard.writeText(messageContainer.textContent)
                    .then(() => {
                        alert('Text copied to clipboard!');
                    })
                    .catch(err => {
                        console.error('Failed to copy: ', err);
                    });
                };

            // Regenerate
            const regenerateButton = document.createElement('div');
            regenerateButton.className = 'options';
            
            const regenerateImg = document.createElement('img');
            regenerateImg.src = './images/sync.svg';
            regenerateButton.appendChild(regenerateImg);

            regenerateButton.onclick = function() {
                const index = Number(messageWrapper.getAttribute('data-id'));
                Array.from(chat.children).forEach((message) => {
                    const currentId = Number(message.getAttribute('data-id')) + 1
                    if(currentId > Number(index)) {
                        chat.removeChild(message);
                        currentMessageIndex--;
                    }
                });
                chatHistory = chatHistory.slice(0, index);
                saveChatHistory();
                returnAIMessage();
            }

            optionsWrapper.appendChild(copyButton);
            optionsWrapper.appendChild(regenerateButton);

            messageWrapper.appendChild(optionsWrapper);

            chat.appendChild(messageWrapper);

            
            currentMessageIndex++;
        }
    })

    // Loads label for ai model
    modelChosen.value = model;
    imageRatioChosen.value = imageRatio;
    configModelChosen.value = configModel;
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

// Send through click
sendMessageButton.addEventListener('click', () => {
    if((textAreaMessage.value).trim()!="") {        
        if(chatHistory.length===0 && textAreaMessage.value != '/title') {
            chat.removeChild(document.querySelector('.welcome-message'));
        } 

        if(textAreaMessage.value==='/clear') {
            resetHistory();
        } else if(textAreaMessage.value==='/title') {
            generateTitle();
        } else if(textAreaMessage.value.substring(0, 6) ==='/image') {
            sendMessage(textAreaMessage.value);
            generateImage((textAreaMessage.value).substring(6, textAreaMessage.length));
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
            if(chatHistory.length===0  && textAreaMessage.value != '/title') {
                chat.removeChild(document.querySelector('.welcome-message'));
            }

            if(textAreaMessage.value==='/clear') {
                resetHistory();
            } else if(textAreaMessage.value==='/title') {
                generateTitle(); 
            } else if(textAreaMessage.value.substring(0, 6) ==='/image') {
                sendMessage(textAreaMessage.value);
                generateImage((textAreaMessage.value).substring(6, textAreaMessage.length));
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
    sendMessageButton.innerHTML = '<img style="height:30px; width:30px;" src="./images/loading.gif"></img>';    
    chatHistory.push(['user',input, currentMessageIndex]);
    saveChatHistory();

    if(chatHistory.length === 1) {
        generateTitle();
    }
    
    const messageWrapper = document.createElement('div');
    messageWrapper.setAttribute('data-id', currentMessageIndex);
    messageWrapper.className ='user-wrapper';

    const messageContainer = document.createElement('span');
    messageContainer.textContent = input;
    messageContainer.className = 'user-message';
    
    messageWrapper.appendChild(messageContainer);
    
    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'user-options-wrapper';
    optionsWrapper.style.marginLeft = 'auto';

    const editButton = document.createElement('div');
    editButton.className = 'user-options';
    editButton.onclick = function() {
        const newMessage = prompt('Edit this message. "/cancel" to cancel.');
        
        if(newMessage === null) {
            return;
        }

        if(newMessage.trim() === "" || newMessage === "/cancel") {
            return;
        }

        // If user inputs command
        if(newMessage.trim() === '/clear') {
            resetHistory();
            return;
        } else if(newMessage.trim() === '/title') {
            generateTitle();
            return;
        } else if(newMessage.substring(0, 6) === '/image') {
            messageContainer.textContent = newMessage;
            const index = Number(messageWrapper.getAttribute('data-id')) + 1;
            Array.from(chat.children).forEach((message) => {
                const currentId = Number(message.getAttribute('data-id')) + 1
                if(currentId > Number(index)) {
                    chat.removeChild(message);
                    currentMessageIndex--;
                }
            });
            chatHistory[index-1] = ['user', newMessage, index-1];
            chatHistory = chatHistory.slice(0, index);
            saveChatHistory();
            generateImage(newMessage.substring(6, newMessage.length).trim());
        } else {
            messageContainer.textContent = newMessage;
            const index = Number(messageWrapper.getAttribute('data-id')) + 1;
            Array.from(chat.children).forEach((message) => {
                const currentId = Number(message.getAttribute('data-id')) + 1
                if(currentId > Number(index)) {
                    chat.removeChild(message);
                    currentMessageIndex--;
                }
            });
            chatHistory[index-1] = ['user', newMessage, index-1];
            chatHistory = chatHistory.slice(0, index);
            saveChatHistory();
            returnAIMessage();
        }
    }

    const editImg = document.createElement('img');
    editImg.src = './images/edit.svg';

    editButton.appendChild(editImg);

    optionsWrapper.append(editButton);
    messageWrapper.appendChild(optionsWrapper);
    chat.appendChild(messageWrapper);

    currentMessageIndex++;
}

async function returnAIMessage() {
    textAreaMessage.disabled = true;
    textAreaMessage.style.cursor = 'wait';
    sendMessageButton.style.cursor = 'wait';
    reset_chat_history_btn.disabled = true;
    reset_chat_history_btn.style.cursor = 'wait';
    
    // Disable all edit buttons
    const editButtons = document.querySelectorAll('.user-options');
    editButtons.forEach(editButton => {
        editButton.style.pointerEvents = 'none';
    });


    let thinking = displayThinking();
    scrollDown();
    let chat_history = chatHistory.map(message => message[1]);
    let response = await pollinationsAI(chat_history.join("\n"), systemMessage=system_message, chosenModel=model);
    clearInterval(thinking);
    chat.removeChild(document.querySelector('.thinking'));
    chatHistory.push(['ai', response, currentMessageIndex]);
    saveChatHistory();
    response = processLatexFormula(response);
    response = marked.marked(response);
    response = codeBlockUIEnhancer(response);

    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-response';
    
    // Security
    messageContainer.innerHTML = DOMPurify.sanitize(response.trim());
    const links = messageContainer.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', "noopener noreferrer");
        link.setAttribute('class', 'gradient-text')
    });

    // Image Loading
    const images = messageContainer.querySelectorAll('img');
    images.forEach(image => {
        image.onload = function() {
            image.style.height = "auto";
            image.style.width = "auto";
        };
    });

    const messageWrapper = document.createElement('div');
    messageWrapper.setAttribute('data-id', currentMessageIndex);
    messageWrapper.className = 'ai-wrapper';
    
    messageWrapper.appendChild(messageContainer);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'options-wrapper';
    

    // Copy
    const copyButton = document.createElement('div');
    copyButton.className = 'options';
    
    const copyImg = document.createElement('img');
    copyImg.src = './images/copy.svg';
    copyButton.appendChild(copyImg);

    copyButton.onclick = function() {
        navigator.clipboard.writeText(messageContainer.textContent)
            .then(() => {
                alert('Text copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
        };

    // Regenerate
    const regenerateButton = document.createElement('div');
    regenerateButton.className = 'options';
    
    const regenerateImg = document.createElement('img');
    regenerateImg.src = './images/sync.svg';
    regenerateButton.appendChild(regenerateImg);

    regenerateButton.onclick = function() {
        const index = Number(messageWrapper.getAttribute('data-id'));
        Array.from(chat.children).forEach((message) => {
            if(message.getAttribute('data-id')!= null) {
                const currentId = Number(message.getAttribute('data-id')) + 1
                if(currentId > Number(index)) {
                    chat.removeChild(message);
                    currentMessageIndex--;
                }
            }
        });
        chatHistory = chatHistory.slice(0, index);
        saveChatHistory();
        returnAIMessage();
    }

    optionsWrapper.appendChild(copyButton);
    optionsWrapper.appendChild(regenerateButton);
    
    messageWrapper.appendChild(optionsWrapper);

    chat.appendChild(messageWrapper);

    textAreaMessage.disabled = false; 
    textAreaMessage.focus();
    textAreaMessage.style.cursor = 'pointer';
    sendMessageButton.style.cursor = 'pointer';
    reset_chat_history_btn.disabled = false;
    reset_chat_history_btn.style.cursor = 'pointer';
    // Reenable all edit buttons
    editButtons.forEach(editButton => {
        editButton.style.pointerEvents = 'auto';
    });
    hljs.highlightAll();
    sendMessageButton.innerHTML = '<img style="height:30px; width:30px;" src="./images/send.svg"></img>';    
    currentMessageIndex++;
}

async function generateImage(input) {
    const image_system_prompt = `
    Generate a image based on users prompt. First improve/enhance the given prompt for better results.
    Rules: 
    - Use URL encoding for the prompt to handle special characters.
    - If the user requests multiple images, generate unique seeds for each and generate each image according to format.
    - Use formatting - ${imageRatio}
    - No extra wording except for wording in example format.
    
    Example format:

    Original Prompt: (Do not include number of images requesteed) 
    Enhanced Prompted:
    Images Requested:
    Image Ratio: 
    ![Image](https://image.pollinations.ai/prompt/{description}?width={width}&height={height}&seed=(random_seed)&nologo=true)  
    `

    textAreaMessage.disabled = true;
    reset_chat_history_btn.disabled = true;
    textAreaMessage.style.cursor = 'wait';
    sendMessageButton.style.cursor = 'wait';
    reset_chat_history_btn.style.cursor = 'wait';
    // Disable all edit buttons
    const editButtons = document.querySelectorAll('.user-options');
    editButtons.forEach(editButton => {
        editButton.style.pointerEvents = 'none';
    });

    let thinking = displayThinking();
    scrollDown();
    let response = await pollinationsAI(imagePrompt=input, systemMessage=image_system_prompt, model=configModel);
    
    if(response === "") {
        response = "Image generator refused to respond."
    }

    clearInterval(thinking);
    chat.removeChild(document.querySelector('.thinking'));

    chatHistory.push(['ai', response, currentMessageIndex]);
    saveChatHistory();
    
    response = processLatexFormula(response);
    response = marked.marked(response);
    response = codeBlockUIEnhancer(response);

    const messageContainer = document.createElement('div');
    messageContainer.className = 'ai-response';

    // Security
    messageContainer.innerHTML = DOMPurify.sanitize(response.trim());
    const links = messageContainer.querySelectorAll('a');
    links.forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', "noopener noreferrer");
    });

    // Image Loading
    const images = messageContainer.querySelectorAll('img');
    images.forEach(image => {
        image.onload = function() {
            image.style.height = "auto";
            image.style.width = "auto";
        };
    });


    const messageWrapper = document.createElement('div');
    messageWrapper.setAttribute('data-id', currentMessageIndex);
    messageWrapper.className = 'ai-wrapper';
    
    messageWrapper.appendChild(messageContainer);

    const optionsWrapper = document.createElement('div');
    optionsWrapper.className = 'options-wrapper';
    

    // Copy
    const copyButton = document.createElement('div');
    copyButton.className = 'options';
    
    const copyImg = document.createElement('img');
    copyImg.src = './images/copy.svg';
    copyButton.appendChild(copyImg);

    copyButton.onclick = function() {
        navigator.clipboard.writeText(messageContainer.textContent)
            .then(() => {
                alert('Text copied to clipboard!');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
        };

    // Regenerate
    const regenerateButton = document.createElement('div');
    regenerateButton.className = 'options';
    
    const regenerateImg = document.createElement('img');
    regenerateImg.src = './images/sync.svg';
    regenerateButton.appendChild(regenerateImg);

    regenerateButton.onclick = function() {
        const index = Number(messageWrapper.getAttribute('data-id'));
        Array.from(chat.children).forEach((message) => {
            if(message.getAttribute('data-id')!= null) {
                const currentId = Number(message.getAttribute('data-id')) + 1
                if(currentId > Number(index)) {
                    chat.removeChild(message);
                    currentMessageIndex--;
                }
            }
        });
        chatHistory = chatHistory.slice(0, index);
        saveChatHistory();
        generateImage(input);
    }

    optionsWrapper.appendChild(copyButton);
    optionsWrapper.appendChild(regenerateButton);

    
    messageWrapper.appendChild(optionsWrapper);

    chat.appendChild(messageWrapper);

    textAreaMessage.disabled = false; 
    reset_chat_history_btn.disabled = false;
    textAreaMessage.focus();
    textAreaMessage.style.cursor = 'pointer';
    sendMessageButton.style.cursor = 'pointer';
    reset_chat_history_btn.style.cursor = 'pointer';
    // Reenable all edit buttons
    editButtons.forEach(editButton => {
        editButton.style.pointerEvents = 'auto';
    });
    hljs.highlightAll();
    sendMessageButton.innerHTML = '<img style="height:30px; width:30px;" src="./images/send.svg"></img>';    
    currentMessageIndex++;
}

async function pollinationsAI(imagePrompt, systemMessage = "assistant", chosenModel='openai') {
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
                    content: imagePrompt,
                },
            ],
            model: chosenModel,
            private: true,
            temperature: savedTemperature,
            max_tokens: savedTokensAmount,
            seed: Math.round(Math.random() * 1000)
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

function displayOriginalMessage() {
    popup.showModal();
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

configModelChosen.addEventListener('change', (chosen_title_model) => {
    configModel = chosen_title_model.target.value;
    saveConfigModel();
})

imageRatioChosen.addEventListener('change', (chosen_image_ratio) => {
    imageRatio = chosen_image_ratio.target.value;
    saveImageRatio();
})

// ------------------------------------------ Chat History ---------------------------------------------------------
function saveChatHistory() {
    localStorage.setItem('local_chat_history', JSON.stringify(chatHistory));
}

function saveModel() {
    localStorage.setItem('model', JSON.stringify(model));
}

function saveImageRatio() {
    localStorage.setItem('image_ratio', JSON.stringify(imageRatio));
}

function saveConfigModel() {
    localStorage.setItem('config_model', JSON.stringify(configModel));
}

function resetHistory() {
    currentMessageIndex = 0;
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
    if(chatHistory.length >= 1) {
        // Doesn't allow reclicking
        regenerate_title_btn.disabled = true;
        regenerate_title_btn.style.cursor = 'wait';
        
        // Actual change of title
        const title = document.querySelector('.title');
        let chat_history = chatHistory.map(message => message[1]);
        let response = await pollinationsAI(chat_history.join("\n"), systemMessage="Generate a very short title based on the user's input. Nothing else. Do not respond to users prompt, merely generate a title based on user input. Try to focus more on more recent conversation. Do not display quotation marks.", chosenModel = configModel);
        localStorage.setItem('title', response);
        title.textContent = response;

        // Allowing reclicking after completion
        regenerate_title_btn.disabled = false;
        regenerate_title_btn.style.cursor = 'pointer';
    }
}

// ------------------------------------------ FORMATTING ---------------------------------------------------------


function codeBlockUIEnhancer(message) {
    const languageRegex = /<code class="language-([a-zA-Z0-9]+)">/g;
    let match = languageRegex.exec(message);

    if (match != null) {
        let remainder = message.trim();
        let temp = '';
        while(true) {
            let index = remainder.indexOf('<pre>');
            if(index===-1) {
                temp += remainder;
                break;
            }

            languageRegex.lastIndex = 0;
            match = languageRegex.exec(remainder); 

            if (!match) {
                match = "plaintext";
            } else {
                match = match[1];
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


// ------------------------------------------ SAVE CUSTOM SYSTEM MESSAGE ---------------------------------------------------------
custom_system_message.addEventListener('input', () => {
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

function processLatexFormula(text) {
    // Skipping code block
    const codeBlockPattern = /```[\s\S]*?```/g;
    const codeBlocks = [];
    text = text.replace(codeBlockPattern, (match) => {
        codeBlocks.push(match);
        return `CODE_BLOCK_PLACEHOLDER_${codeBlocks.length - 1}`; // Placeholder
    });

    // Regex for Math Formulas
    const displayPattern = /\\\[((?:\\[^]|[^\\])*?)\\\]|\$\$((?:\\[^]|[^\\])*?)\$\$/g;
    const inlinePattern = /\\\(((?:\\[^]|[^\\])*?)\\\)|\$((?:\\[^]|[^\\])*?)\$/g;

    // Render display mode
    text = text.replace(displayPattern, (match, formula1, formula2) => {
        const formula = formula1 || formula2; 
        return katex.renderToString(formula.trim(), {
            displayMode: true,
            throwOnError: false,
            strict: false,
            trust: true,
        });
    });

    // Render inline mode
    text = text.replace(inlinePattern, (match, formula1, formula2) => {
        const formula = formula1 || formula2; 
        return katex.renderToString(formula.trim(), {
            displayMode: false,
            throwOnError: false,
            strict: false,
            trust: true,
        });
    });

    // Readding code block from before
    text = text.replace(/CODE_BLOCK_PLACEHOLDER_(\d+)/g, (match, index) => codeBlocks[index]);

    return text;
  }

function showConfigModelInfo() {
    alert("The Config Model is a AI Model that is for image generation and title generation.\nImage Generation Model: Flux\nSide Note: It doesn't actually generate images but creates their description and displays them using markdown.");
}

function showTextModelInfo() {
    alert("The Text Model is an AI Model for text generation. You can choose from a variety of models.");
}

function showMaxTokensInfo() {
    alert("Max Tokens specifies the maximum number of tokens the AI can generate. Higher values allow for longer responses but may result in longer processing times.");
}

function showTemperatureInfo() {
    alert("Temperature controls the randomness of the AI's responses. Lower values (0.2) make responses more focused, while higher values (0.8) allow for more creativity and variation.")
}

function showImageRatioInfo() {
    alert("Image ratio defines the relationship between width and height. It’s crucial for ensuring images display correctly and maintain intended proportions. Common ratios include 16:9, 4:3, and 1:1. Using the right ratio keeps your images sharp and properly framed.");
}

// Max Tokens
const savedTokensAmount = JSON.parse(localStorage.getItem('max_tokens')) || 4096;
const max_tokens = document.querySelector('#max-tokens');
max_tokens.value = savedTokensAmount;
const max_tokens_label = document.querySelector('#max-tokens-label');
max_tokens_label.textContent = savedTokensAmount;

max_tokens.addEventListener('input', function() {
    max_tokens_label.textContent = max_tokens.value;
    localStorage.setItem('max_tokens', JSON.stringify(max_tokens.value));
});


// Temperature
const savedTemperature = JSON.parse(localStorage.getItem('temperature')) || 0.7;
const temperature = document.querySelector('#temperature');
temperature.value = savedTemperature;
const temperature_label = document.querySelector('#temperature-label');
temperature_label.textContent = savedTemperature;

temperature.addEventListener('input', function() {
    temperature_label.textContent = temperature.value;
    localStorage.setItem('temperature', JSON.stringify(temperature.value));
});



const reset_extra_settings_btn = document.querySelector('#reset-extra-settings-btn');
reset_extra_settings_btn.addEventListener('click', function() {
    max_tokens.value = 4096;
    max_tokens_label.textContent = 4096;
    localStorage.setItem('max_tokens', JSON.stringify(max_tokens.value));
    temperature.value = 0.7;
    temperature_label.textContent = 0.7;
    localStorage.setItem('temperature', JSON.stringify(temperature.value));
})