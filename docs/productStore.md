# productStore.js — Documentation

Overview

- Location: `src/stores/productStore.js`
- Purpose: Pinia store that generates a product catalog from static assets, persists cart/compare/events to localStorage, and manages a guided "wizard" checkout flow.

Key concepts

- Products: Generated at runtime from files found under `src/assets` using `import.meta.glob` and parsed by `parseProduct(path, image)`.
- Persistence: Cart, comparison tray and recent events are stored under keys `guided-system-cart`, `guided-system-compare`, and `guided-system-events` in `localStorage`.
- Wizard: A guided multi-step flow (steps 1..7) that constrains navigation and actions to create a focused checkout experience.

State (high level)

- `products` — Array of product objects (id, name, category, collection, price, image, etc.).
- `filters` — { search, category, collection, sort }
- `cart` — persisted array of cart lines: { productId, quantity, color, size }
- `comparison` — array of product ids selected for side-by-side comparison (max 2)
- `events` — recent user events tracked by `trackEvent`
- `lastOrder`, `lastCartEvent` — metadata about last simulated order / cart action
- `toast` — transient toast message object
- `wizard` — { active, step, selectedProductId, maxStep }

Important getters

- `productById(id)` — find a product by id
- `categories` — list of categories (includes "All")
- `collections(category)` — list of collections, scoped by category
- `featuredProducts` — first 4 featured products
- `categoryGroups` — metadata for each category (count, description, image)
- `filteredProducts` — products matching the current `filters` (search/category/collection) and sorted
- `cartItems` — cart lines augmented with resolved `product` and `lineTotal`
- `cartCount` — total quantity of items in cart
- `cartLineCount` — number of distinct cart lines
- `comparisonProducts` — resolved product objects for ids in `comparison`
- `subtotal`, `shipping`, `tax`, `total` — shopping totals derived from `cartItems`

Key actions (high level)

- Filter & UI
  - `setSearch(search)`, `setCategory(category)`, `setCollection(collection)`, `setSort(sort)`, `resetFilters()`
- Toast & events
  - `setToast({title, message, type})`, `showToast(message, type)`, `dismissToast()`
  - `trackEvent(name, payload)` — appends to `events` and persists a rolling history
- Cart
  - `addToCart(productId, quantity=1, color=null, size=null)` — enforces wizard constraints and persists
  - `updateCartQuantity(productId, color, quantity, size=null)`
  - `removeFromCart(productId, color, size=null)`, `clearCart()`
- Comparison
  - `toggleComparison(productId)` — adds/removes id, limited to 2 items
  - `clearComparison()`
- Checkout
  - `completeCheckout(payload)` — simulates order creation, clears cart, logs event and returns order object
- Guided wizard
  - `startWizard()`, `setWizardStep(step)`, `goToPreviousWizardStep()`, `selectWizardProduct(productId)`
  - `completeWizardCategory()`, `completeWizardProductOpen(productId)`, `completeWizardComparison()`, `completeWizardOptions(productId, selection)`
  - `completeWizardAddToCart(productId)`, `completeWizardAddToCart(productId)`, `completeWizardAddToCart(productId)`
  - `validateWizardCategory()`, `validateWizardComparison()`, `validateWizardOptions(productId, selection)`
  - `guardProductAccess(productId)`, `guardCartAccess()`, `resetWizard()`, `exitWizard()`

Notes and recommendations

- parseProduct derives pricing and display data from file paths — change its logic if you introduce a new assets layout.
- Persistence is guarded for server-side rendering (checks `typeof window`). If you need SSR-compatible persistence, replace localStorage with an injected storage adapter.
- `toggleComparison` limits comparison to 2 items; UI should reflect that constraint.
- Many methods use `showToast` for user feedback; you can centralize toast formatting by changing `setToast`.

Usage example

```js
import { useProductStore } from "../stores/productStore";
const store = useProductStore();

// list filtered products
console.log(store.filteredProducts);

// add first featured product to cart
const prod = store.featuredProducts[0];
store.addToCart(prod.id, 1);
```