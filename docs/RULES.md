<span style="display:flex; justify-content:center; font-size:2rem; font-weight:bold">BACKEND RULES</span>
<hr />

- [1. Design Architecture](#1-design-architecture)
- [2. Key Guarantees](#2-key-guarantees)
- [3. Notices](#3-notices)
- [4. Coding Rules](#4-coding-rules)
- [5. More to Improve](#5-more-to-improve)

# 1. Design Architecture

This system will follow the Vertical-Sliced design.

Read-heavy system, users are guaranteed to be kept up-to-date immediately.

# 2. Key Guarantees 
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

# 3. Notices

ExchangeRate API does not support historical exchange rates. So, the system need the very first 30 data points ( for building the visualized graph ), stored in database. Therefore, we need to choose a suitable database for this. We can also use other API resources, which support historical data, to fill our database with them (50+ data points, for further development of historical observation right on the graph) (checked)

The ExchangeRate API does not work when the client host - computer is turning on the VPN ( in a specific case, it is a 1.1.1.1 wrapper ). The system needs to handle this for working under whatever conditions. (checked)

The system needs to obey the read-heavy feature; users must be kept up-to-date with actual data from the ExxchangeRate API. Hence, we need a cache strategy for this, read fast for the user and write it to database without losing any data. (checked)

# 4. Coding Rules

Hybrid: OOP + Functional + Event-driven

# 5. More to Improve
- Cache Expiration
- Background Refresh
- Batching Requests
- Retry Strategies
- Event Refactoring