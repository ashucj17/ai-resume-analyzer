# AI Resume Analyzer

AI Resume Analyzer is a web application that helps users analyze resumes using AI, track job applications, and generate insights for improving their profiles. The project is built using **React Router v7**, **TailwindCSS**, and **TypeScript**, and it integrates AI-powered features to enhance the user experience.

---

## 🚀 Features

* **AI Resume Analysis** – Upload a PDF resume and receive AI‑powered suggestions.
* **Job Application Tracker** – Manage and track job applications visually.
* **Clean & Modern UI** – Fully responsive layout with dynamic SVG backgrounds.
* **Authentication Pages** – Login and signup pages with custom backgrounds.
* **PDF to Image Conversion** – Converts uploaded PDFs into preview images for analysis.

---

## 🏗️ Tech Stack

* **Framework:** React + React Router v7
* **Language:** TypeScript
* **Styling:** TailwindCSS
* **AI Integration:** OpenAI API (or your chosen provider)
* **File Handling:** pdfjs, custom utilities

---

## 📁 Project Structure

```
app/
│
├── components/        # Reusable UI components
├── constants/         # Static values, instructions, configs
├── lib/               # Utility functions, stores, API wrappers
├── routes/            # Application pages (home, auth, etc.)
├── styles/            # Global styles and Tailwind config
├── public/            # SVG backgrounds & static assets
└── app.css            # Root styles
```

---

## ⚙️ Setup & Installation

```bash
git clone <your-repo-url>
cd ai-resume-analyzer
npm install
npm run dev
```

Your project will now be available at:

```
http://localhost:5173
```

---

## 🔧 Environment Variables

Create a `.env` file and add:

```
VITE_OPENAI_API_KEY=your_key_here
```

(Replace with your actual API key.)

---

## 📄 SVG Background System

The project uses three main background SVGs:

* **bg-main.svg** – Homepage
* **bg-auth.svg** – Authentication pages
* **bg-small.svg** – Smaller screens

Each background shares the same **primary gradient** for brand consistency.

---

## 📦 Important Utilities

### `prepareInstructions`

Generates structured instructions for the AI resume analysis prompt.

### `convertPdfToImage`

Converts uploaded PDF pages into preview images.

### `usePuterStore`

Global state store for file management.

---

## 🚀 Deployment

You can deploy the app to:

* **Vercel**
* **Netlify**
* **Cloudflare Pages**
* Any static hosting supporting Vite builds

Build the project using:

```bash
npm run build
```

---

## 📌 Roadmap

* Add resume scoring system
* Add job application analytics
* Add dark mode
* Add resume template generator

---

