# Design System Specification

## 1. Overview & Creative North Star: "The Sovereign Ledger"
This design system moves beyond the generic utility of a finance app to create a high-end editorial experience. We are building "The Sovereign Ledger"—a visual philosophy rooted in **Atmospheric Depth** and **Numerical Authority**. 

The goal is to move away from "boxed-in" mobile layouts. Instead of rigid grids, we utilize intentional white space (Visual Silence) and tonal shifts to guide the eye. By leveraging high-contrast typography scales and overlapping surface layers, we create a UI that feels like a bespoke digital concierge rather than a spreadsheet.

### The Editorial Edge
*   **Intentional Asymmetry:** Avoid perfectly centered layouts for hero sections. Use left-aligned, oversized display type to create a sense of modern tension.
*   **Breathing Room:** Use the upper end of our spacing scale (3rem+) to separate high-level financial data from granular transaction lists.
*   **Numerical Focus:** Numbers are not just data; they are the hero. We treat the Nigerian Naira (₦) as a premium glyph, paired with bold, expansive typography.

---

## 2. Colors: Tonal Architecture
The palette is built on a "charcoal-to-void" spectrum. By avoiding pure black and using a tiered system of deep grays, we allow the Emerald and Rose accents to vibrate with clarity.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to define sections or cards. 
Boundaries must be created through:
1.  **Background Shifts:** Placing a `surface-container-low` card on top of a `surface` background.
2.  **Tonal Transitions:** Using subtle gradients between `primary` and `primary_container` for interactive elements.

### Surface Hierarchy & Glassmorphism
*   **Base:** `surface` (#131313) is the canvas.
*   **Nesting:** Use `surface-container-lowest` for background sections and `surface-container-high` for foreground cards to create natural "lift."
*   **The Glass Rule:** For floating navigation bars or modal headers, use `surface_variant` at 60% opacity with a `20px` backdrop-blur. This ensures the UI feels integrated and multi-dimensional.

---

## 3. Typography: The Authority of Scale
We use **Inter** as our typographic backbone. The system relies on a radical difference between "Display" and "Label" sizes to create a hierarchy that feels expensive and curated.

*   **Display (The Wealth Scale):** Use `display-lg` (3.5rem) for primary account balances. Ensure the Naira symbol (₦) is weighted slightly thinner than the digits to keep the focus on the value.
*   **Headline (The Narrative):** `headline-sm` (1.5rem) for section headers (e.g., "Monthly Performance").
*   **Body (The Detail):** `body-md` (0.875rem) for transaction descriptions. Use `on-surface-variant` for secondary text to reduce visual noise.
*   **Labels (The Meta):** `label-sm` (0.6875rem) in all-caps with 5% letter spacing for timestamps and category tags.

---

## 4. Elevation & Depth: Tonal Layering
In "The Sovereign Ledger," elevation is felt, not seen. We abandon the heavy drop-shadows of the early web in favor of light-logic.

*   **The Layering Principle:** Stack containers to define importance. An "Active Bet" card should use `surface-container-highest`, while "Historical Records" sit on `surface-container-low`.
*   **Ambient Shadows:** If a card must "float" (e.g., a CTA button), use a shadow with a 24px blur, 0px spread, and 6% opacity. The shadow color should be tinted with `primary` or `secondary` rather than pure black to simulate a natural glow.
*   **The "Ghost Border" Fallback:** For accessibility in input fields, use a 1px border using the `outline_variant` token at **15% opacity**. It should be a suggestion of a boundary, not a hard wall.

---

## 5. Components: Precision Elements

### Cards (The Primary Container)
*   **Styling:** Use `rounded-xl` (1.5rem) or `rounded-lg` (1.0rem). 
*   **Constraint:** Never use divider lines within a card. Separate content using `spacing-4` (1rem) vertical gaps or by nesting a `surface-container-highest` inner box for a "sub-card" effect.

### Buttons (The Action)
*   **Primary:** `primary_container` background with `on_primary_container` text. `rounded-full` shape.
*   **Secondary:** Ghost style. No background, `outline_variant` (20% opacity) border, and `secondary` text.
*   **The Signature CTA:** For high-value actions (e.g., "Withdraw"), use a subtle linear gradient from `primary` to `primary_fixed_dim` at a 135-degree angle.

### Inputs & Betting Slips
*   **Fields:** Background-only styling using `surface-container-high`. Labels should be `label-md` floating above the field.
*   **Naira Input:** The symbol ₦ should be fixed as a prefix in `primary` color to emphasize the financial nature of the interaction.

### Chips (Transaction Tags)
*   **Profit:** `surface-container-highest` background with `primary` (Emerald) text.
*   **Loss:** `surface-container-highest` background with `tertiary` (Rose) text.
*   **Note:** Use `rounded-md` (0.75rem) for chips to contrast against the more organic `rounded-xl` cards.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical padding. A 2rem left-padding paired with a 1.5rem right-padding can make a dashboard feel like a high-end magazine layout.
*   **Do** use thin-stroke icons (1.5pt) to maintain a "light" feel against the heavy dark backgrounds.
*   **Do** color-code numbers. If a balance is positive, use `primary`. If it represents a betting stake or loss, use `tertiary`.

### Don’t:
*   **Don’t** use pure white (#FFFFFF) for body text. It causes "halation" (glowing) on dark backgrounds, which tires the eyes. Use `on_surface_variant`.
*   **Don’t** use standard 8px spacing for everything. High-end design requires "Macro-white space"—don't be afraid of 4rem or 5rem gaps between major sections.
*   **Don’t** use high-contrast borders. If the user can see the border before they see the content, the border is too dark.

---

## 7. Iconography: The Linear Thread
Icons must be "Financial Editorial" style:
*   **Stroke Weight:** 1.5px consistent.
*   **Corner Radius:** 2px on icon joints to match the `rounded-sm` token.
*   **Context:** Icons should always be accompanied by a `label-sm` or `body-sm` text element; never let an icon stand alone for primary navigation.