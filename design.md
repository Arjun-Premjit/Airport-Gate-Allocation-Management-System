# LGM Aviation - Globally Trusted. Responsive. Agile.

## Overview

**Product:** LGM Aviation - Globally Trusted. Responsive. Agile.  
**URL:** https://lgmaviation.com/  
**Surface type:** marketing  
**Audience:** Developers and technical decision-makers  
**Brand character:** Conversion-focused marketing presence with a minimal, restrained color palette and a complementary two-font typographic system.

### Design Principles

- Consistency over novelty — reuse existing patterns before inventing new ones.
- Token-driven — every visual decision references a token, not a magic number.
- Accessible by default — compliance is a baseline, not a feature.

## Colors

| Token | Value | Role |
|-------|-------|------|
| color-3 | `#F5F5F7` | Background |
| color-4 | `#FFFFFF` | Background |
| color-1 | `#000000` | Text Primary |
| color-2 | `#0D98D1` | Accent |

## Typography

**Font stack:** DM Sans, ui-sans-serif

| Level | Size | Line Height | Usage |
|-------|------|-------------|-------|
| text-xs | 16px | 24px | Captions, metadata |
| text-sm | 20px | 28px | Labels, secondary text |
| text-base | 24px | 36px | Body text (default) |
| text-lg | 56px | 56px | Subheadings, emphasis |

**Weight scale:** 400 · 500 · 600 · 700  
**Line heights:** 56px · 24px · 36px · 28px

## Spacing

**Base unit:** 4px

`space-1: 6px` · `space-2: 15px` · `space-3: 24px` · `space-4: 32px` · `space-5: 47px` · `space-6: 64px` · `space-7: 3650px`

## Shapes

**Border radius:** _None detected (Sharp structural grid lines with divide-x / divide-y layouts; rounded-full for pills)._

## Elevation

_None detected (Flat architectural hairline borders and dividers)._

## Motion

- **duration-fast:** `all 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- **duration-slow:** `0.5s forwards wave`, `30s`, `60s`

## Components

- **Buttons:** 3 detected
- **Links:** 24 detected
- **Navigation:** 3 elements
- **Lists:** 5 detected
- **Images:** 34 detected

## Do's and Don'ts

### Do

- Reference tokens by name, not raw values — agents and developers should use `color.text.primary`, not `#171717`.
- Define all interactive states: default, hover, focus-visible, active, disabled.
- Use the spacing scale for all padding, margin, and gap values.
- Write content in sentence case. Reserve ALL CAPS for acronyms only.
- Test every component at the smallest and largest breakpoint before shipping.

### Don't

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Writing Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or updating a component guideline for this system, follow this sequence:

1. **State the intent** — one sentence on what the component does and why it exists.
2. **Map tokens** — list every color, spacing, typography, and radius token the component uses. No raw values.
3. **Define anatomy** — break the component into named parts (container, label, icon, etc.) with their token assignments.
4. **Specify states** — document every state: default, hover, focus-visible, active, disabled, loading, error, empty.
5. **Describe interactions** — keyboard, pointer, and touch behavior, including edge cases (long content, overflow, truncation).
6. **Add accessibility criteria** — write testable pass/fail checks (e.g. "focus ring must be visible at 3:1 contrast").
7. **List anti-patterns** — concrete examples of misuse with a brief explanation of why each is wrong.
8. **Close with a QA checklist** — a mechanical list of verifiable items (see Definition of Done below).

## Component Requirements

Every component built against this system must:

- Reference only tokens defined in the tables above — no hardcoded hex, px, or font values.
- Define all interactive states: default, hover, focus-visible, active, disabled, loading, error.
- Specify responsive behavior at the smallest and largest supported breakpoint.
- Handle edge cases: empty state, overflow / truncation, maximum content length.
- Include keyboard navigation (Tab, Enter, Escape, Arrow keys where applicable).
- Document ARIA roles, labels, and live-region behavior where relevant.
- Include known page component density: 3 buttons, 24 links, 3 navigation elements, 5 lists, 34 images.

## Definition of Done

A component is not complete until every item below is checked:

- Renders correctly in its default state (smoke test).
- All states documented and visually verified (hover, focus, disabled, loading, error, empty).
- All visual values use design tokens — zero hardcoded values.
- Keyboard navigation works without a pointer.
- No critical accessibility violations (contrast, ARIA, focus order).
- Tested at min and max breakpoint.
- At least one anti-pattern documented.
- Purpose, usage, and limitations documented.
