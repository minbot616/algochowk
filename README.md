# AlgoChowk

**AlgoChowk** is a functional research prototype designed to turn vague, natural-language trading questions into explicit, reproducible experiments. The application guides users through a structured 5-stage workflow: **ASK → CLARIFY → DEFINE → TEST → LEARN**.

The studio enforces a strict separation between ambiguous user intent, structured experiment specifications, deterministic backtest calculations, and AI-assisted qualitative interpretation.

---

## Problem

Retail traders and researchers often ask intuitive market questions like:

> *"Does buying NIFTY after a sharp fall work?"*

While intuitive, the question cannot be backtested without resolving critical ambiguities:
- **Signal Threshold**: What exact percentage drop constitutes a "sharp fall"?
- **Execution Timing**: When is the trade entered (same-day close vs. next-day open)?
- **Exit Logic**: How many trading days is the position held?
- **Test Period**: Which historical date range should be evaluated?
- **Friction & Costs**: What brokerage, slippage, and tax assumptions apply?

If software silently invents these parameters without user confirmation, the research output becomes unscientific and misleading.

---

## Product Flow

The application walks the user through a 5-stage guided research workspace:

1. **ASK**: The user submits a research question (e.g., *"Does buying NIFTY after a sharp fall work?"* or *"Does selling NIFTY after a sharp pump work?"*). A deterministic intent parser extracts explicit actions (`buy`/`sell`) and signal directions (`fall`/`pump`), flagging unresolved parameters as `unknown`.
2. **CLARIFY**: Surfaces missing or ambiguous parameters instead of silently inventing them. If the signal direction is unknown (e.g., *"Should I buy NIFTY after a long move?"*), CLARIFY prompts the user to select the move direction (`Sharp Fall` vs `Sharp Pump`) before configuring thresholds.
3. **DEFINE**: Compiles clarified parameters into an immutable, human-reviewable `ExperimentSpec` contract detailing signal rules, entry timing, exit rules, dataset window, and transaction costs.
4. **TEST**: Executes a pure, deterministic TypeScript backtesting engine over historical price data to generate factual empirical metrics (`totalTrades`, `winRatePct`, `averageReturnPct`, `medianReturnPct`, `bestReturnPct`, `worstReturnPct`).
5. **LEARN**: Synthesizes factual data findings, cautious research conclusions, experiment limitations, and follow-up research questions. Empirical numbers are strictly separated from qualitative interpretation.

---

## Key Design Decisions

