# PrivatePollenAI

Welcome to **PrivatePollenAI**, your personalized, privacy-first conversational AI assistant. Powered by cutting-edge technology from [PollinationsAI](https://pollinations.ai/), this web-based assistant is designed to facilitate intuitive, intelligent, and private conversational experiences.

---

## 🚀 Features

1. **Privacy-Focused**
   - All chat data is stored locally in your browser's `localStorage`.
   - Your conversations are not logged externally.

2. **Customizable Settings**
   - Choose from various AI models like OpenAI models, Llama, Mistral, and more.
   - Define system instructions to guide AI behavior.
   - Set desired max tokens and temperature

3. **Markdown and Rich Responses**
   - Supports Markdown for formatting.
   - LaTeX equations rendered via **KaTeX**.
   - Syntax-highlighted code blocks using **Highlight.js**.
   - Expansive footnotes enabled through **Marked**.

4. **Image Generation**
   - Enter `/image <prompt>` to generate images using Pollinations AI.

5. **Commands**
   1. **`/clear`** → This command clears the chat.
   2. **`/title`** → This command regenerates the title.
   3. **`/image`** → This command generates an image.

6. **User-Friendly Interface**
   - Clean and intuitive UI.
   - Interactive dropdown menus for settings and model selection.

7. **Dynamic Chat History**
   - Saves your chat context for continuity in conversations.
   - Edit, reset, or initialize a brand-new chat with ease.
---

## 📋 Usage

### Commands

| Command      | Description                                           |
|--------------|-------------------------------------------------------|
| **`/clear`** | Resets chat history and session.                     |
| **`/image`** | Generates images based on the prompt you provide.    |
| **`/title`** | Regenerates the title.                  |

---

## 🛡️ Privacy Notice

At PrivatePollenAI, **your privacy is a priority**:
- **No external logging**: Chat data is only stored locally and remains on your browser.
- **Data isolation**: Communication with PollinationsAI models is secured and occurs in real time.

**IMPORTANT**: While PrivatePollenAI ensures local privacy, the level of privacy in AI processing depends on PollinationsAI and the external models used to generate responses. Exercise caution when sharing sensitive information.

---

## 📂 File Structure
```
│
├── index.html                # Main HTML file
├── chat.css                  # Stylesheet
├── chat.js                   # Core JavaScript logic
├── images/                   # Favicon and other assets
├── README.md                 # Documentation
```

---

## 🙏 Acknowledgements

Special thanks to:
- The **PollinationsAI community** for their guidance, support, and for enabling free and privacy-respecting access to their APIs, making this project possible.
- **@WithThatWay** *(Check out projects at [https://perchance.org/withthatway](https://perchance.org/withthatway))* for their contributions to KaTeX integration.


Many thanks!

---

## ❓ Community Feedback

If you encounter a bug or wish to propose a feature:
1. Open an issue on GitHub.
2. Provide detailed reproduction steps (if applicable).

If you see the message: *"This model appears to be down. Please try again later. If the issue persists, feel free to contact support,"* please retry after a moment or check back later.

---

Thank you for exploring **PrivatePollenAI**! 😊
