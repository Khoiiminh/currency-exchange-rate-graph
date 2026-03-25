<span style="display:flex; justify-content:center; font-size:2rem; font-weight:bold">BACKEND FLOW STRUCTURE</span>
<hr />

- [1. System Initialization Flow](#1-system-initialization-flow)
- [2. Client Connection FLow](#2-client-connection-flow)
- [3. Context Set Flow](#3-context-set-flow)
- [4. Initial Data Flow (Graph Preload)](#4-initial-data-flow-graph-preload)
- [5. Polling + Event Creation Flow (Core Loop)](#5-polling--event-creation-flow-core-loop)
- [6. Internal Event Handling Flow](#6-internal-event-handling-flow)
- [7. Rolling Hitory Management Flow](#7-rolling-hitory-management-flow)
- [8. Real-Time Update Flow (Graph Streaming)](#8-real-time-update-flow-graph-streaming)
- [9. Context Change Flow](#9-context-change-flow)
- [10. Threshold Detection Flow](#10-threshold-detection-flow)
- [11. Error Handling Flow](#11-error-handling-flow)
- [12. Data Flow Summary (End-to-End)](#12-data-flow-summary-end-to-end)
- [13. Event Contract](#13-event-contract)
- [14. Key Guarantees](#14-key-guarantees)
- [15. Coding Rules](#15-coding-rules)
  - [Example of Clean OOP + Event-Driven Structure](#example-of-clean-oop--event-driven-structure)


# 1. System Initialization Flow
```bash
[Server Start]
    ↓
Initialize core modules:
    - historyStore (in-memory, per currency pair)
    - subscriptionManager (client → pair mapping)
    - eventBus (internal event system)
    ↓
Start WebSocket server
    ↓
Start polling scheduler (e.g., every 5s)
```

# 2. Client Connection FLow
```bash
[Client connects via WebSocket]
    ↓
Register client (connection established)
    ↓
Assign default currency context (USD → EUR)
    ↓
subscriptionManager:
    - Subscribe client to default pair
    ↓
historyStore:
    - Use cached history OR fetch if missing
    ↓
Send INITIAL_DATA immediately
```

# 3. Context Set Flow

<span style="font-size:1.5rem">**(subcription Setup)**</span>
```JSON
{
  "type": "SET_CONTEXT",
  "payload": {
    "base": "USD",
    "targets": ["EUR"]
  }
}
```
```
[Backend receives SET_CONTEXT]
    ↓
subscriptionManager:
    - Register client to pair(s) (e.g., USD_EUR)
    ↓
Check historyStore:
    ↓
    IF exists → use cached history
    IF NOT → fetch historical data from API
    ↓
Normalize + sort data (old → new)
    ↓
Send INITIAL_DATA
```

<span style="font-size:1.5rem">*Default context assignment is equivalent to an implicit SET_CONTEXT event. FLOW#2 and FLOW#3*</span>

# 4. Initial Data Flow (Graph Preload)
```bash
[Backend prepares dataset]
    ↓
Take last N points (recommended: 30)
    ↓
Ensure order: ( for graph sketching )
    LEFT = oldest
    RIGHT = newest
    ↓
Send:

INITIAL_DATA
    ↓
Frontend renders graph immediately
```

# 5. Polling + Event Creation Flow (Core Loop)
```bash
[Scheduler triggers]
    ↓
Fetch latest rates from API
    ↓
For each currency pair:
    ↓
Get last known rate from historyStore
    ↓
Compare with new rate
    ↓
IF rate changed:
    ↓
eventBus.emit(RATE_UPDATED)
```

# 6. Internal Event Handling Flow 
```
[eventBus receives RATE_UPDATED]
    ↓
Handlers execute independently:

1. historyStore
    → update rolling buffer

2. thresholdService
    → evaluate conditions
    → possibly emit THRESHOLD_TRIGGERED

3. wsServer
    → send RATE_UPDATED to subscribed clients
```

# 7. Rolling Hitory Management Flow
```bash
[New rate arrives]
    ↓
Push into history array
    ↓
WHILE size > 30
    ↓
Remove oldest value
```
Guarantees:
    -   Fixed-size dataset
    -   Smooth left -> right movement
    -   Always graph-ready

# 8. Real-Time Update Flow (Graph Streaming)
```bash
[Backend emits RATE_UPDATED]
    ↓
Client receives event
    ↓
Frontend:
    - Append new point (right side)
    - Remove oldest point (left side)
    ↓
Graph updates incrementally
```

# 9. Context Change Flow
```bash
[User changes dropdown]
    ↓
Client sends SET_CONTEXT
    ↓
subscriptionManager:
    - Remove old subscription
    - Add new subscription
    ↓
historyStore provides correct dataset
    ↓
Send INITIAL_DATA
    ↓
Frontend re-renders graph
```

```
If client disconnects:
    → Remove from all subscriptions
```
Need this to avoid:
-   Memory leak
-   Stale WebSocket references

# 10. Threshold Detection Flow
```bash
[thresholdService listens to RATE_UPDATED]
    ↓
Compare:
    previous state vs current state
    ↓
IF crossing detected:
    ↓
eventBus.emit(THRESHOLD_TRIGGERED)
    ↓
wsServer sends to client
```

A **Threshold Trigger** is:
> A derived event generated when a rate crosses a defined boundary.

<span style="font-size:1.5rem">**Correct Trigger Logic**</span>
```
Track previous state:
    BELOW threshold
    ABOVE threshold

Trigger ONLY when:
    BELOW → ABOVE  (UP)
    ABOVE → BELOW  (DOWN)
```

Example:
```
Condition:
USD → EUR crosses 1.00
```
when
```
Previous: 0.99
Current: 1.01
```
We generate:
```JSON
{
  "type": "THRESHOLD_TRIGGERED",
  "payload": {
    "base": "USD",
    "target": "EUR"
    "threshold": 1.00,
    "direction": "UP",
    "rate": 1.01
  }
}
```
This enables:
1. Alert 
   *    UI toast
   *    Notification
2. Strategy simulation
   *    "Buy when > X"
   *    "Sell when < Y"
3. Derived streams
```
RAW EVENTS: RATE_UPDATED
DERIVED EVENTS: THRESHOLD_TRIGGERED
```

# 11. Error Handling Flow
```
[Polling Service triggers fetch]
    ↓
Call external API
    ↓
IF fetch SUCCESS:
    ↓
Continue normal flow (FLOW #5)

-------------------------------------

IF fetch FAILS:
    ↓
Log error (with timestamp + pair info)
    ↓
DO NOT emit RATE_UPDATED event
    ↓
DO NOT update historyStore
    ↓
Keep previous state unchanged
```
System Awareness
```
(Optional)

IF repeated failures detected:
    ↓
eventBus.emit(SYSTEM_WARNING)
    ↓
wsServer sends warning to clients
```

# 12. Data Flow Summary (End-to-End)
```bash
          [External API]
                 ↓
          (Polling Service)
                 ↓
            eventBus.emit
                 ↓
     ┌────────────┼────────────┐
     ↓            ↓            ↓
[historyStore] [thresholdSvc] [wsServer]
     ↓                          ↓
 (rolling data)           Clients (WebSocket)
```

# 13. Event Contract

From client to server
```JSON
{ 
    "type": "SET_CONTEXT", 
    "payload": { 
        "base": "USD", 
        "targets": ["EUR"] 
    }
}
```

From server to client
- Initial graph(preloaded)
```JSON
{
  "type": "INITIAL_DATA",
  "payload": {
    "base": "USD",
    "target": "EUR",
    "points": [...]
  }
}
```
Real-time update
```JSON
{
  "type": "RATE_UPDATED",
  "payload": {
    "timestamp": 1710001000000,
    "rate": 0.96
  }
}
```
Threshold alert
```JSON
{
  "type": "THRESHOLD_TRIGGERED",
  "payload": {
    "base": "USD",
    "target": "EUR"
    "threshold": 1.00,
    "direction": "UP",
    "rate": 1.01
  }
}
```

# 14. Key Guarantees 
  -   Graph is never empty on load 
  -   Data flows left (old) -> right (new) on the graph
  -   Updates are incremental (delta-based)
  -   Duplicate data is filtered (no redundant events)
  -   Backend is event-driven (internally via eventBus)
  -   Clients receive only subscribed data (no global spam)
  -   Threshold events are state-aware (no repeated triggers)
  -   UI is fully context-driven
  -   System is resilient to API inconsistencies (missing or delayed updates)
  -   System never emits invalid or partial data to clients

# 15. Coding Rules

Hybrid: OOP + Functional + Event-driven
```
Use OOP to model STATEFUL components
Use functions for LOGIC
Use events for COMMUNICATION
```

Use OOP for:
-  Stateful components:
    -   `historyStore`
    -   `subscriptionManager`
- Clear responsibilities:
    -   `pollingService`
    -   `thresholdService`
- Encapsulation matters:
    -   Hide internal logic
    -   Expose clean APIs

<span style="font-size:1.5rem">**Core OOP Principles**</span>

<span style="font-size:1.2rem">1. Each module controls its own state</span>

Example:
```TypeScript
class HistoryStore {
  constructor(maxPoints = 30) {
    this.maxPoints = maxPoints;
    this.store = new Map();
  }

  addPoint(pair, point) {
    const history = this.store.get(pair) || [];
    history.push(point);

    while (history.length > this.maxPoints) {
      history.shift();
    }

    this.store.set(pair, history);
  }

  getHistory(pair) {
    return this.store.get(pair) || [];
  }
}
```
No one outsid can touch the `.store` directly

<span style="font-size:1.2rem">2. Single Responsibility Principle (SRP)</span>

Each class does one thing:
| Class                 | Responsibility             |
| --------------------- | -------------------------- |
| `HistoryStore`        | manage time-series data    |
| `SubscriptionManager` | track client subscriptions |
| `PollingService`      | fetch external data        |
| `ThresholdService`    | detect threshold events    |

<span style="font-size:1.2rem">3. Dependency Injection</span>

Instead of:
```TypeScript
const historyStore = new HistoryStore();
```
Inject dependencies:
```TypeScript
const thresholdService = new ThresholdService(historyStore, eventBus);
```

<span style="font-size:1.2rem">4. Open/Closed Principle</span>

```
Open for extension
Closed for modification
```
Example:
-   Add new event handler -> don't change existing logic
-   Just subscribe to `eventBus`

## Example of Clean OOP + Event-Driven Structure

<span style="font-size:1.5rem">1. EventBus (Core)</span>

```TypeScript
const EventEmitter = require('events');

class EventBus extends EventEmitter {}
```
<hr />

<span style="font-size:1.5rem">2. HistoryStore</span>

```TypeScript
class HistoryStore {
  constructor(maxPoints = 30) {
    this.maxPoints = maxPoints;
    this.store = new Map();
  }

  addPoint(pair, point) {
    const history = this.store.get(pair) || [];
    history.push(point);

    while (history.length > this.maxPoints) {
      history.shift();
    }

    this.store.set(pair, history);
  }

  getLast(pair) {
    const history = this.store.get(pair) || [];
    return history[history.length - 1];
  }

  getHistory(pair) {
    return this.store.get(pair) || [];
  }
}
```
<hr />

<span style="font-size:1.5rem">3. SubscriptionManager</span>

```TypeScript
class SubscriptionManager {
  constructor() {
    this.subscriptions = new Map(); // pair → Set(clients)
  }

  subscribe(client, pair) {
    if (!this.subscriptions.has(pair)) {
      this.subscriptions.set(pair, new Set());
    }
    this.subscriptions.get(pair).add(client);
  }

  unsubscribe(client, pair) {
    this.subscriptions.get(pair)?.delete(client);
  }

  removeClient(client) {
    for (const clients of this.subscriptions.values()) {
      clients.delete(client);
    }
  }

  getClients(pair) {
    return this.subscriptions.get(pair) || new Set();
  }
}
```
<hr />

<span style="font-size:1.5rem">4. PollingService</span>

```TypeScript
class PollingService {
  constructor(eventBus, historyStore, fetchFn, interval = 5000) {
    this.eventBus = eventBus;
    this.historyStore = historyStore;
    this.fetchFn = fetchFn;
    this.interval = interval;
  }

  start() {
    setInterval(async () => {
      try {
        const rates = await this.fetchFn();

        for (const pair of Object.keys(rates)) {
          const newRate = rates[pair];
          const last = this.historyStore.getLast(pair);

          if (!last || last.rate !== newRate) {
            this.eventBus.emit('RATE_UPDATED', {
              pair,
              rate: newRate,
              timestamp: Date.now()
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err.message);
      }
    }, this.interval);
  }
}
```
<hr />

<span style="font-size:1.5rem">5. ThresholdService</span>

```TypeScript
class ThresholdService {
  constructor(eventBus, thresholds = {}) {
    this.eventBus = eventBus;
    this.thresholds = thresholds;
    this.state = {}; // pair → ABOVE/BELOW

    this.eventBus.on('RATE_UPDATED', this.handle.bind(this));
  }

  handle(event) {
    const { pair, rate } = event;
    const threshold = this.thresholds[pair];

    if (!threshold) return;

    const prev = this.state[pair] || 'BELOW';
    const current = rate >= threshold ? 'ABOVE' : 'BELOW';

    if (prev !== current) {
      this.eventBus.emit('THRESHOLD_TRIGGERED', {
        pair,
        threshold,
        direction: current === 'ABOVE' ? 'UP' : 'DOWN',
        rate
      });
    }

    this.state[pair] = current;
  }
}
```

<span style="font-size:1.5rem">6. WebSocket Layer</span>

```TypeScript
class WSHandler {
  constructor(eventBus, subscriptionManager) {
    this.eventBus = eventBus;
    this.subscriptions = subscriptionManager;

    this.eventBus.on('RATE_UPDATED', this.broadcast.bind(this));
  }

  broadcast(event) {
    const clients = this.subscriptions.getClients(event.pair);

    for (const client of clients) {
      client.send(JSON.stringify(event));
    }
  }
}
```
