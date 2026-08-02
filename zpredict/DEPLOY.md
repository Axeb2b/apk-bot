# zPredict — Crypto Trading Platform

Professional multi-chain Web3 engine with swap, bridge, staking, buy/sell, and dashboard features.

## Quick Start (Local)

```bash
cd zpredict
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY, TELEGRAM_BOT_TOKEN (optional), APP_URL
npm run dev
```

Open http://localhost:3000

## Production Build

```bash
npm run build
NODE_ENV=production node dist/server.cjs
```

## Deploy to Render (Recommended — Free)

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect repo and select `zpredict/render.yaml`
4. Add environment variables:
   - `APP_URL` — your Render service URL (e.g. `https://zpredict.onrender.com`)
   - `GEMINI_API_KEY` — Google Gemini API key (for AI chatbot)
   - `TELEGRAM_BOT_TOKEN` — optional, for Telegram bot
   - `TELEGRAM_ADMIN_IDS` — optional, comma-separated admin user IDs
5. Deploy

## Deploy with Docker

```bash
cd zpredict
docker build -t zpredict .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e APP_URL=https://your-domain.com \
  -e GEMINI_API_KEY=your_key \
  zpredict
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `APP_URL` | Yes (prod) | Public URL of your deployment |
| `GEMINI_API_KEY` | For AI chat | Google Gemini API key |
| `TELEGRAM_BOT_TOKEN` | Optional | Telegram bot token |
| `TELEGRAM_ADMIN_IDS` | Optional | Admin Telegram user IDs |
| `PORT` | No | Server port (default: 3000) |

## Features

- Multi-chain crypto swap & bridge
- Staking dashboard
- Buy/sell fiat gates
- Firebase authentication
- Live price charts (Recharts)
- Web3 wallet connect (Wagmi/Viem)
- Gemini AI chatbot
- Telegram bot integration

## Firebase

Firebase config is in `firebase-applet-config.json`. Firestore rules in `firestore.rules`.
