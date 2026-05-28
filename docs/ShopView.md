# ShopView.vue — Documentation

Overview

- Location: `src/views/ShopView.vue`
- Purpose: Page view that renders the shop interface: filters, product grid, comparison tray, pagination and guided-wizard integrations. It consumes `useProductStore()` to read products, filters, comparison and wizard state, and to call actions.

High level behavior

- Operates in two modes:
  - Standard browsing (when `store.wizard.active` is false): full filters, paginated results (12 per page), free product access.
  - Guided mode (when `store.wizard.active` is true): constrained UI, smaller page size (4 per page), step-driven interactions and spotlighting via `WizardPanel`.
- Auto-starts guided mode on mount if not active (calls `store.startWizard()` and shows a toast).

Template structure

- Top-level: `<section class="page page-shop refined-layout">` toggles class `wizard-shop-mode` when guided mode is active.
- Hero/header: shows `heroTitle`, `heroLead` and is visually muted when wizard is active.
- Wizard inline banner: when active, shows `wizardInstruction`, `wizardSupport` and the current step pill.
- Filters bar: renders two different UIs depending on guided mode:
  - Standard: search input, category/select, collection, sort, reset button.
  - Guided: limited category control with `data-wizard-target="category-select"`, exit button and a brief descriptive copy.
- Products section: heading (counts/lead), optional comparison callout, product grid (target `data-wizard-target="product-grid"`), pagination.
- Compare tray: shown when `store.comparisonProducts.length` > 0 and either not in wizard or in comparison step 3; it has `data-wizard-target="compare-products"`.

Integration points and selectors

- `data-wizard-target="category-select"` — used by the `WizardPanel` spotlight to focus the category selector.
- `data-wizard-target="product-grid"` — used to highlight the product grid in steps that require product selection.
- `data-wizard-target="compare-products"` — used to jump to or spotlight the compare tray.
- Each `ProductCard` receives props to reflect comparison, selection and guided-mode constraints. `ProductCard` emits events handled here:
  - `@quick-add` → `store.addToCart(product.id)`
  - `@compare` → `store.toggleComparison(product.id)`
  - `@select` → `store.selectWizardProduct(product.id)`
  - `@blocked-open` → `handleBlockedOpen()` (shows warning toast)
  - `@open` → `handleProductOpen(product.id)` (warns when opening non-selected product in guided mode)

Reactive state and computed values

- `search`, `category`, `collection`, `sort` — local refs that mirror `store.filters.*` and update store via watchers (debounced for `search`).
- `availableCollections` — derived from `store.collections(category)`.
- `currentPageSize` — `12` standard, `4` guided.
- Pagination helpers: `totalPages`, `visibleProducts`, `pageStart`, `pageEnd`, `showPagination`, `goToPage`, `previousPage`, `nextPage`.
- `wizardInstruction` and `wizardSupport` — user-facing strings per wizard step.
- `sectionTitle`, `sectionSupport`, `comparisonInstruction`, `comparisonCallout` — UI copy derived from store state and selections.

Wizard-specific helpers

- `isStep(step)` — returns true when wizard is active and at a specific step.
- `isProductOpenLocked(productId)` — enforces opening restrictions depending on wizard step.
- `shouldMuteProduct(productId)` — indicates products that should be visually de-emphasized when another is selected.
- `handleBlockedOpen()` — shows a context-specific warning when user attempts an action blocked by the wizard.
- `handleProductOpen(productId)` — shows a warning if the user tries to open a non-selected product while the wizard requires a specific product.
- `openComparedProduct(productId)` — attempts to choose a compared product via `store.chooseWizardComparisonProduct`, then navigates to that product page if successful.
- `scrollToCompareTray()` — scrolls the compare tray into view smoothly.

Lifecycle and watchers

- onMounted: if wizard not active, starts the wizard and sets a welcome toast.
- Watches local filter refs and writes to `store.filters` (debounced `search` with 300ms timeout).
- Watches `store.filteredProducts.length` and `currentPageSize` to keep `currentPage` within bounds.
- Watches `store.comparison.length` to auto-scroll to the compare tray or show informational toasts when items are added.

Accessibility and UX notes

- Filter section has `aria-label="Product filters"`.
- Pagination uses `aria-label` and `aria-current` on active page buttons.
- Progress callouts use `aria-live="polite"` to announce changes.
- The component relies on `ProductCard` to render accessible product controls; ensure the `ProductCard` emits the events used above and provides clear button labels.

Developer notes and recommendations

- If you change the `stepMap` selectors in `WizardPanel.vue`, update the `data-wizard-target` attributes here to match.
- The shop auto-starts guided mode on mount; if you prefer not to auto-start during development, remove or gate the `store.startWizard()` call.
- For SSR environments, ensure `window`-dependent behavior in the store and components is guarded (the store already checks `typeof window` before using `localStorage`).

Example usage snippet

```js
import { useProductStore } from "../stores/productStore"
const store = useProductStore()

// Browse filtered products
console.log(store.filteredProducts)

// Start guided mode explicitly
store.startWizard()
```