# pingnow - global latency & telemetry check

A fast, lightweight web telemetry tool for measuring real-time **ping (latency)**, **jitter**, and **packet loss** across global cloud providers (Google, Cloudflare, AWS), gaming backends (Steam, Riot Games, Battle.net, EA), and communication backbones (Discord). Includes instant diagnostic summary sharing (SVG/PNG) and network telemetry analysis.

## Features

- **Global Latency Diagnostics**: Measures 10 requests per server with initial TLS warm-up discard to ensure pristine network round-trip timing.
- **Instant Start/Stop Controller**: Immediate cancellation and live responsiveness upon stopping test sequences.
- **Nerd NET_INTEL Bar**: Automatically detects IP address, IPv4 vs IPv6 classification, Autonomous System Number (ASN), ISP, GPS geocoordinates, timezone, connection type, and estimated downlink.
- **One-Shot Telemetry Sharing Card**: Generates a compact vector telemetry report card with one-click export to high-resolution SVG or crisp PNG, ready for Discord, Twitter, or instant messaging.
- **Tri-Mode Adaptive Theme**: Seamlessly supports System/OS preference auto-detection, manual Light mode, and Dark mode.
- **Bilingual Interface**: Full support for English and Thai (ภาษาไทย).

## How it works (Technical Notes)

Browsers operate within security sandboxes without direct access to raw ICMP sockets. Latency measurements are calculated via high-resolution timing over `fetch()` with `mode: 'no-cors'` and `cache: 'no-store'`. This eliminates local browser caching while preserving edge-optimized round-trip latency to each service's nearest PoP / CDN edge.

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS
- Lucide Icons & Recharts
- Date-fns & SVG XML Serialization

## Developers

- **Human Developer**: chaba-xciv
- **AI Pair-Programmers**: Gemini 2.5 Pro / Gemini 3.7 Flash & Gemini 3.1 Pro (Google AI Studio) / Claude 3.5 Sonnet (Anthropic)
