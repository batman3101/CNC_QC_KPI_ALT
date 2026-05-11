---
name: CNC Quality Inspection KPI App
description: Stable factory operations UI for mobile inspection and data-driven quality analysis.
colors:
  operational-blue: "#2563eb"
  operational-blue-dark: "#6366f1"
  analytical-magenta: "#ec4899"
  pass-green: "#16a34a"
  fail-red: "#ef4444"
  warning-yellow: "#facc15"
  process-orange: "#fb923c"
  surface-white: "#ffffff"
  surface-slate: "#f1f5f9"
  ink-slate: "#020817"
  muted-slate: "#64748b"
  border-slate: "#e2e8f0"
  dark-surface: "#090a0b"
  dark-card: "#111827"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "normal"
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  mobile-sheet: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.operational-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    height: "40px"
    typography: "{typography.body}"
  button-mobile:
    backgroundColor: "{colors.operational-blue}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
    typography: "{typography.body}"
  input-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-slate}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
    height: "40px"
    typography: "{typography.body}"
  card-default:
    backgroundColor: "{colors.surface-white}"
    textColor: "{colors.ink-slate}"
    rounded: "{rounded.lg}"
    padding: "24px"
  badge-pass:
    backgroundColor: "{colors.pass-green}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.mobile-sheet}"
    padding: "2px 10px"
    typography: "{typography.label}"
  badge-fail:
    backgroundColor: "{colors.fail-red}"
    textColor: "{colors.surface-white}"
    rounded: "{rounded.mobile-sheet}"
    padding: "2px 10px"
    typography: "{typography.label}"
---

# Design System: CNC Quality Inspection KPI App

## 1. Overview

**Creative North Star: "The Quality Operations Console"**

This design system supports two modes at once: stable factory-floor operation and clear data-based quality analysis. The interface should feel like a durable operations console, not a promotional SaaS surface. It must help inspectors enter measurements quickly on mobile devices, then help managers understand quality patterns without decorative noise.

The system is practical, direct, and role-aware. Mobile inspection screens should prioritize large touch targets and unmistakable pass/fail feedback. Analysis, SPC, reports, and management screens can carry more density, but density must stay organized through hierarchy, spacing, tables, charts, and status language.

The product explicitly rejects the "flashy SaaS landing page" feeling captured in PRODUCT.md. No hero marketing composition, decorative gradients, spectacle motion, or visual styling that competes with inspection work.

**Key Characteristics:**
- Stable operations first, analysis second, decoration never.
- Mobile inspection interactions must be readable, touchable, and fast.
- Status is communicated with color, label, icon, and position, never color alone.
- Data views should be dense but calm, with clear scan paths and compact controls.
- Korean and Vietnamese text expansion must be treated as normal, not an edge case.

## 2. Colors

The palette is restrained operational blue with neutral slate surfaces, supported by semantic quality colors for pass, fail, warning, and process states.

### Primary
- **Operational Blue**: The main action and focus color used for primary buttons, active navigation, focus rings, links, and selected states. It should stay rare enough to indicate action or current location.
- **Operational Blue Dark**: The dark-mode and MUI primary blue used where MUI navigation or dark theme surfaces are active.

### Secondary
- **Analytical Magenta**: Present in the MUI theme as the secondary color. Use sparingly for secondary analytics emphasis only; it must not become a neon dashboard accent.

### Tertiary
- **Pass Green**: Positive inspection, acceptable capability, and healthy process states.
- **Fail Red**: Defects, destructive actions, failed checks, and critical alerts.
- **Warning Yellow**: Caution, pending attention, and borderline SPC states.
- **Process Orange**: Degraded process capability or intermediate concern states.

### Neutral
- **Surface White**: Default content surface and app background in light mode.
- **Surface Slate**: Muted panels, table headers, secondary controls, and subtle grouping.
- **Ink Slate**: Primary text in light mode.
- **Muted Slate**: Secondary text, captions, chart ticks, and helper copy.
- **Border Slate**: Dividers, inputs, table rows, card borders, and containment.
- **Dark Surface**: Dark mode app background.
- **Dark Card**: Dark mode card and popover surface.

### Named Rules

**The Status Must Speak Twice Rule.** Pass, fail, warning, and process states must use text or icon support in addition to color. A color-blind user must still understand the state.

**The Blue Means Action Rule.** Operational Blue is for current location, focus, links, and primary actions. Do not use it as decorative fill across whole screens.

**The No Neon Analytics Rule.** Charts may use green, red, blue, yellow, and orange, but analysis screens must not turn into dark neon dashboards.

## 3. Typography

**Display Font:** Inter (with system-ui, sans-serif fallback)
**Body Font:** Inter (with system-ui, sans-serif fallback)
**Label/Mono Font:** Inter; no separate mono family is established.

**Character:** Inter gives the app a neutral, legible operational tone. The system should use weight and spacing for hierarchy rather than oversized display type.

