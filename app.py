#!/usr/bin/env python3
"""
Market Dashboard API
Fetches data from Yahoo Finance and serves it via JSON API
"""

import json
import os
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import yfinance as yf
from flask import Flask, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Dashboard watchlist - organized by sector
WATCHLIST = [
    # Hyperscalers
    'AMZN', 'GOOGL', 'META', 'MSFT', 'ORCL',
    # Chips
    'AMD', 'ARM', 'AVGO', 'INTC', 'MRVL', 'NVDA',
    # Memory
    'MU', 'SNDK', 'STX', 'WDC',
    # Networking
    'ALAB', 'CRDO',
    # Optical
    'AAOI', 'CIEN', 'COHR', 'GLW', 'LITE', 'LUMN',
    # Neoclouds
    'APLD', 'CIFR', 'CRWV', 'IREN', 'NBIS',
    # Servers
    'DELL', 'SMCI',
    # Power
    'BE', 'CEG', 'IESC', 'OKLO', 'PSIX', 'SMR', 'VRT', 'VST'
]

# Market indices (using ^ prefix for Yahoo Finance)
INDICES = {
    '^GSPC': 'S&P 500',   # .INX
    '^DJI': 'Dow Jones',  # .DJI
    '^IXIC': 'Nasdaq',    # .IXIC
    'BTC-USD': 'Bitcoin'
}

# Cache directory
CACHE_DIR = Path(__file__).parent / 'cache'
CACHE_DIR.mkdir(exist_ok=True)

def get_cache_file() -> Path:
    """Get cache file for current minute"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M')
    return CACHE_DIR / f'market_data_{timestamp}.json'

def calculate_smas(prices: List[float]) -> Dict[str, float]:
    """Calculate SMAs for given price series"""
    smas = {}
    periods = [5, 10, 20, 50, 100, 200]
    
    for period in periods:
        if len(prices) >= period:
            sma = sum(prices[-period:]) / period
            smas[f'SMA{period}'] = round(sma, 2)
        else:
            smas[f'SMA{period}'] = None
    
    return smas

def fetch_market_data() -> Dict:
    """Fetch all market data from Yahoo Finance"""
    data = {
        'timestamp': datetime.now().isoformat(),
        'indices': {},
        'watchlist': {},
        'movers': []
    }
    
    # Fetch indices
    for symbol, name in INDICES.items():
        try:
            ticker = yf.Ticker(symbol)
            # Get 200 days of history for SMAs
            hist = ticker.history(period='1y')
            if len(hist) > 0:
                prices = hist['Close'].tolist()
                latest = prices[-1]
                prev = prices[-2] if len(prices) > 1 else latest
                change = latest - prev
                change_pct = (change / prev) * 100 if prev != 0 else 0
                
                # Calculate SMAs
                smas = calculate_smas(prices)
                
                # Use display symbol without ^
                display_symbol = symbol.replace('^', '')
                data['indices'][display_symbol] = {
                    'name': name,
                    'price': round(latest, 2),
                    'change': round(change, 2),
                    'change_pct': round(change_pct, 2),
                    'smas': smas
                }
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
    
    # Fetch watchlist
    for symbol in WATCHLIST:
        try:
            ticker = yf.Ticker(symbol)
            # Get 200 days of history for SMAs
            hist = ticker.history(period='1y')
            if len(hist) > 0:
                prices = hist['Close'].tolist()
                latest = prices[-1]
                prev = prices[-2] if len(prices) > 1 else latest
                change = latest - prev
                change_pct = (change / prev) * 100 if prev != 0 else 0
                
                # Calculate SMAs
                smas = calculate_smas(prices)
                
                # Calculate 1W, 1M, YTD returns
                price_1w = prices[-6] if len(prices) >= 6 else prices[0]
                price_1m = prices[-22] if len(prices) >= 22 else prices[0]
                
                # YTD - find first trading day of year
                import pytz
                today = datetime.now(pytz.UTC)
                start_of_year = datetime(today.year, 1, 1, tzinfo=pytz.UTC)
                ytd_idx = 0
                for i, date in enumerate(hist.index):
                    # Make sure date is timezone-aware
                    if date.tzinfo is None:
                        date = pytz.UTC.localize(date)
                    if date >= start_of_year:
                        ytd_idx = i
                        break
                price_ytd = prices[ytd_idx] if ytd_idx < len(prices) else prices[0]
                
                ret_1w = ((latest - price_1w) / price_1w) * 100
                ret_1m = ((latest - price_1m) / price_1m) * 100
                ret_ytd = ((latest - price_ytd) / price_ytd) * 100
                
                ticker_data = {
                    'price': round(latest, 2),
                    'change': round(change, 2),
                    'change_pct': round(change_pct, 2),
                    'ret_1w': round(ret_1w, 2),
                    'ret_1m': round(ret_1m, 2),
                    'ret_ytd': round(ret_ytd, 2),
                    'smas': smas
                }
                data['watchlist'][symbol] = ticker_data
                print(f"Added {symbol} with SMAs: {list(smas.keys()) if smas else 'NONE'}")
                
                # Track movers > 3%
                if abs(change_pct) >= 3:
                    data['movers'].append({
                        'symbol': symbol,
                        'price': round(latest, 2),
                        'change_pct': round(change_pct, 2),
                        'direction': 'up' if change_pct > 0 else 'down'
                    })
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
    
    # Sort movers
    data['movers'].sort(key=lambda x: abs(x['change_pct']), reverse=True)
    
    return data

def get_market_data() -> Dict:
    """Get market data (from cache or fetch new)"""
    cache_file = get_cache_file()
    
    # Try to read from cache if less than 1 minute old
    if cache_file.exists():
        try:
            with open(cache_file) as f:
                return json.load(f)
        except:
            pass
    
    # Fetch new data
    data = fetch_market_data()
    
    # Save to cache
    with open(cache_file, 'w') as f:
        json.dump(data, f)
    
    # Clean old cache files
    clean_old_cache()
    
    return data

def clean_old_cache():
    """Remove cache files older than 1 hour"""
    cutoff = datetime.now() - timedelta(hours=1)
    for cache_file in CACHE_DIR.glob('market_data_*.json'):
        try:
            mtime = datetime.fromtimestamp(cache_file.stat().st_mtime)
            if mtime < cutoff:
                cache_file.unlink()
        except:
            pass

@app.route('/')
def index():
    """Serve the dashboard"""
    return render_template('index.html')

@app.route('/api/market')
def api_market():
    """API endpoint for market data"""
    data = get_market_data()
    return jsonify(data)

@app.route('/api/watchlist')
def api_watchlist():
    """API endpoint for watchlist only"""
    data = get_market_data()
    return jsonify({
        'watchlist': data['watchlist'],
        'movers': data['movers'],
        'timestamp': data['timestamp']
    })

@app.route('/api/indices')
def api_indices():
    """API endpoint for indices only"""
    data = get_market_data()
    return jsonify({
        'indices': data['indices'],
        'timestamp': data['timestamp']
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8771))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)
