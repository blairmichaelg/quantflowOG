# QuantFlow AI Backtest

<div align="center">

![QuantFlow Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

**Professional-grade quantitative research laboratory for building, compiling, and validating trading strategies using AI and high-fidelity charting.**

[View Demo](https://ai.studio/apps/drive/1gP2jBHIupFFu27iVUDTsM1YOhcdVGwot) · [Report Bug](https://github.com/blairmichaelg/quantflowOG/issues) · [Request Feature](https://github.com/blairmichaelg/quantflowOG/issues)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgments](#acknowledgments)

---

## 🎯 About

QuantFlow AI Backtest is a sophisticated quantitative trading research platform that combines the power of artificial intelligence with professional-grade backtesting capabilities. Built with modern web technologies, it enables traders and researchers to design, test, and validate trading strategies using natural language prompts and advanced technical indicators.

The platform features an event-driven backtesting engine that simulates real market conditions, including slippage, latency, and transaction costs, providing realistic performance metrics for your trading strategies.

---

## ✨ Features

### Core Capabilities
- 🤖 **AI-Powered Strategy Builder** - Design trading strategies using natural language with Google Gemini AI
- 📊 **Event-Driven Backtesting Engine** - Realistic simulation with intra-bar tick events
- 📈 **Advanced Technical Indicators** - EMA, SMA, RSI, MACD, Bollinger Bands, ATR, Stochastic, ADX, OBV
- 💹 **High-Fidelity Charting** - Interactive candlestick charts with customizable overlays
- 📉 **Equity Curve Visualization** - Track strategy performance and drawdown over time

### Advanced Features
- 🎲 **Monte Carlo Simulation** - Statistical analysis with confidence intervals
- 🔄 **Walk-Forward Optimization** - Out-of-sample validation for robust strategies
- 💰 **Transaction Cost Analysis (TCA)** - Detailed breakdown of explicit, implicit, and opportunity costs
- 🎯 **Risk Metrics** - Sharpe, Sortino, Calmar, Omega ratios, VaR, Win Rate, Profit Factor
- ⚡ **Latency & Slippage Models** - Realistic execution simulation
- 🌐 **Multiple Data Sources** - Synthetic data generator and Alpha Vantage API integration

### User Experience
- 🎨 **Modern UI/UX** - Clean, professional interface with dark mode aesthetics
- 💬 **AI Chat Assistant** - Interactive help and strategy suggestions
- 🔧 **Flexible Configuration** - Customizable parameters for leverage, capital, and risk management
- 📱 **Responsive Design** - Works seamlessly across desktop and mobile devices

---

## 🛠️ Tech Stack

### Frontend
- **React 19.2** - Modern UI library with latest features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.2** - Lightning-fast build tool and dev server

### AI & APIs
- **Google Gemini AI** - Natural language strategy generation
- **Alpha Vantage** - Real-time and historical market data

### UI Components & Icons
- **Lucide React** - Beautiful, consistent icon system

### Build & Development
- **Node.js** - JavaScript runtime
- **NPM** - Package management

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v9.0.0 or higher) - Comes with Node.js

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/blairmichaelg/quantflowOG.git
   cd quantflowOG
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

### Configuration

1. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   touch .env.local
   ```

2. **Add your API keys**
   
   Add the following to `.env.local`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   > **Note:** You can obtain a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Optional: Alpha Vantage API**
   
   For real market data, get a free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key) and add it through the app's Settings tab.

### Running the Application

**Development Mode**
```bash
npm run dev
```
The application will be available at `http://localhost:5173`

**Production Build**
```bash
npm run build
npm run preview
```

---

## 📖 Usage

### Quick Start Guide

1. **Launch the Application**
   - Start the dev server with `npm run dev`
   - Open your browser to `http://localhost:5173`

2. **Configure API Keys**
   - Navigate to the Settings tab
   - Enter your Gemini API key
   - (Optional) Add Alpha Vantage key for real data

3. **Build a Strategy**
   - Go to the Strategy tab
   - Enter a natural language prompt (e.g., "Trend-following EMA crossover with RSI filter")
   - Click "Architect with AI" to generate strategy logic
   - Customize indicators and parameters as needed

4. **Run Backtest**
   - Click "Run Backtest" to execute the simulation
   - View results in the Results tab

5. **Analyze Performance**
   - Review equity curves, drawdown charts, and trade history
   - Examine risk metrics (Sharpe ratio, max drawdown, win rate, etc.)
   - Use Labs tab for Monte Carlo and Walk-Forward Analysis

### Example Strategies

**Simple Moving Average Crossover**
```
"Buy when 50-day SMA crosses above 200-day SMA, sell on opposite cross"
```

**RSI Mean Reversion**
```
"Buy when RSI drops below 30, sell when it rises above 70"
```

**Trend Following with Volatility Filter**
```
"Trend-following EMA crossover with dynamic volatility filters and ATR-based stops"
```

---

## 📁 Project Structure

```
quantflowOG/
├── components/           # React components
│   ├── Chart.tsx        # Candlestick chart component
│   ├── EquityChart.tsx  # Equity curve visualization
│   └── Layout.tsx       # Main layout wrapper
├── services/            # Core business logic
│   ├── alphaVantage.ts  # Market data API integration
│   ├── backtestEngine.ts # Event-driven backtesting engine
│   ├── indicators.ts    # Technical indicator calculations
│   ├── labs.ts          # Monte Carlo & Walk-Forward optimization
│   ├── metrics.ts       # Risk & performance metrics
│   └── mockData.ts      # Synthetic data generator
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies and scripts
└── README.md            # This file
```

---

## 🔌 API Integration

### Google Gemini AI

Used for natural language strategy generation. The AI interprets trading concepts and generates executable strategy logic.

**Required:** Set `GEMINI_API_KEY` in `.env.local`

### Alpha Vantage

Provides real-time and historical market data for stocks and cryptocurrencies.

**Optional:** Can be configured in the app's Settings tab. Falls back to synthetic data if not configured.

**Supported Assets:**
- Stocks (e.g., AAPL, MSFT, TSLA)
- Cryptocurrencies (e.g., BTC, ETH, SOL)

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guidelines](./CONTRIBUTING.md) before submitting pull requests.

### Quick Contribution Steps

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 📧 Contact

**Project Maintainer:** Blair Michael G

**Project Link:** [https://github.com/blairmichaelg/quantflowOG](https://github.com/blairmichaelg/quantflowOG)

**Issues:** [https://github.com/blairmichaelg/quantflowOG/issues](https://github.com/blairmichaelg/quantflowOG/issues)

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Vite](https://vitejs.dev/) - Build tool
- [Google Gemini AI](https://deepmind.google/technologies/gemini/) - AI capabilities
- [Alpha Vantage](https://www.alphavantage.co/) - Market data
- [Lucide Icons](https://lucide.dev/) - Icon system

---

<div align="center">

**Built with ❤️ for quantitative traders and researchers**

⭐ Star this repo if you find it useful!

</div>
