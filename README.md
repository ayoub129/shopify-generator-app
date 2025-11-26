# AI Bike Customizer – Shopify + Node.js (Gemini API)

This repository contains the backend and integration logic for the **AI Bike Customizer**, a chat-based image generation feature built for a Shopify store.  
Users describe their dream motorcycle in natural language, and the system generates a realistic custom bike mockup using **Google Gemini Image API**.

---

## 🚀 Project Overview

**Goal:**  
Create a simple MVP that lives inside a Shopify theme page (`/ai-bike-customizer`) and allows users to:

- Type a message (their motorcycle description)
- Send it through a chat-style interface
- Receive a generated motorcycle mockup image
- Download the final PNG

The backend runs on Node.js and communicates through a **Shopify App Proxy** for secure server-side API calls.

---

## 🧱 Tech Stack

### **Backend**
- Node.js / Express
- Google Gemini Image API (`@google/generative-ai`)
- CORS
- dotenv
- Deployed on Vercel / Render / Railway

### **Frontend**
- React (injected into a Shopify theme page)
- Simple chat UI (dark mode)
- Message bubbles (User / AI)
- Image preview + download button

### **Shopify**
- App Proxy (required)
- Custom theme section or page template
- Online Store 2.0 compatible

---

## 📁 Repository Structure (planned)

```
root/
│
├─ backend/
│   ├─ index.js
│   ├─ package.json
│   ├─ .env (not included)
│   ├─ .gitignore
│   └─ vercel.json (optional)
│
├─ shopify/
│   ├─ assets/
│   ├─ sections/
│   ├─ templates/
│   └─ snippets/
│
└─ README.md
```

---

## 🔐 Environment Variables

Create a `.env` file inside the backend folder:

```
GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ Never commit your `.env` file.  
It must be added to `.gitignore`.

---

## 🔧 Backend Development Setup

1. Navigate to backend folder  
   ```bash
   cd backend
   ```

2. Install dependencies  
   ```bash
   npm install express cors dotenv @google/generative-ai
   ```

3. Run local server  
   ```bash
   node index.js
   ```

The backend exposes a POST endpoint:

```
POST /generate
Body: { "prompt": "Your description here" }
```

---

## 🔗 Shopify App Proxy

Once deployed, set your app proxy like:

```
Subpath: ai-bike
Proxy URL: https://your-backend-host.com
```

Final endpoint Shopify calls:

```
/apps/ai-bike/generate
```

---

## 📦 Upcoming Features (Phase 1)

- Full chat UI in Shopify
- Gemini image generation handler
- Image download button
- Error handling + retry
- Rate limiting & timeouts
- Prompt template system
- Staging + production setup

---

## 📘 Documentation (For Client)

A separate **Technical Notes** document will explain:

- How to deploy the backend
- How to change the API provider (Gemini → OpenAI/Stability)
- How to adjust the system prompt
- How to update the Shopify theme

---

## 📝 License

Private client project – not for public distribution.

---

## 👤 Developer

**Ayoub Berouijil**  
Full-stack Developer – Shopify + Node.js + AI Integration
