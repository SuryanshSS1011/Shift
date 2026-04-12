# 🎯 Shift Extension - Future Goals & Roadmap

## 🌿 Short-Term (The "Eco-Aware" Phase)
- [ ] **Accurate Token Counting**: Integrate a local tokenizer (like `@lenml/tokenizer-gemini`) or the official Gemini API for exact token usage.
- [ ] **Multi-Model Support**:
    - [ ] Add selectors for **ChatGPT** (chatgpt.com).
    - [ ] Add selectors for **Claude** (claude.ai).
- [ ] **Real-time Cost Calculation**: Allow users to input their local electricity rate (e.g., $/kWh) in the settings to see the actual cost of their prompt.

## 🧠 Mid-Term (The "Smart Cache" Phase)
- [ ] **Cache Server Support**: Implement a backend to store and retrieve prompt-answer pairs.
- [ ] **Vector Database Integration**: 
    - [ ] Set up a lightweight server (Node.js/Python) to handle embeddings.
    - [ ] Store user prompts and answers in a vector DB (like Chroma or Pinecone).
    - [ ] Implement a "Similarity Threshold" to suggest cached answers before sending to LLM.
- [ ] **Local Embedding Generation**: Use `transformers.js` to generate embeddings directly in the browser/extension to maintain privacy.

## 📊 Long-Term (The "Eco-Dashboard" Phase)
- [ ] **Historical Analytics**: 
    - [ ] Store a log of all saved energy/CO2 emissions in `chrome.storage.local`.
    - [ ] Create a dashboard in `popup.html` showing "Total Trees Planted" equivalent.
- [ ] **Sustainability Badges**: Reward users for reusing cached answers or choosing more efficient models (e.g., Gemini Flash vs. Pro).
- [ ] **Export Reports**: Allow corporate users to export sustainability reports for ESG (Environmental, Social, and Governance) compliance.

## 🛠 Tech Debt & Refactoring
- [ ] Move DOM selectors to a configuration object for easier maintenance when websites update their UI.
- [ ] Implement robust error handling for API failures with meaningful user feedback.
