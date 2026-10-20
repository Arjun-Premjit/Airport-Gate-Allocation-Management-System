---
name: design-system-lgm-aviation-globally-trusted-responsive-agile
description: >
  Apply the LGM Aviation - Globally Trusted. Responsive. Agile. design system when building or updating UI.
  Use when creating components, choosing colors or typography,
  or reviewing designs for marketing interfaces.
---

# LGM Aviation - Globally Trusted. Responsive. Agile. — Design System Skill

## When to Use

- Building new UI components for LGM Aviation - Globally Trusted. Responsive. Agile.
- Reviewing or updating existing component styles.
- Choosing colors, typography, or spacing for marketing pages.
- Checking designs against the extracted token set.

## Context

- **Product:** LGM Aviation - Globally Trusted. Responsive. Agile. — https://lgmaviation.com/
- **Surface:** marketing
- **Audience:** Developers and technical decision-makers
- **Character:** Conversion-focused marketing presence with a minimal, restrained color palette and a complementary two-font typographic system.

## Tokens

### Colors

| Token | Value | Role |
|-------|-------|------|
| color-3 | `#F5F5F7` | Background |
| color-4 | `#FFFFFF` | Background |
| color-1 | `#000000` | Text Primary |
| color-2 | `#0D98D1` | Accent |

### Typography

**Font stack:** DM Sans, ui-sans-serif

| Level | Size | Usage |
|-------|------|-------|
| text-xs | 16px | Captions, metadata |
| text-sm | 20px | Labels, secondary text |
| text-base | 24px | Body text (default) |
| text-lg | 56px | Subheadings, emphasis |

**Weight scale:** 400 · 500 · 600 · 700
**Line heights:** 56px · 24px · 36px · 28px

### Spacing

**Base unit:** 4px

`space-1: 6px` · `space-2: 15px` · `space-3: 24px` · `space-4: 32px` · `space-5: 47px` · `space-6: 64px` · `space-7: 3650px`

### Shapes

**Border radius:** _None detected._

### Elevation

_None detected._

### Motion

- **duration-fast:** `all`
- **duration-fast:** `none`
- **duration-fast:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- **duration-fast:** `color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), translate 0.15s cubic-bezier(0.4, 0, 0.2, 1), scale 0.15s cubic-bezier(0.4, 0, 0.2, 1), rotate 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), -webkit-backdrop-filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.15s cubic-bezier(0.4, 0, 0.2, 1), display 0.15s cubic-bezier(0.4, 0, 0.2, 1), content-visibility 0.15s cubic-bezier(0.4, 0, 0.2, 1), overlay 0.15s cubic-bezier(0.4, 0, 0.2, 1), pointer-events 0.15s cubic-bezier(0.4, 0, 0.2, 1)`
- **duration-slow:** `0.5s 0.4s forwards wave`
- **duration-slow:** `0.5s 0.45s forwards wave`
- **duration-slow:** `0.5s 0.5s forwards wave`
- **duration-slow:** `0.5s 0.55s forwards wave`
- **duration-slow:** `0.5s 0.6s forwards wave`
- **duration-slow:** `0.5s 0.65s forwards wave`
- **duration-slow:** `0.5s 0.7s forwards wave`
- **duration-slow:** `0.5s 0.75s forwards wave`
- **duration-slow:** `0.5s 0.8s forwards wave`
- **duration-slow:** `0.5s 0.85s forwards wave`
- **duration-slow:** `30s`
- **duration-slow:** `60s`

## Component Inventory

- **Buttons:** 3 detected
- **Links:** 24 detected
- **Navigation:** 3 elements
- **Lists:** 5 detected
- **Images:** 34 detected

## Constraints

### Always

- Use tokens from the tables above — do not introduce new values.
- Include hover, focus-visible, and disabled states for interactive elements.
- Follow the 4px spacing grid.
- Meet WCAG 2.2 AA contrast minimums.

### Never

- Do not introduce colors outside the extracted palette.
- Do not use arbitrary spacing values — stick to the scale.
- Do not use full-uppercase text for body or paragraph content.
- Do not nest interactive elements (e.g. buttons inside links).
- Do not ship components without defining hover, focus-visible, and disabled states.

## Tone

Concise, confident, implementation-focused. Avoid filler preambles.

## Authoring Workflow

When creating or documenting a component for this system:

1. State intent — one sentence on purpose.
2. Map tokens — list every token the component uses.
3. Define anatomy — named parts with token assignments.
4. Specify states — default, hover, focus-visible, active, disabled, loading, error, empty.
5. Describe interactions — keyboard, pointer, touch, edge cases.
6. Add a11y criteria — testable pass/fail checks.
7. List anti-patterns — concrete misuse examples.
8. Close with the Definition of Done checklist.

## Output Structure

Component guidelines must contain, in order:

1. Overview (purpose, when to use, when not to use)
2. Tokens and foundations
3. Anatomy, variants, responsive behavior
4. States and interactions
5. Accessibility (ARIA, contrast, focus, screen reader)
6. Content guidelines (copy rules, tone)
7. Anti-patterns with reasoning

## Component Requirements

- Reference only tokens from the tables above.
- Define all states: default, hover, focus-visible, active, disabled, loading, error.
- Handle edge cases: empty, overflow, truncation, max content.
- Include keyboard navigation behavior.
- Document ARIA roles and labels.

## Definition of Done

- Default state renders (smoke test).
- All states visually verified.
- Zero hardcoded visual values — tokens only.
- Keyboard navigation works without pointer.
- No critical a11y violations.
- Tested at min and max breakpoint.
- At least one anti-pattern documented.
- Purpose, usage, and limitations documented.
