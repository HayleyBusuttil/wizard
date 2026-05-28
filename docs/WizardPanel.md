# WizardPanel.vue — Documentation

Overview

- Location: `src/components/WizardPanel.vue`
- Purpose: UI panel that controls and displays the guided "wizard" flow for the shopping experience. It reads state from the `productStore` (Pinia) and provides navigation, progress, and a spotlight overlay that highlights UI targets on the page.

Main responsibilities

- Display current wizard title, copy and step counter.
- Render a progress bar and a list of steps with visual states (current, complete, upcoming).
- Start, step-back, and manage navigation to routes associated with each step.
- Compute and render a spotlight overlay that visually highlights a DOM target for the active step.

Template structure

- Top-level: `<section class="wizard-panel-shell">` — toggles `is-active` when the wizard is running.
- Header: shows `panelTitle`, `panelCopy` and a `stepCounter` badge.
- Progress block: rendered only when `store.wizard.active` (current objective + progress bar).
- Actions: `Start guided mode` button (when inactive) or `Back a step` button (when active).
- Ordered list: renders `store.wizardSteps` with each step item using `wizardStepState()` to set classes.
- Spotlight overlay: four fixed pieces (`top`, `left`, `right`, `bottom`) whose sizes/positions are controlled by `spotlightStyle`.

Integration with store and router

- Uses `useProductStore()` to read and manipulate the wizard state (start, go back, etc.).
- Uses `useRoute()` and `useRouter()` to redirect the user to a page where the next guided action should occur (e.g., `/shop`, `/product/:id`, `/cart`).

Reactive/computed values

- `currentStep` — object for the current step entry in `store.wizardSteps`.
- `progressPercent` — percentage of completion for the progress bar.
- `currentObjective` — short description for the active step.
- `panelTitle` — title shown in the header (changes when inactive).
- `stepCounter` — textual step counter, e.g. `Step 3 of 7`.
- `panelCopy` — helper copy that depends on whether the wizard is active and the current route.
- `spotlightStyle` — computed geometry for the overlay pieces, derived from the bounding rect of the target element.

Important functions / methods

- `startWizard()`
  - If not on `/shop`, navigates to `/shop` first.
  - Calls `store.startWizard()` and shows a welcome toast.

- `goBack()`
  - Calls `store.goToPreviousWizardStep()` and navigates to the route defined in `stepMap` for the new current step.

- `updateSpotlight()`
  - Find the DOM element for the current step using `stepMap[step].selector` and compute a padded bounding rectangle.
  - Stores the rectangle in the `spotlight` ref; when missing, clears the spotlight.

- `setStepRef(element, step)`
  - Tracks references to the rendered list items so the active step can be scrolled into view.

- `scrollActiveStepIntoView()`
  - Scrolls the steps list so that the active step is visible and visually centered.

- `wizardStepState(step)`
  - Returns one of `is-current`, `is-complete`, or `is-upcoming` based on `store.wizard.active` and the numeric step.

Lifecycle and watchers

- Watches `[store.wizard.active, store.wizard.step, store.wizard.selectedProductId, route.path]` to update the spotlight and scroll the active step into view when any relevant piece of state changes.
- Adds `resize` and `scroll` listeners on mount to keep the spotlight geometry up to date; removes them on unmount.

Step map

- `stepMap` is a local mapping of numeric steps to selectors, titles, and routes. Example:
  - Step 1 selector: `[data-wizard-target="category-select"]` → route `/shop`
  - Step 4 selector: `[data-wizard-target="wizard-selected-product"]` → route `/product/:id`
  - Step 7 route: `/cart`

Styling / UX

- The component includes a sticky card, visual step states, and a semi-opaque overlay with a transparent "spotlight" cutout that focuses on the current UI target.
- On small screens, the card reduces padding and height (`@media (max-width: 720px)`).

Usage / Integration notes

- Ensure the app places `data-wizard-target` attributes on key elements referenced by `stepMap` (category select, product grid, compare tray, product options, add-to-cart button, checkout panel). The selectors are queried via `document.querySelector()`.
- The spotlight geometry assumes those elements are present in the DOM; if a target is not rendered (e.g., due to route mismatch or lazy loading), the overlay will be hidden.
- The component navigates programmatically to the appropriate route when starting or stepping back; avoid interfering with those route changes if you want the wizard to remain in sync.

Example usage

Import and include the component in a layout or sidebar:

```vue
<template>
  <aside>
    <WizardPanel />
  </aside>
</template>

<script setup>
import WizardPanel from "../components/WizardPanel.vue"
</script>
```
