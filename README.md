# AI Market Dashboard

A real-time market dashboard for tracking AI infrastructure and semiconductor stocks, built with Next.js.

## Features

- **Market Indices** — S&P 500, Dow Jones, Nasdaq, Bitcoin at a glance
- **38-Stock Watchlist** — Organized by sector: Hyperscalers, Chips, Memory, Networking, Optical, Neoclouds, Servers, Power
- **SMA Indicators** — Visual arrows for 5/10/20/50/100/200-day SMAs with opacity-scaled intensity
- **Performance Returns** — Daily change, 1-week, 1-month, and YTD returns
- **Big Movers** — Highlights stocks moving >3% in a session
- **Auto-refresh** — Updates every 60 seconds with server-side caching
- **Dark Mode** — Clean, dark terminal-inspired UI

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS v4**
- **Yahoo Finance API** (server-side, no CORS proxy needed)

## Getting Started

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/
│   ├── api/market/route.ts   # Yahoo Finance API proxy
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Dashboard page
├── components/
│   ├── dashboard.tsx          # Main dashboard container
│   ├── indices-bar.tsx        # Market indices ticker bar
│   ├── movers-bar.tsx         # Big movers highlight bar
│   ├── sector-table.tsx       # Sector watchlist table
│   └── sma-arrow.tsx          # SMA indicator arrow
└── lib/
    ├── constants.ts           # Watchlist, sectors, config
    ├── types.ts               # TypeScript interfaces
    ├── utils.ts               # Formatting helpers
    └── yahoo-finance.ts       # Yahoo Finance data fetcher
```

## Deployment

Deploy to Vercel:

```bash
npm i -g vercel
vercel --prod
```

## Data Source

All market data is fetched server-side from Yahoo Finance. Data is cached for 60 seconds to avoid rate limiting.
