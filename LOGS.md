# Project Logs

Tracks notable issues found during development, their root cause, and the
fix applied. Each entry is classified as:

- **Human error** — scope was incomplete, unclear, or too broad when the
  work was requested.
- **AI error** — wrong/duplicated code, wrong lookup, wrong variable, or a
  missed piece of existing code during implementation.

---

## 2026-08-27 — Initial Architecture & Scope Definition (Single-screen vs Multi-page)

**Type:** Human error (Unclear / broad initial specification)

**Symptom:** Initial project request needed clarity on whether the app was a lightweight single-screen diagnostic telemetry utility or a complex multi-page dashboard with backend routing.

**Root cause:** Initial feature set requirements required defining boundary constraints: client-side browser fetch timing approximations vs backend ICMP ping daemon, and single-screen compact telemetry vs deep navigation.

**Fix:**
- Established project boundaries as a client-side high-performance Single Page Application (SPA) focusing on high-speed round-trip telemetry without unnecessary server bloat.
- Defined standard 14 global endpoint targets across gaming, cloud, and communication backbones.

**Files changed:** `src/App.tsx`, `src/utils/ping.ts`, `README.md`, `LOGS.md`

---

## 2026-08-27 — Inflated ping readings for Steam / Riot / EA / Battle.net

**Type:** AI error (original implementation & cache-busting logic)

**Symptom:** Steam, Riot Games, EA, and Battle.net consistently showed
ping values in the thousands of ms, far higher than real network latency,
while Google/Cloudflare/AWS/Discord endpoints reported normal values.

**Root cause:**
`src/utils/ping.ts` appended a random cache-busting query parameter
(`?nocache=<timestamp>_<random>`) to every request. For dynamic endpoints
(DNS-over-HTTPS, `cdn-cgi/trace`, DynamoDB API) this had no effect, since
those are never cached anyway. But the endpoints chosen for Steam/Riot/EA/
Battle.net were static files (`robots.txt`) normally served from CDN edge
cache. The random query string bypassed that edge cache on every request,
forcing traffic to origin infrastructure sitting behind WAF/bot-mitigation.
The rapid, repeated, oddly-parameterized request pattern (10 requests in
~2s) looked bot-like to those systems, which added large processing/
challenge delay before responding — inflating the measured round-trip
time. `cache: 'no-store'` alone (which only affects the browser's own HTTP
cache) was not the cause and did not need to change.

**Fix:**
- Removed the cache-busting query parameter from `pingEndpoint()`.
  `cache: 'no-store'` already guarantees a real network round-trip; busting
  the CDN edge cache on top of that was unnecessary and actively harmful
  for WAF-protected static endpoints.
- Added a discarded warm-up request before the 10 measured pings per
  server, so first-connection TLS handshake cost no longer skews the
  average latency for any endpoint.

**Files changed:** `src/utils/ping.ts`, `src/App.tsx`

**Follow-up / limitation:** This is still an HTTPS-fetch-based
approximation, not real ICMP ping, so absolute numbers should be treated
as relative comparisons rather than exact figures.

---

## 2026-08-27 — Inflated ping on Battle.net & EA endpoints due to canonical redirects

**Type:** AI error (endpoint selection & redirect overhead)

**Symptom:** Battle.net endpoint produced excessively high ping readings (~2x higher latency) when requesting `battle.net/robots.txt` or `www.blizzard.com/favicon.ico`.

**Root cause:** 
1. `battle.net/robots.txt` underwent multiple 301/302 canonical redirects to Blizzard's main web domain while incurring WAF origin validation delays.
2. `www.blizzard.com/favicon.ico` resulted in 307 temporary redirects and strict Akamai edge challenges with high overhead.

**Fix:** Switched Battle.net endpoint to `oauth.battle.net/.well-known/openid-configuration`, an official Battle.net metadata endpoint that returns direct HTTP 200 responses globally without redirect hops or challenge delays. Also updated EA endpoint to `www.ea.com/robots.txt` to eliminate 301 redirect overhead from apex domain.

**Files changed:** `src/utils/ping.ts`

---

## 2026-08-27 — Misleading "4G 20Mbps" on 1Gbps Fiber & Inefficient Vertical Spacing

**Type:** AI error (API interpretation & Layout design)

**Symptom:** 
1. Users connected to 1Gbps LAN / Fiber optic reported that the NET_INTEL bar erroneously displayed "4G 20Mbps".
2. The UI required excessive vertical scrolling with large cards and unused white space.

**Root cause:**
1. Chromium/W3C `navigator.connection.effectiveType` uses `'4g'` as its generic upper ceiling for any fast broadband connection, and `navigator.connection.downlink` is deliberately capped at 10Mbps/20Mbps by browser security policies to prevent device fingerprinting. Displaying this raw value confused users with high-speed 1Gbps/fiber connections.
2. The initial design stacked the hero/graph and a 14-item card grid vertically in a single column, wasting horizontal monitor real estate and causing excessive page height.

