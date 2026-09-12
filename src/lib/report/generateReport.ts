import { ExperimentSpec, EmpiricalResult, ResearchInterpretation } from '@/types';

function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function generateReportHtml(
  spec: ExperimentSpec,
  result: EmpiricalResult,
  interpretation: ResearchInterpretation | null
): string {
  const isPump = spec.signalDirection === 'pump';
  const isSell = spec.tradeDirection === 'sell';
  const thresholdPct = Math.abs(spec.fallThresholdPct.value);
  const holdingDays = spec.holdingPeriod.value;
  const startDate = spec.testPeriod.value.startDate || '2016-09-12';
  const endDate = spec.testPeriod.value.endDate || '2026-09-11';
  const generatedAt = new Date().toISOString().split('T')[0];

  const dataFindings = interpretation?.dataFindings || [
    `Total trade signals evaluated: ${result.metrics.totalTrades} occurrences.`,
    `Trade-level net win rate: ${result.metrics.winRatePct}%.`,
    `Average net return per trade: ${result.metrics.averageReturnPct >= 0 ? '+' : ''}${result.metrics.averageReturnPct}%.`,
  ];

  const conclusions = interpretation?.conclusions || [
    `Over the evaluated decade, ${isSell ? 'selling/shorting' : 'buying'} NIFTY 50 after a ${thresholdPct}% sharp ${isPump ? 'rise' : 'drop'} and holding for ${holdingDays} trading sessions produced ${result.metrics.averageReturnPct >= 0 ? 'positive' : 'negative'} trade-level statistics.`,
    `The evidence is derived from historical event study observations and does not guarantee future results.`,
  ];

  const limitations = interpretation?.limitations || [
    `Historical sample size is limited to ${result.metrics.totalTrades} signal occurrences.`,
    `Transaction costs use a prototype friction model (~0.10%) rather than real broker execution execution logs.`,
    `Overlapping holding windows during sustained market drawdowns are treated as independent events.`,
  ];

  const nextQuestions = interpretation?.suggestedNextQuestions || [
    `How does varying the threshold (e.g. 1.0% vs 2.0%) alter the win rate and trade count?`,
    `Does introducing a volatility filter (e.g. India VIX) improve signal quality?`,
    `How do performance statistics differ in bull vs bear regime subsets?`,
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlgoChowk Research Report - ${escapeHtml(spec.originalQuestion)}</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --accent: #6366f1;
      --emerald: #34d399;
      --rose: #f87171;
      --amber: #fbbf24;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text-main);
      line-height: 1.6;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 720px;
      margin: 0 auto;
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    h1 {
      font-size: 28px;
      font-weight: 800;
      margin: 0 0 8px 0;
      letter-spacing: -0.02em;
    }
    .date {
      font-size: 13px;
      color: var(--text-muted);
    }
    .section {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 24px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-muted);
      margin-bottom: 16px;
    }
    .question-text {
      font-size: 18px;
      font-weight: 600;
      font-style: italic;
      color: var(--text-main);
      margin: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    @media (max-width: 500px) {
      .grid { grid-template-columns: 1fr; }
    }
    .metric-box {
      background: #0b0f19;
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
    }
    .metric-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 24px;
      font-weight: 800;
      font-family: monospace;
    }
    .metric-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .val-positive { color: var(--emerald); }
    .val-negative { color: var(--rose); }
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .spec-table tr {
      border-bottom: 1px solid rgba(255,255,255,0.05);
    }
    .spec-table tr:last-child {
      border-bottom: none;
    }
    .spec-table td {
      padding: 10px 0;
    }
    .spec-label {
      color: var(--text-muted);
      width: 35%;
      font-weight: 500;
    }
    .spec-val {
      color: var(--text-main);
      font-weight: 600;
    }
    ul, ol {
      margin: 0;
      padding-left: 20px;
      font-size: 14px;
    }
    li {
      margin-bottom: 8px;
    }
    li:last-child {
      margin-bottom: 0;
    }
    .note {
      font-size: 12px;
      color: var(--text-muted);
      border-left: 3px solid var(--border);
      padding-left: 12px;
      margin-top: 12px;
    }
    .footer {
      border-top: 1px solid var(--border);
      padding-top: 24px;
      margin-top: 32px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">AlgoChowk</div>
      <h1>Research Report</h1>
      <div class="date">Generated on ${generatedAt} • Dataset: NIFTY 50 Daily Spot (${startDate} to ${endDate})</div>
    </div>

    <!-- Research Question -->
    <div class="section">
      <div class="section-title">Research Question</div>
      <p class="question-text">&quot;${escapeHtml(spec.originalQuestion)}&quot;</p>
    </div>

    <!-- Experiment Definition -->
    <div class="section">
      <div class="section-title">Experiment Definition</div>
      <table class="spec-table">
        <tr>
          <td class="spec-label">Instrument</td>
          <td class="spec-val">${escapeHtml(spec.instrument.value.symbol)} (${escapeHtml(spec.instrument.value.assetClass.toUpperCase())})</td>
        </tr>
        <tr>
          <td class="spec-label">Signal Trigger</td>
          <td class="spec-val">1-Day Close-to-Close ${isPump ? 'Rise' : 'Decline'} &ge; ${thresholdPct}%</td>
        </tr>
        <tr>
          <td class="spec-label">Entry Timing</td>
          <td class="spec-val">Next Trading-Day Open (${isSell ? 'Sell/Short' : 'Buy/Long'})</td>
        </tr>
        <tr>
          <td class="spec-label">Exit Strategy</td>
          <td class="spec-val">Fixed holding period of ${holdingDays} trading days</td>
        </tr>
        <tr>
          <td class="spec-label">Test Window</td>
          <td class="spec-val">${startDate} to ${endDate}</td>
        </tr>
        <tr>
          <td class="spec-label">Cost Assumptions</td>
          <td class="spec-val">Prototype friction model (~0.10% total per trade)</td>
        </tr>
      </table>
    </div>

    <!-- Quantitative Results -->
    <div class="section">
      <div class="section-title">Empirical Results</div>
      <div class="grid">
        <div class="metric-box">
          <div class="metric-label">Signal Events</div>
          <div class="metric-val">${result.metrics.totalTrades}</div>
          <div class="metric-sub">${result.metrics.winningTrades} Wins / ${result.metrics.losingTrades} Losses</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Win Rate</div>
          <div class="metric-val val-positive">${result.metrics.winRatePct}%</div>
          <div class="metric-sub">Trade-level net win %</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Average Net Return</div>
          <div class="metric-val ${result.metrics.averageReturnPct >= 0 ? 'val-positive' : 'val-negative'}">
            ${result.metrics.averageReturnPct >= 0 ? '+' : ''}${result.metrics.averageReturnPct}%
          </div>
          <div class="metric-sub">Net per trade mean</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Median Net Return</div>
          <div class="metric-val ${result.metrics.medianReturnPct >= 0 ? 'val-positive' : 'val-negative'}">
            ${result.metrics.medianReturnPct >= 0 ? '+' : ''}${result.metrics.medianReturnPct}%
          </div>
          <div class="metric-sub">Net per trade median</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Best Trade Return</div>
          <div class="metric-val val-positive">+${result.metrics.bestReturnPct}%</div>
          <div class="metric-sub">Single max net return</div>
        </div>
        <div class="metric-box">
          <div class="metric-label">Worst single trade return</div>
          <div class="metric-val val-negative">${result.metrics.worstReturnPct}%</div>
          <div class="metric-sub">Single max net drawdown</div>
        </div>
      </div>
      <div class="note">
        <strong>Methodology Note:</strong> These results represent independent event study observations over historical occurrences and are NOT a compounded portfolio return.
      </div>
    </div>

    <!-- What the Data Shows -->
    <div class="section">
      <div class="section-title">1. What the Data Shows</div>
      <ul>
        ${dataFindings.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n        ')}
      </ul>
    </div>

    <!-- What We Can Reasonably Conclude -->
    <div class="section">
      <div class="section-title">2. What We Can Reasonably Conclude</div>
      <ul>
        ${conclusions.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n        ')}
      </ul>
    </div>

    <!-- Limitations -->
    <div class="section">
      <div class="section-title">3. Limitations</div>
      <ul>
        ${limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n        ')}
      </ul>
    </div>

    <!-- What Should We Investigate Next? -->
    <div class="section">
      <div class="section-title">4. What Should We Investigate Next?</div>
      <ol>
        ${nextQuestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n        ')}
      </ol>
    </div>


  </div>
</body>
</html>`;
}

export function downloadResearchReport(
  spec: ExperimentSpec,
  result: EmpiricalResult,
  interpretation: ResearchInterpretation | null
) {
  const htmlContent = generateReportHtml(spec, result, interpretation);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const thresholdStr = Math.abs(spec.fallThresholdPct.value).toString().replace('.', '_');
  const daysStr = spec.holdingPeriod.value;
  const directionStr = spec.signalDirection || 'fall';
  link.download = `algochowk-nifty-sharp-${directionStr}-${thresholdStr}pct-${daysStr}d-research.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