- **Deterministic Testing Engine**: Backtest metrics are calculated strictly by pure TypeScript functions ([`src/lib/backtest/runBacktest.ts`](file:///d:/Projects/AlgoChowk/src/lib/backtest/runBacktest.ts)). The LLM layer is never permitted to calculate or alter numerical data.
- **Explicit Parameter Provenance**: Every experiment parameter is wrapped in a `ClarifiedParameter<T>` model tracking whether it was `user_provided`, `system_default`, or `requires_clarification`.
- **No Silent Parameter Invention**: Ambiguous queries (e.g., *"Should I buy NIFTY now?"*) flag `signalDirection` as `unknown`, forcing explicit user resolution in CLARIFY before an experiment can be defined or executed.
- **Look-Ahead Bias Prevention**: Signals are evaluated at daily market close ($Close_t$), and trade entries execute at the next trading day's opening price ($Open_{t+1}$).
- **Explicit Transaction Friction Model**: Applies a fixed prototype cost assumption of `0.10%` total friction (`0.03%` brokerage + `0.05%` slippage + `0.02%` STT/taxes) per trade.
- **Independent Event-Study Design**: Treats qualifying occurrences as independent event observations rather than simulating a compounded portfolio P&L curve.
- **Dual-Direction Experiment Support**: Native support for both **Sharp Fall → Buy/Long** and **Sharp Pump → Sell/Short** experiments, with directional return formulas:
  - Long: $\text{Raw Return} = \frac{\text{Exit Price} - \text{Entry Price}}{\text{Entry Price}}$
  - Short: $\text{Raw Return} = \frac{\text{Entry Price} - \text{Exit Price}}{\text{Entry Price}}$
- **Fail-Safe AI Validation & Fallback**: If the Gemini API key is missing, offline, or returns invalid JSON, the application seamlessly uses a deterministic fallback synthesis engine ([`src/lib/ai/fallback.ts`](file:///d:/Projects/AlgoChowk/src/lib/ai/fallback.ts)).
- **Protected Server-Side Key Handling**: The Gemini API key is maintained securely on the server via Next.js Route Handlers (`POST /api/learn`).

---

## Experiment Specification

The default prototype experiment evaluates the baseline question on the NIFTY 50 Index Spot:

| Parameter | Prototype Specification / Default |
| :--- | :--- |
| **Instrument** | NIFTY 50 Index Spot (`^NSEI`) |
| **Signal Definition** | Single-day close-to-close percentage change |
| **Signal Threshold** | Configurable: `1.0%`, `1.5%`, `2.0%`, or Custom (Default: `1.5%`) |
| **Trade Action** | Buy / Long (for fall) or Sell / Short (for pump) |
| **Entry Timing** | Next trading day's opening price ($Open_{t+1}$) |
| **Exit Strategy** | Fixed holding period: `1`, `3`, `5`, or `10` trading days (Default: `5` days) |
| **Cost Model** | `0.10%` total friction per trade |
| **Evaluation Window** | 10 years of historical daily spot data (`2016-09-12` to `2026-09-11`) |

*Note: Default values (e.g., 1.5% drop, 5-day holding period) represent explicit prototype assumptions for user confirmation, not claims of statistical optimality.*

---

## Empirical Results

Executing the default experiment (**1.5% Fall → Buy → 5-Day Holding**) over 10 years of historical data produces the following deterministic baseline metrics:

| Metric | Verified Baseline Result |
| :--- | :--- |
| **Total Signal Events** | `113 completed trades` |
| **Winning Trades** | `66 wins` |
| **Losing Trades** | `47 losses` |
| **Win Rate** | `58.41%` |
| **Average Net Return** | `+0.3970%` per trade |
| **Median Net Return** | `+0.8549%` per trade |
| **Best Single Trade** | `+9.45%` |
| **Worst Single Trade** | `-18.15%` |
| **Sum of Event Net Returns** | `+44.87%` *(Event study aggregate sum, NOT a portfolio return)* |

*Disclaimer: These statistics represent sample outputs from historical event observations under prototype cost assumptions. They do not constitute investment advice or guarantee future performance.*

---

## AI Integration & Guidance

AI (powered by Google Gemini `gemini-2.5-flash`) is strictly limited to the **LEARN** stage for qualitative synthesis:

1. **Context & Metrics Delivery**: Server route `POST /api/learn` passes structured `ExperimentSpec` and computed `EmpiricalResult` to the model.
2. **Prompt Constraints**: The model is instructed never to calculate or alter backtest metrics, never to make promotional claims, and to use exact direction-aware terminology.
3. **Validation Layer**: [`src/lib/ai/validate.ts`](file:///d:/Projects/AlgoChowk/src/lib/ai/validate.ts) checks response schemas and flags prohibited phrases.
4. **Deterministic Fallback**: If the API is unconfigured or fails, [`src/lib/ai/fallback.ts`](file:///d:/Projects/AlgoChowk/src/lib/ai/fallback.ts) generates factual, direction-aware findings deterministically.

---

## Technical Architecture

- **Framework**: Next.js 16 (App Router, React 19)
- **Language**: TypeScript 5 (Strict Type Checking)
- **Styling**: Tailwind CSS v4
- **Historical Dataset**: Local JSON/CSV files (`data/nifty50_daily.json`, `data/nifty50_daily.csv`)
- **Backtest Engine**: Pure TypeScript execution module ([`src/lib/backtest/runBacktest.ts`](file:///d:/Projects/AlgoChowk/src/lib/backtest/runBacktest.ts))
- **AI Route Handler**: Next.js Server Route Handler ([`src/app/api/learn/route.ts`](file:///d:/Projects/AlgoChowk/src/app/api/learn/route.ts))

---

## Dataset Provenance

- **Instrument**: NIFTY 50 Index Spot (`^NSEI`)
- **Data Source**: Exported daily OHLC historical spot rates (Yahoo Finance `^NSEI`)
- **Time Window**: September 12, 2016 to September 11, 2026 (10 full years, 2,467 trading bars)
- **Fields**: `Date`, `Open`, `High`, `Low`, `Close`
- **File Locations**: [`data/nifty50_daily.csv`](file:///d:/Projects/AlgoChowk/data/nifty50_daily.csv) & [`data/nifty50_daily.json`](file:///d:/Projects/AlgoChowk/data/nifty50_daily.json)

---

## Project Structure

```text
AlgoChowk/
├── data/
│   ├── nifty50_daily.csv       # Raw 10-year NIFTY 50 OHLC CSV
│   └── nifty50_daily.json      # Structured historical market bars JSON
├── src/
│   ├── app/
│   │   ├── api/learn/route.ts  # Server-side Gemini API Route Handler
│   │   ├── layout.tsx          # Root app layout
│   │   └── page.tsx            # Main AlgoChowk state coordinator
│   ├── components/
│   │   ├── AskStage.tsx        # Stage 1: Question entry & validation
│   │   ├── ClarifyStage.tsx    # Stage 2: Ambiguity resolution & parameter configuration
│   │   ├── DefineStage.tsx     # Stage 3: ExperimentSpec contract review
│   │   ├── TestStage.tsx       # Stage 4: Deterministic backtest execution & metrics
│   │   └── LearnStage.tsx      # Stage 5: Synthesis, findings & report export
│   ├── lib/
│   │   ├── ai/                 # Gemini prompt, schema validation & fallback synthesis
│   │   ├── backtest/           # Pure deterministic backtest execution engine
│   │   ├── data/               # CSV parser and dataset loader utilities
│   │   ├── experiment/         # Intent parser and ExperimentSpec default factories
│   │   └── report/             # Self-contained HTML research report generator
│   └── types/
│       └── experiment.ts       # Core domain interfaces (ExperimentSpec, EmpiricalResult)
├── package.json
└── tsconfig.json
```

---

## Running Locally

### Prerequisites
- Node.js 18+ installed

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If omitted, the application automatically uses the built-in deterministic fallback engine).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Prototype Limitations

- **Local Dataset Window**: Backtesting is evaluated over 10 years of NIFTY 50 daily spot data; intraday granularities or multi-asset feeds are not included in this prototype.
- **Event-Study Modeling**: Evaluates individual signal occurrences as independent trade events rather than simulating a sequential portfolio account balance.
- **Simplified Friction Model**: Transaction costs use a static prototype friction assumption (`0.10%`) rather than dynamic order-book slippage logs.
- **No Live Trading Execution**: Designed strictly for historical strategy research, not live order execution.

---

## Design Philosophy

> *"Build less. Think more."*

AlgoChowk focuses on making ambiguity explicit, turning vague research questions into reproducible experiments, separating empirical evidence from interpretation, and helping users identify logical next questions.
