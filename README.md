# Hire Frame 

### The AI-Powered Interview Readiness Platform

Hire Frame is a premium, multi-stage interview simulation platform designed to prepare candidates for high-stakes engineering roles. Moving beyond simple Q&A, Hire Frame simulates the entire hiring process—from the initial "Committee Debate" behind closed doors to live behavioral and technical evaluations.

---

## 📺 Live Demo
[![Watch the Demo](https://img.shields.io/badge/Demo-Watch%20Now-blue?style=for-the-badge&logo=google-drive)](https://drive.google.com/file/d/1sJc3lL9FsfJz1-Tg0LNQ0wN17aq5LCE-/view?usp=sharing)

> [!TIP]
> To properly embed a Google Drive video in GitHub, ensure the link is set to "Anyone with the link can view".

---

## 🚀 Core Features

### 1. Live Recruiter Debate (Evaluation Phase)
Watch an "insider" simulation of a hiring committee discussing your resume.
- **Multi-Agent Simulation**: Three distinct recruiter personas (Alex the Skeptic, Maya the Champion, and Jin the Neutral) dissect your resume claims in real-time.
- **Dynamic Confidence Tracking**: See how recruiter confidence shifts as the debate progresses.
- **Editorial UI**: A minimal, matte-grey interface that mirrors premium professional dashboards.

### 2. Technical DSA Round
Test your algorithmic skills in a focused coding environment.
- **LeetCode Integration**: Curated problem sets (Two Sum, BST Validation, etc.) with real-time feedback.
- **Simulated Runtime Analysis**: Get immediate feedback on performance and complexity.

### 3. Live AI Mock Interview
A futuristic, behavior-first interview simulation.
- **Behavioral AI Analysis**: Real-time eye-tracking simulation and "Cyber-Scanning" overlays to monitor your interview mannerisms.
- **Voice Transcription**: Live speech-to-text processing of your responses.
- **Confidence & Mannerism Metrics**: Instant metrics on Speaking Rate, Filler Word usage, and Eye Contact.

### 4. Comprehensive Diagnostics
A detailed breakdown of your interview performance.
- **Readiness Score**: A quantified index of your hireability for the target role.
- **30-Day Action Plan**: Concrete steps (1-hour, 1-day, and 1-week fixes) to improve your profile.
- **Hire Blockers & Accelerators**: Sharp, specific technical feedback derived from the recruiter debate.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite 6
- **Styling**: Tailwind CSS 4 (with a custom "Flat Matte" design system)
- **Animation**: Motion (Framer Motion)
- **AI Intelligence**: 
  - **Primary**: Google Gemini 2.0/2.5 Flash
  - **Fallback**: Groq (Llama 3.3 70B / Llama 3.1 8B)
- **Browser APIs**: Web Speech API (Transcription), MediaDevices (Camera/Microphone)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18+)
- Gemini API Key ([Get one here](https://aistudio.google.com/))
- Groq API Key ([Get one here](https://console.groq.com/))

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/MRvandals4vage/HireFrame.git
   cd HireFrame
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY="your_gemini_key"
   VITE_GROQ_API_KEY="your_groq_key"
   ```

4. Launch:
   ```bash
   npm run dev
   ```
   Access the platform at `http://localhost:3000`.

---

## 🎨 Design Philosophy
Hire Frame follows a **Flat Matte Grey** aesthetic. Unlike standard "claymorphism" or generic Material UI, Hire Frame uses:
- **Low Chroma Palettes**: Neutral #E8E8E8 backgrounds to reduce cognitive load.
- **Editorial Typography**: Geometric clarity using **Hanken Grotesk**.
- **Crisp Geometry**: Subtle, 1px borders and sharp card definitions instead of volumetric shadows.

---

## 🤝 Contributing
Contributions are welcome! Please open an issue or submit a PR for any features or bug fixes.

---

**Built with rigor for the next generation of engineers.**
