//this is the main state management file. it stores product data, cart data, comparison data, and the state of the guided wizard. 
//it also contains actions to manipulate these states and track user interactions.
import { defineStore } from "pinia";

const storageKey = "guided-system-cart";
const compareStorageKey = "guided-system-compare";
const eventStorageKey = "guided-system-events";
let toastTimeoutId = null;

const assetModules = import.meta.glob("../assets/**/*.jpg", {
  eager: true,
  import: "default",
});

const categoryLabels = {
  Dresses: "Dresses",
  Pants: "Pants",
  Shirts: "Shirts",
  Shoes: "Shoes",
};

const collectionLabels = {
  Dresses: "Dresses",
  MenPants: "Men Pants",
  WomanPants: "Women Pants",
  MenShirts: "Men Shirts",
  WomanShirts: "Women Shirts",
  running: "Running",
  maleDress: "Men Formal",
  womanDress: "Women Formal",
};

const categoryDescriptions = {
  Dresses:
    "Fluid, refined silhouettes with clean lines and an editorial finish.",
  Pants: "Tailored and relaxed separates for balanced everyday styling.",
  Shirts: "Crisp layers and polished essentials for versatile wardrobes.",
  Shoes:
    "From running pairs to formal styles, built for movement and presence.",
};

const badgePool = ["Featured", "New", "Editorial", "Signature", "Limited"];

const collectionColors = {
  Dresses: ["Ivory", "Sand", "Clay"],
  "Men Pants": ["Stone", "Charcoal", "Olive"],
  "Women Pants": ["Pearl", "Taupe", "Espresso"],
  "Men Shirts": ["White", "Sky", "Ink"],
  "Women Shirts": ["Cream", "Rose", "Slate"],
  Running: ["Cloud", "Graphite", "Mint"],
  "Men Formal": ["Black", "Walnut", "Navy"],
  "Women Formal": ["Bone", "Mocha", "Onyx"],
};

