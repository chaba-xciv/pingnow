---
name: ui-ux-pro-max
description: UI/UX Pro Max Design Intelligence for building professional, responsive, and accessible user interfaces. Use when creating, refactoring, or optimizing modern web UI/UX across Tailwind CSS, React, Vue, and modern design systems.
---

# UI/UX Pro Max — Design Intelligence Framework

A comprehensive design system and UX guideline framework derived from `nextlevelbuilder/ui-ux-pro-max-skill`.

## Core Principles

### 1. Typography & Hierarchy
- **Base Font Size**: Minimum body font size is 14px–16px. Never drop below 11px–12px even for microcopy/metadata.
- **Hierarchy Scale**:
  - Display / Hero: 32px – 48px
  - H1 / Section Title: 20px – 28px
  - H2 / Subheadings: 16px – 20px
  - Body Text: 14px – 16px (line-height 1.5 – 1.6)
  - Small / Badges / Captions: 11px – 13px
- **Contrast**: Maintain WCAG AA compliance (4.5:1 for body text, 3:1 for large text and key UI borders).

### 2. Spacing & Density Math
- **Component Padding**:
  - Buttons: Horizontal padding = 2x vertical padding (e.g., `px-4 py-2` or `px-3 py-1.5`).
  - Cards / Containers: Consistent padding `p-3` to `p-5` with appropriate gutter gap `gap-2` to `gap-4`.
- **Card Sizing**: Size cards to content gracefully. Avoid oversized empty boxes, but never sacrifice typography legibility to achieve density.

### 3. Color & Theme Systems
- **High-Contrast Dark / Light Archetypes**:
  - Light mode: Pure `#FAF9F5` or `#F4F4F0` background with crisp `#000000` / `#18181B` borders and `#10B981` accents.
  - Dark mode: `#0D0D0E` or `#121214` background with `#FFFFFF` / `#27272A` borders and `#34D399` accents.
- **Brutalist / Technical Precision**: Sharp 2px borders, 2px–3px solid offset shadows, monospace accents, and instant interactive feedback.

### 4. Usability & Anti-Pattern Prevention
- ❌ **Anti-Pattern**: Microscopic unreadable fonts (< 10px).
- ❌ **Anti-Pattern**: Oversized cards with 80% wasted whitespace.
- ❌ **Anti-Pattern**: Low contrast gray-on-gray text.
- ✅ **Best Practice**: Compact, information-dense cards with clear, scannable numbers (16px–24px) and crisp labels (11px–13px).
- ✅ **Best Practice**: Real-time feedback with live progress bars and active state highlights.