### Hierarchy
- **Display** (700, 1.875rem, 1.2): Page-level titles and the most important dashboard numbers. Use sparingly on mobile.
- **Headline** (600, 1.5rem, 1.2): Section headers, dialog titles, and analytics panel headings.
- **Title** (600, 1rem, 1.3): Card titles, table group labels, compact headers, and form section labels.
- **Body** (400, 0.875rem, 1.5): Dense operational text, table content, instructions, and metadata. Keep long prose to 65-75ch.
- **Label** (500, 0.75rem, 1.2): Badges, captions, chart labels, secondary metrics, and compact controls.

### Named Rules

**The Readable Translation Rule.** Korean and Vietnamese labels must fit without clipping. Do not size buttons, tabs, or nav items around the shortest language.

**The No Hero Type Rule.** This is a product surface. Avoid landing-page scale typography unless the route is explicitly a public marketing page.

## 4. Elevation

The system uses a hybrid of borders, tonal surfaces, and light shadows. Cards are flat enough to feel stable, with shadows used mainly to separate dense data groups, menus, popovers, mobile sheets, and hover states. Elevation must clarify grouping; it must not add visual drama.

### Shadow Vocabulary
- **Surface Low** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)`): Default shadcn card shadow for grouped content.
- **Surface Medium** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Used by chart cards and dashboard panels that need stronger separation.
- **Overlay Medium** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`): Menus, popovers, tooltips, and mobile drawers.

### Named Rules

**The Stable Surface Rule.** Surfaces should feel anchored. Hover lift is allowed for data cards, but large translation or dramatic elevation is prohibited.

## 5. Components

Components should feel compact, operational, and dependable. Mobile inspection controls need larger touch targets than desktop management controls.

### Buttons
- **Shape:** Gently curved corners (6px radius).
- **Primary:** Operational Blue background with white text, medium-weight Inter, 40px desktop height and 48px mobile target height.
- **Hover / Focus:** Slight blue darkening on hover; 2px focus ring with offset for keyboard visibility.
- **Secondary / Outline / Ghost:** Use neutral slate surfaces or transparent backgrounds. They should support primary actions, not compete with them.
- **Icon Buttons:** Minimum 44px touch area on mobile.

### Chips
- **Style:** Rounded pill badges with 12px label text, tight horizontal padding, and semantic color only when representing status.
- **State:** Pass, fail, warning, and SPC capability chips must include readable text and icon support when space allows.

### Cards / Containers
- **Corner Style:** 8px radius for cards; 16px only for bottom sheets or mobile drawers.
- **Background:** White or neutral slate in light mode; dark card surface in dark mode.
- **Shadow Strategy:** Low at rest, medium for dense analytics cards, stronger only for overlays.
- **Border:** Border Slate is the default containment line.
- **Internal Padding:** 24px desktop card padding, reduced carefully on mobile where screen width is limited.

### Inputs / Fields
- **Style:** 40px default height, 48px mobile target where practical, 6px radius, white background, slate border.
- **Focus:** Operational Blue ring with visible offset.
- **Error / Disabled:** Error must use Fail Red plus helper text. Disabled controls reduce opacity but must remain legible.

### Navigation
- **Desktop Sidebar:** 256px fixed drawer with role-filtered items, compact icons, and blue selected background tint.
- **Mobile Bottom Navigation:** 64px bottom bar with four primary routes and a More drawer for management routes. It must remain the fastest path for inspectors.
- **Active State:** Blue text/icon plus selected background. Do not rely on text weight alone.

### Tables and Analysis Panels
- **Tables:** Use 14px text, 48px header height, 16px cell padding, subtle row borders, and hover tint for scannability.
- **Charts:** Use semantic chart colors consistently. Tooltips should use app background, slate borders, and compact labels.
- **KPI Cards:** Keep metrics close to labels, avoid hero-metric marketing composition, and support trend meaning with icon/text.

## 6. Do's and Don'ts

### Do:
- **Do** design mobile inspection as the primary workflow, with 44-48px touch targets and clear next actions.
- **Do** keep analysis screens dense but calm: tables, charts, filters, and cards should form a clear scan path.
- **Do** use Operational Blue for action, selection, focus, and navigation state.
- **Do** pair every pass/fail/warning color with text, icon, or position.
- **Do** preserve Korean and Vietnamese translation support for all user-facing UI text.
- **Do** use charts to clarify manufacturing quality patterns, not to decorate dashboards.

### Don't:
- **Don't** make this look like a flashy SaaS landing page.
- **Don't** use marketing-style hero sections, decorative gradients, oversized promotional copy, or animated spectacle inside the product UI.
- **Don't** create dense tables or small controls that are difficult to operate on mobile or tablet screens.
- **Don't** fragment every piece of information into excessive card grids.
- **Don't** use decorative motion, visual noise, or styling that slows down scanning.
- **Don't** turn analytics into a dark neon dashboard unless a specific workflow later proves dark mode is necessary.
- **Don't** hardcode UI text in Korean, Vietnamese, or English. Use the i18n translation system.