function humanize(value) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function loadJSON(key, fallback) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function persistJSON(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function parseProduct(path, image) {
  const segments = path.split("/");
  const assetsIndex = segments.indexOf("assets");
  const categoryKey = segments[assetsIndex + 1];
  const fileName = segments.at(-1) ?? "1.jpg";
  const imageNumber = Number(fileName.replace(/\.[^.]+$/, "")) || 1;
  const maybeCollectionKey = segments[assetsIndex + 2];
  const hasNestedCollection =
    maybeCollectionKey && !/^\d+\.[^.]+$/.test(maybeCollectionKey);
  const collectionKey = hasNestedCollection ? maybeCollectionKey : categoryKey;

  const category = categoryLabels[categoryKey] ?? humanize(categoryKey);
  const collection = collectionLabels[collectionKey] ?? humanize(collectionKey);
  const basePriceByCategory = {
    Dresses: 168,
    Pants: 118,
    Shirts: 92,
    Shoes: 138,
  };
  const collectionBoost = collection.includes("Women")
    ? 10
    : collection.includes("Men")
      ? 14
      : 8;
  const price =
    basePriceByCategory[categoryKey] + imageNumber * 7 + collectionBoost;
  const originalPrice = price + 28;
  const shortName = `${collection} ${String(imageNumber).padStart(2, "0")}`;
  const badge = badgePool[(imageNumber - 1) % badgePool.length];

  return {
    id: `${categoryKey}-${collectionKey}-${imageNumber}`,
    name: shortName,
    category,
    collection,
    badge,
    featured: imageNumber === 1,
    price,
    originalPrice,
    rating: Number((4.6 + (imageNumber % 4) * 0.1).toFixed(1)),
    reviews: 42 + imageNumber * 9,
    stock: 6 + ((imageNumber * 3) % 12),
    colors: collectionColors[collection] ?? ["Ivory", "Stone", "Ink"],
    image,
    summary: `${category} look ${imageNumber} from the ${collection.toLowerCase()} selection.`,
    description: `A clean ${category.toLowerCase()} piece from the ${collection.toLowerCase()} folder. Built for a balanced, editorial storefront presentation.`,
    details: [
      `${category} category`,
      `${collection} collection`,
      `${String(imageNumber).padStart(2, "0")} image in the series`,
    ],
  };
}

const products = Object.entries(assetModules)
  .map(([path, image]) => parseProduct(path, image))
  .sort((left, right) => {
    const categoryOrder = Object.keys(categoryLabels);
    const leftCategoryIndex = categoryOrder.indexOf(left.category);
    const rightCategoryIndex = categoryOrder.indexOf(right.category);

    if (leftCategoryIndex !== rightCategoryIndex) {
      return leftCategoryIndex - rightCategoryIndex;
    }

    if (left.collection !== right.collection) {
      return left.collection.localeCompare(right.collection);
    }

    return left.name.localeCompare(right.name);
  });

export const useProductStore = defineStore("products", {
  state: () => ({
    products,
    filters: {
      search: "",
      category: "All",
      collection: "All",
      sort: "featured",
    },
    cart: loadJSON(storageKey, []),
    comparison: loadJSON(compareStorageKey, []),
    events: loadJSON(eventStorageKey, []),
    lastOrder: null,
    lastCartEvent: null,
    toast: null,
    wizard: {
      active: false,
      step: 1,
      selectedProductId: null,
    },
    wizardSteps: [
      {
        step: 1,
        title: "Choose category",
        description: "Choose a category",
      },
      {
        step: 2,
        title: "Select product",
        description: "Pick one product",
      },
      {
        step: 3,
        title: "Compare products",
        description: "Compare two products",
      },
      {
        step: 4,
        title: "Open product",
        description: "Open the chosen product",
      },
      {
        step: 5,
        title: "Choose options",
        description: "Choose size and color",
      },
      {
        step: 6,
        title: "Add to cart",
        description: "Add it to cart",
      },
      {
        step: 7,
        title: "Checkout",
        description: "Finish checkout",
      },
    ],
  }),
  getters: {
    productById: (state) => (id) =>
      state.products.find((product) => product.id === String(id)),
    categories: (state) => [
      "All",
      ...new Set(state.products.map((product) => product.category)),
    ],
    collections:
      (state) =>
      (category = "All") => {
        const scoped =
          category === "All"
            ? state.products
            : state.products.filter((product) => product.category === category);
        return ["All", ...new Set(scoped.map((product) => product.collection))];
      },
    featuredProducts: (state) =>
      state.products.filter((product) => product.featured).slice(0, 4),
    categoryGroups: (state) =>
      state.categories
        .filter((category) => category !== "All")
        .map((category) => {
          const scoped = state.products.filter(
            (product) => product.category === category,
          );
          return {
            category,
            count: scoped.length,
            description:
              categoryDescriptions[category] ??
              "Curated pieces organized for easy browsing.",
            image: scoped[0]?.image,
          };
        }),
    filteredProducts(state) {
      const search = state.filters.search.trim().toLowerCase();
      const category = state.filters.category;
      const collection = state.filters.collection;

      const matching = state.products.filter((product) => {
        const matchesSearch =
          !search ||
          [
            product.name,
            product.category,
            product.collection,
            product.summary,
            product.badge,
          ]
            .join(" ")
            .toLowerCase()
            .includes(search);
        const matchesCategory =
          category === "All" || product.category === category;
        const matchesCollection =
          collection === "All" || product.collection === collection;

        return matchesSearch && matchesCategory && matchesCollection;
      });

      const sorters = {
        featured: (left, right) =>
          Number(right.featured) - Number(left.featured),
        "price-asc": (left, right) => left.price - right.price,
        "price-desc": (left, right) => right.price - left.price,
        newest: (left, right) => right.name.localeCompare(left.name),
      };

      return matching.sort(sorters[state.filters.sort] ?? sorters.featured);
    },
    cartItems(state) {
      return state.cart
        .map((line) => {
          const product = state.products.find(
            (item) => item.id === line.productId,
          );

          if (!product) {
            return null;
          }

          return {
            ...line,
            product,
            lineTotal: Number((product.price * line.quantity).toFixed(2)),
          };
        })
        .filter(Boolean);
    },
    cartCount(state) {
      return state.cart.reduce((count, line) => count + line.quantity, 0);
    },
    cartLineCount(state) {
      return state.cart.length;
    },
    comparisonProducts(state) {
      return state.comparison
        .map((id) => state.products.find((product) => product.id === id))
        .filter(Boolean);
    },
    subtotal() {
      return Number(
        this.cartItems
          .reduce((sum, line) => sum + line.lineTotal, 0)
          .toFixed(2),
      );
    },
    shipping() {
      return this.cartItems.length === 0 ? 0 : this.subtotal >= 180 ? 0 : 14;
    },
    tax() {
      return Number((this.subtotal * 0.12).toFixed(2));
    },
    total() {
      return Number((this.subtotal + this.shipping + this.tax).toFixed(2));
    },
  },
  actions: {
    setSearch(search) {
      this.filters.search = search;
    },
    setCategory(category) {
      this.filters.category = category;
      if (category === "All") {
        this.filters.collection = "All";
        return;
      }

      const allowedCollections = this.collections(category);
      if (!allowedCollections.includes(this.filters.collection)) {
        this.filters.collection = "All";
      }

      this.completeWizardCategory();
    },
    setCollection(collection) {
      this.filters.collection = collection;
    },
    setSort(sort) {
      this.filters.sort = sort;
    },
    resetFilters() {
      this.filters.search = "";
      this.filters.category = "All";
      this.filters.collection = "All";
      this.filters.sort = "featured";
      this.showToast("Filters reset");
    },
    setToast({ title = "Guided step", message, type = "info" }) {
      if (toastTimeoutId && typeof window !== "undefined") {
        window.clearTimeout(toastTimeoutId);
      }

      this.toast = {
        title,
        message,
        type,
        id: Date.now(),
      };
      const toastId = this.toast.id;

      if (typeof window === "undefined") {
        return;
      }

      toastTimeoutId = window.setTimeout(() => {
        if (this.toast?.id === toastId) {
          this.toast = null;
        }

        toastTimeoutId = null;
      }, 7000);
    },
    showToast(message, type = "info") {
      this.setToast({ message, type });
    },
    dismissToast() {
      if (toastTimeoutId && typeof window !== "undefined") {
        window.clearTimeout(toastTimeoutId);
        toastTimeoutId = null;
      }

      this.toast = null;
    },
    trackEvent(name, payload = {}) {
      const event = {
        name,
        payload,
        createdAt: new Date().toISOString(),
      };

      this.events.push(event);
      persistJSON(eventStorageKey, this.events.slice(-80));
    },
    addToCart(productId, quantity = 1, color = null, size = null) {
      const product = this.products.find((item) => item.id === productId);

      if (!product) {
        return;
      }

      if (this.wizard.active) {
        if (this.wizard.step < 6) {
          this.showToast(
            "Follow guided mode: choose the product options before adding to cart",
            "warning",
          );
          return;
        }

        if (
          this.wizard.selectedProductId &&
          this.wizard.selectedProductId !== productId
        ) {
          this.showToast(
            "Follow guided mode: add the selected product to continue",
            "warning",
          );
          return;
        }
      }

      const chosenColor = color ?? product.colors[0];
      const chosenSize = size ?? null;
      const existingLine = this.cart.find(
        (line) =>
          line.productId === productId &&
          line.color === chosenColor &&
          line.size === chosenSize,
      );

      if (existingLine) {
        existingLine.quantity += quantity;
      } else {
        this.cart.push({ productId, quantity, color: chosenColor, size: chosenSize });
      }

      persistJSON(storageKey, this.cart);
      this.trackEvent("add_to_cart", {
        productId,
        quantity,
        color: chosenColor,
        size: chosenSize,
      });
      this.showToast(`${product.name} added to cart`);
      this.lastCartEvent = {
        productId,
        productName: product.name,
        quantity,
        color: chosenColor,
        size: chosenSize,
        timestamp: Date.now(),
      };

      if (this.wizard.active && this.wizard.step === 6) {
        this.setWizardStep(7);
        this.showToast(`${product.name} added to cart. Checkout is now ready.`, "info");
      }
    },
    updateCartQuantity(productId, color, quantity, size = null) {
      const existingLine = this.cart.find(
        (line) =>
          line.productId === productId &&
          line.color === color &&
          line.size === size,
      );

      if (!existingLine) {
        return;
      }

      if (quantity <= 0) {
        this.removeFromCart(productId, color);
        return;
      }

      existingLine.quantity = quantity;
      persistJSON(storageKey, this.cart);
      this.trackEvent("update_cart_quantity", { productId, color, size, quantity });
    },
    removeFromCart(productId, color, size = null) {
      this.cart = this.cart.filter(
        (line) =>
          !(
            line.productId === productId &&
            line.color === color &&
            line.size === size
          ),
      );
      persistJSON(storageKey, this.cart);
      this.trackEvent("remove_from_cart", { productId, color, size });
      this.showToast("Item removed from cart", "neutral");
    },
    clearCart() {
      this.cart = [];
      persistJSON(storageKey, this.cart);
    },
    toggleComparison(productId) {
      const product = this.products.find((item) => item.id === productId);

      if (!product) {
        return;
      }

      if (this.comparison.includes(productId)) {
        this.comparison = this.comparison.filter((id) => id !== productId);
        this.showToast(`${product.name} removed from comparison`, "neutral");
      } else if (this.comparison.length < 2) {
        this.comparison.push(productId);
        this.showToast(`${product.name} added to comparison`);
      } else {
        this.showToast("Compare is limited to 2 products", "warning");
        return;
      }

      persistJSON(compareStorageKey, this.comparison);
      this.trackEvent("toggle_compare", {
        productId,
        selected: this.comparison.includes(productId),
      });
    },
    clearComparison() {
      this.comparison = [];
      persistJSON(compareStorageKey, this.comparison);
      this.showToast("Comparison cleared", "neutral");
    },
    completeCheckout(payload) {
      const orderTotal = Number((payload?.total ?? this.total).toFixed(2));
      const order = {
        id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
        placedAt: new Date().toISOString(),
        ...payload,
        items: this.cartItems.map((line) => ({
          name: line.product.name,
          quantity: line.quantity,
          color: line.color,
          price: line.product.price,
        })),
        total: orderTotal,
      };

      this.lastOrder = order;
      this.trackEvent("checkout_complete", {
        orderId: order.id,
        total: order.total,
        items: order.items.length,
        shippingMethod: payload?.shippingMethod,
      });
      this.clearCart();
      this.showToast("Simulated order placed");

      if (this.wizard.active) {
        this.resetWizard();
      }

      return order;
    },

    startWizard() {
      this.comparison = [];
      persistJSON(compareStorageKey, this.comparison);
      this.filters.search = "";
      this.filters.category = "All";
      this.filters.collection = "All";
      this.filters.sort = "featured";
      this.wizard.active = true;
      this.wizard.step = 1;
      this.wizard.selectedProductId = null;
      this.wizard.maxStep = 1;
    },

    setWizardStep(step) {
      this.wizard.step = step;
      this.wizard.maxStep = Math.max(this.wizard.maxStep, step);
    },

    validateWizardComparison() {
      if (!this.wizard.selectedProductId) {
        this.showToast("Choose a guided product before comparing", "warning");
        return false;
      }

      if (!this.comparison.includes(this.wizard.selectedProductId)) {
        this.showToast(
          "Keep the selected guided product in the comparison tray",
          "warning",
        );
        return false;
      }

      if (this.comparison.length < 2) {
        this.showToast("Choose one more product to complete comparison", "warning");
        return false;
      }

      return true;
    },

    validateWizardCategory() {
      if (this.filters.category === "All") {
        this.showToast("Choose a category to continue", "warning");
        return false;
      }

      if (!this.filteredProducts.length) {
        this.showToast("Choose a category with available products", "warning");
        return false;
      }

      return true;
    },

    validateWizardOptions(productId, selection = {}) {
      if (this.wizard.selectedProductId !== productId) {
        this.showToast("Complete the guided product before continuing", "warning");
        return false;
      }

      const { color, size, quantity } = selection;
      if (!color || !size || !quantity || quantity < 1) {
        this.showToast("Choose valid color, size, and quantity first", "warning");
        return false;
      }

      return true;
    },

    goToPreviousWizardStep() {
      if (!this.wizard.active || this.wizard.step <= 1) {
        return;
      }

      const previousStep = this.wizard.step - 1;
      this.wizard.step = previousStep;

      if (previousStep < 4) {
        this.comparison = this.wizard.selectedProductId
          ? [this.wizard.selectedProductId]
          : [];
        persistJSON(compareStorageKey, this.comparison);
      }

      if (previousStep < 3) {
        this.wizard.selectedProductId = null;
        this.comparison = [];
        persistJSON(compareStorageKey, this.comparison);
      }

      if (previousStep < 2) {
        this.filters.category = "All";
      }
    },

    selectWizardProduct(productId) {
      if (!this.wizard.active) {
        return;
      }

      if (this.wizard.step !== 2) {
        this.showToast("Complete the current guided step first", "warning");
        return;
      }

      const hasProduct = this.products.some((item) => item.id === productId);
      if (!hasProduct) {
        return;
      }

      this.wizard.selectedProductId = productId;
      this.comparison = [productId];
      persistJSON(compareStorageKey, this.comparison);
      this.setWizardStep(3);
    },

    completeWizardProductOpen(productId) {
      if (!this.wizard.active || this.wizard.step !== 4) {
        return;
      }

      if (this.wizard.selectedProductId !== productId) {
        this.showToast(
          "Follow guided mode: open the selected product",
          "warning",
        );
        return;
      }

      this.setWizardStep(5);
    },

    completeWizardAddToCart(productId) {
      if (!this.wizard.active || this.wizard.step !== 6) {
        return;
      }

      if (this.wizard.selectedProductId !== productId) {
        return;
      }

      this.setWizardStep(7);
    },

    completeWizardOptions(productId, selection = {}) {
      if (!this.wizard.active || this.wizard.step !== 5) {
        return;
      }

      if (!this.validateWizardOptions(productId, selection)) {
        return;
      }

      this.setWizardStep(6);
    },

    completeWizardComparison() {
      if (!this.wizard.active || this.wizard.step !== 3) {
        return;
      }

      if (!this.validateWizardComparison()) {
        return;
      }

      this.showToast("Choose one of the compared products to view its details");
    },

    chooseWizardComparisonProduct(productId) {
      if (!this.wizard.active || this.wizard.step !== 3) {
        return false;
      }

      if (!this.validateWizardComparison()) {
        return false;
      }

      if (!this.comparison.includes(productId)) {
        this.showToast("Choose a product from the comparison tray", "warning");
        return false;
      }

      this.wizard.selectedProductId = productId;
      this.setWizardStep(4);

      return true;
    },

    completeWizardCategory() {
      if (!this.wizard.active || this.wizard.step !== 1) {
        return;
      }

      if (!this.validateWizardCategory()) {
        return;
      }

      this.setWizardStep(2);
    },

    guardProductAccess(productId) {
      if (!this.wizard.active) {
        return true;
      }

      if (this.wizard.step < 4) {
        this.showToast(
          "Follow guided mode: choose category, select a product, and complete comparison first",
          "warning",
        );
        return false;
      }

      if (
        this.wizard.step === 4 &&
        this.wizard.selectedProductId &&
        this.wizard.selectedProductId !== productId
      ) {
        this.showToast(
          "Follow guided mode: open the selected product",
          "warning",
        );
        return false;
      }

      return true;
    },

    guardCartAccess() {
      if (!this.wizard.active) {
        return true;
      }

      if (this.wizard.step < 7) {
        this.showToast(
          "Follow guided mode: add the selected product to cart before checkout",
          "warning",
        );
        return false;
      }

      return true;
    },

    resetWizard() {
      this.wizard.active = false;
      this.wizard.step = 1;
      this.wizard.selectedProductId = null;
      this.wizard.maxStep = 1;
      this.comparison = [];
      persistJSON(compareStorageKey, this.comparison);
    },

    exitWizard() {
      if (this.wizard.active) {
        this.showToast("Complete the guided checkout to unlock free browsing", "warning");
        return;
      }

      this.resetWizard();

      this.setToast({
        title: "Guided mode completed",
        message: "You can now explore the app freely.",
      });
    },
  },
});
