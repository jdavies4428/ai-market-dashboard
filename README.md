# AI Market Dashboard

A real-time AI-focused market dashboard for tracking your watchlist.

## Features

- **Major Indices**: Dow, S&P 500, Nasdaq, Russell 2000, VIX, Bitcoin
- **Watchlist**: 17 tickers with real-time prices
- **Big Movers**: Highlights stocks moving >3%
- **Auto-refresh**: Updates every 60 seconds

## Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd market-dashboard
vercel --prod
```

### Option 2: Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py

# Open http://localhost:5000
```

### Option 3: Docker

```bash
# Build image
docker build -t market-dashboard .

# Run
docker run -p 5000:5000 market-dashboard
```

## Environment Variables

- `PORT`: Server port (default: 5000)

## Data Source

All market data is fetched from Yahoo Finance via the `yfinance` library.

## Watchlist

APP, IREN, NBIS, MU, SNDK, NVDA, AMD, LITE, CRWV, ORCL, PSIX, INTC, COHR, WDC, STX, CIFR, AVGO