**Fix:**
1. Replaced reliance on raw `effectiveType` and capped `downlink`. First inspect `navigator.connection.type` for physical medium (`ethernet` -> `ETHERNET (LAN/FIBER)`, `wifi` -> `WI-FI`), or categorize high-speed connections as `HIGH-SPEED BROADBAND / FIBER` while omitting the capped browser downlink figure.
2. Re-architected layout into a balanced **2-Column Split View**:
   - **Left Column**: Test controllers, Live status, Real-time ping graph, and Summary benchmarks.
   - **Right Column**: Compact, high-density 2-column server grid that shows all 14 endpoints neatly in view without excessive vertical scrolling.

**Files changed:** `src/App.tsx`, `src/components/ShareModal.tsx`

---

## 2026-08-27 — UI/UX Pro Max Skill Integration & Typography Readability Restoration

**Type:** AI error (Extreme Font Size Downgrade / Over-reduction)

**Symptom:** 
1. When asked to reduce the width of individual server cards in the right column, the AI erroneously reduced the font size across the entire application down to 6px–8px, making text illegible.
2. Loss of design system standards and hierarchy.

**Root cause:**
1. The agent conflated "reduce box width" with "scale down the entire font scale", violating basic UI/UX readability and accessibility standards (minimum readable text rules).

**Fix:**
1. Installed and integrated the `ui-ux-pro-max` skill from `nextlevelbuilder/ui-ux-pro-max-skill` into `/skills/ui-ux-pro-max/SKILL.md` and `.claude/skills/ui-ux-pro-max/SKILL.md`.
2. Restored proper typography scale across all elements:
   - App Title: 18px–20px bold
   - Buttons & Action controls: 12px–14px bold with comfortable touch padding
   - Primary Metrics: 24px–32px bold numbers
   - Server Box details: 12px–14px server names, 16px–18px ping metrics, 10px–11px badges
   - NET_INTEL panel: 12px–14px crisp telemetry and IP readout
3. Maintained snug, compact box widths in the right column using a responsive 4-column grid (`xl:grid-cols-4`, `md:grid-cols-3`, `grid-cols-2`) without sacrificing text legibility.

**Files changed:** `src/App.tsx`, `skills/ui-ux-pro-max/SKILL.md`, `.claude/skills/ui-ux-pro-max/SKILL.md`, `LOGS.md`

---

## 2026-08-27 — Complete Modernization & Visual Polish Optimization

**Type:** AI error (Inconsistent brutalist borders and messy alignment)

**Symptom:** The interface was visually noisy with harsh 2px solid black borders, aggressive offset drop shadows, cluttered information arrangement, and inconsistent card structures that felt messy to the user.

**Root cause:** Leftover conflicting neobrutalist styling (`border-2 border-black`, hard offset box shadows) mixed with modern telemetry elements created visual fatigue, poor spacing harmony, and optical vibration.

**Fix:**
1. Re-engineered the design system following sleek modern developer telemetry aesthetics (inspired by Cloudflare Radar / Vercel):
   - **Colors & Canvas**: Soft `#F8FAFC` light canvas with subtle zinc borders (`border-zinc-200/80`) and refined rounded corners (`rounded-2xl`, `rounded-xl`). Sleek dark mode on `#09090B` canvas with dark titanium card containers (`dark:bg-[#141417]`).
   - **Header**: Polished navigation bar with brand pulse icon, status pill, language selector, and system/light/dark theme switcher.
   - **Network Intelligence (NET_INTEL)**: Streamlined into a single-row horizontal telemetry bar featuring Public IP, Geolocation, ISP & ASN, and Connection Type with clean icons and crisp badges.
   - **Main 2-Column Split**:
     - *Left Column*: Primary Start/Stop benchmark controller, real-time live area chart during sampling, global average latency readout, and packet loss metrics.
     - *Right Column*: Responsive 4-column grid of compact, uniform server target cards with status dots, provider badges, clear latency readouts, and active progress gauges.
   - **Share & Export Modal**: Refined modal dialog with backdrop blur and instant SVG/PNG downloads.

**Files changed:** `src/App.tsx`, `src/components/ui/Button.tsx`, `src/components/ui/Card.tsx`, `src/components/ServerGraph.tsx`, `src/components/ShareModal.tsx`, `LOGS.md`

---

## 2026-08-27 — Non-blocking Cancellation Logic in Async Test Loops

**Type:** AI error (Incomplete loop interruption handling)

**Symptom:** When clicking "Stop Test" during a multi-server test run, subsequent pings in the active server batch occasionally continued firing before resolving.

**Root cause:** `stopRequestedRef` flag was only evaluated at the outer server loop level, not inside the inner warm-up step or between delay intervals of the burst ping loop.

**Fix:**
1. Injected immediate `if (stopRequestedRef.current) break;` checks before warm-up execution, inside the 10-ping burst iteration, and during intermediate delays.
2. Updated the stop handler to immediately finalize and preserve valid captured samples without leaving the UI in an indeterminate pending state.

**Files changed:** `src/App.tsx`, `LOGS.md`







