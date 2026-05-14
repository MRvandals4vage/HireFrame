# SignalForge — AI Interview Readiness Tool

Three AI recruiter personas debate your resume in real time and produce a readiness score.

## How It Works

1. **Upload your resume** (PDF, text, or paste) and enter your target role
2. **Watch the debate** — Alex (Skeptic), Maya (Champion), and Jin (Verdict) evaluate your resume in real time via Claude AI streaming
3. **Get your score** — readiness score, hire blockers, accelerators, 30-day improvement plan

## Tech Stack

- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** — custom design system
- **Anthropic Claude API** (`claude-sonnet-4-20250514`) — streaming SSE
- **Motion** (Framer Motion) — page transitions and animations

## Setup

```bash
# Install dependencies
npm install

# Create .env with your Anthropic API key
cp .env.example .env
# Edit .env and add your key (or enter it in the app UI)

# Start dev server
npm run dev
```

## Design System

| Token | Value |
|-------|-------|
| Background | `#F7F7F5` |
| Surface | `#FFFFFF` |
| Border | `#E5E4E0` |
| Text Primary | `#1A1A18` |
| Text Secondary | `#6B6B66` |
| Alex (Skeptic) | `#C0392B` (red) |
| Maya (Champion) | `#1D9E75` (green) |
| Jin (Verdict) | `#2C6FBF` (blue) |
| Font | Inter, weights 300/400/500 |
