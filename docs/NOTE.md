<span style="display:flex; text-align:center; justify-content:center">Currency Exchange Rate Graph Web App</span>
==========================
# Concept

**Goal:** Track and visualize currency exchange rate changes between countries in real time.

**Event-driven flavor:** Each rate update is an event, and the system reacts by updating the graph or triggering analytics (like spikes, alerts, or trends).

# Event Type

Read-heavy event-driven: You mostly react to incoming updates.
* Events examples:
  * Rate of USD→EUR updated
  * Rate of JPY→GBP updated
  * Rate crosses a threshold (optional: generate “alert” event)

# Tech stack (free & self-contained)

1. Frontend: React + Recharts/D3.js for graphs
2. Backend: Node.js/Express
3. Data source: Free APIs like:
   * European Central Bank (ECB) provides free daily rates
   * ExchangeRate.host (free, no API key)
   * Use local mock JSON if you want fully offline testing
4. Event handling:
   * WebSocket or Server-Sent Events (SSE) for pushing updates to clients
   * Each API fetch creates an event in your system

# Extras / fun ideas
* Highlight volatility with color-coded graph edges
* Show historical spikes or correlations between currencies
* Let users subscribe to “rate thresholds” (like Slack notifications, but local web alerts)

Explicitely:
  * Subscribe to thresholds:
    *   User sets USD→EUR > 1.05 → alert appears when triggered.
  * Volatility highlights:
    *   Sudden changes → red for sharp drop, green for sharp rise.
  * Multiple currency comparison:
    *   Display 2–3 pairs on same graph, with correlation visualization.
  * Offline mode / demo mode:
    *   Load static JSON to test without hitting APIs.

# APIs

**Frankfurter API** - Free, open‑source service that pulls rates published by the European Central Bank.
  * No API key required
  * Supports latest rates, historical data, time series
  * Works directly from browser or backend
  * You can also self‑host it if you want full control
    * Example: https://api.frankfurter.dev/v1/latest
    * Updated daily with ECB reference rates.
  
**Exchangerate.host** - Free REST API with real‑time and historical foreign exchange & crypto rates.
  * No API key required
  * JSON responses
  * Latest & historical rates, conversions, time‑series
  * Free public API usable from any language/environment
    * e.g., https://api.exchangerate.host/latest
    * Great for fetching a variety of currency pairs.

**Currency‑api (via jsDelivr CDN)** - A static JSON dataset hosted on CDN with latest and historical rates for 150+ currencies.
  * No authentication
  * Delivered as static JSON (ideal for front‑end prototyping too)
    * e.g., https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd/eur.json
    * Easy to integrate, no limits or keys required.

**ForeignRateAPI** – Another key‑less API with conversion rates in simple JSON.
  * No signup required
  * Ideal for demos and side projects
    * Just hit their endpoint for latest rates without auth.

# Notes on Free / Offline Strategy
  -   Fully free & online: Use ExchangeRate.host or Frankfurter.
  -   Offline / prototyping: Serve static JSON from jsDelivr or your own file.
  -   Backend caching: Keep recent rates in memory to avoid hitting APIs too often.