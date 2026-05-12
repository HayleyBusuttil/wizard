<template>
  <section class="page page-shop refined-layout" :class="{ 'wizard-shop-mode': store.wizard.active }">
    <header class="shop-hero" :class="{ 'is-muted': store.wizard.active }">
      <div>
        <p class="eyebrow">Shop</p>
        <h1>{{ heroTitle }}</h1>
        <p class="lead">
          {{ heroLead }}
        </p>
      </div>

      <div class="hero-stats" :class="{ 'is-deemphasized': store.wizard.active }">
        <span>{{ visibleResultsCount }} visible</span>
        <span>{{ store.products.length }} items total</span>
        <span>{{ store.cartCount }} in cart</span>
      </div>
    </header>

    <section v-if="store.wizard.active" class="wizard-inline-banner wizard-task-banner">
      <div>
        <p class="eyebrow">Current objective</p>
        <h3>{{ wizardInstruction }}</h3>
        <p>{{ wizardSupport }}</p>
      </div>
      <span class="wizard-stage-pill">Step {{ store.wizard.step }} / {{ store.wizardSteps.length }}</span>
    </section>

    <section
      class="filters-bar"
      :class="{ 'wizard-focus': isStep(1), 'guided-filters': store.wizard.active }"
      aria-label="Product filters"
    >
      <template v-if="!store.wizard.active">
        <input v-model="search" type="search" placeholder="Search products..." class="search-input" />

        <select v-model="category" aria-label="Category">
          <option v-for="item in store.categories" :key="item" :value="item">
            {{ item }}
          </option>
        </select>

        <select v-model="collection" aria-label="Collection">
          <option v-for="item in availableCollections" :key="item" :value="item">
            {{ item }}
          </option>
        </select>

        <select v-model="sort" aria-label="Sort products">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
        </select>

        <button type="button" @click="store.resetFilters()" class="reset-btn">
          Reset
        </button>
      </template>

      <template v-else>
        <div class="guided-filter-copy">
          <p class="eyebrow">Guided control</p>
          <strong>{{ isStep(1) ? "Choose a category to unlock products." : "Category locked for this step." }}</strong>
          <p>{{ isStep(1) ? "Only the category selector is active right now." : `Browsing stays scoped to ${store.filters.category}.` }}</p>
        </div>

        <select
          v-model="category"
          :class="{ 'wizard-focus': isStep(1) }"
          :disabled="!isStep(1)"
          aria-label="Category"
          data-wizard-target="category-select"
        >
          <option v-for="item in store.categories" :key="item" :value="item">
            {{ item }}
          </option>
        </select>

        <button class="button-soft" type="button" @click="store.exitWizard()">
          Exit guided mode
        </button>
      </template>
    </section>

    <section
      class="products-section"
      :class="{ 'wizard-focus': isStep(2) || isStep(3), 'guided-results': store.wizard.active }"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ store.wizard.active ? "Guided results" : "Featured results" }}</p>
          <h2>{{ sectionTitle }}</h2>
        </div>
        <p>{{ sectionSupport }}</p>
      </div>

      <p v-if="store.wizard.active" class="wizard-inline-note">{{ wizardInstruction }}</p>

      <div v-if="store.filteredProducts.length" class="product-grid" data-wizard-target="product-grid">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.id"
          v-memo="[product.id, store.comparison.includes(product.id), store.comparison.length >= 2, store.wizard.step, store.wizard.selectedProductId]"
          :product="product"
          :is-compared="store.comparison.includes(product.id)"
          :compare-disabled="store.comparison.length >= 2"
          :show-compare-action="!store.wizard.active"
          :show-select-action="isStep(2)"
          :is-wizard-selected="store.wizard.selectedProductId === product.id"
          :open-locked="isProductOpenLocked(product.id)"
          :is-guided-muted="store.wizard.active && shouldMuteProduct(product.id)"
          @quick-add="store.addToCart(product.id)"
          @compare="store.toggleComparison(product.id)"
          @select="store.selectWizardProduct(product.id)"
          @blocked-open="handleBlockedOpen"
          @open="handleProductOpen(product.id)"
        />
      </div>

      <div v-if="showPagination" class="pagination-bar" aria-label="Pagination">
        <p class="pagination-summary">Showing {{ pageStart }}-{{ pageEnd }} of {{ store.filteredProducts.length }}</p>

        <nav class="pagination-controls" aria-label="Shop page navigation">
          <button type="button" class="pagination-btn" :disabled="currentPage === 1" @click="previousPage">
            Previous
          </button>

          <button
            v-for="page in totalPages"
            :key="`page-${page}`"
            type="button"
            class="pagination-btn"
            :class="{ active: currentPage === page }"
            :aria-current="currentPage === page ? 'page' : undefined"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>

          <button type="button" class="pagination-btn" :disabled="currentPage === totalPages" @click="nextPage">
            Next
          </button>
        </nav>
      </div>

      <div v-else-if="store.wizard.active && store.filteredProducts.length > visibleProducts.length" class="guided-results-note">
        Guided mode is showing a smaller focused set so users can make one decision at a time.
      </div>

      <div v-else class="empty-state">
        <h3>No products found</h3>
        <p>Try adjusting your filters.</p>
      </div>
    </section>

    <section v-if="!store.wizard.active && store.comparisonProducts.length" class="compare-tray">
      <div>
        <p class="eyebrow">Compare</p>
        <h2>{{ store.comparisonProducts.length }}/2 products selected</h2>
      </div>

      <div class="compare-items">
        <article v-for="item in store.comparisonProducts" :key="item.id" class="compare-mini-card">
          <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.category }} · €{{ item.price }}</span>
          </div>
          <button type="button" class="text-button" @click="store.toggleComparison(item.id)">
            Remove
          </button>
        </article>
      </div>

      <div v-if="store.comparisonProducts.length === 2" class="comparison-table">
        <div class="comparison-row header">
          <span>Feature</span>
          <strong v-for="item in store.comparisonProducts" :key="item.id">{{ item.name }}</strong>
        </div>
        <div class="comparison-row">
          <span>Price</span>
          <strong v-for="item in store.comparisonProducts" :key="item.id">€{{ item.price }}</strong>
        </div>
        <div class="comparison-row">
          <span>Rating</span>
          <strong v-for="item in store.comparisonProducts" :key="item.id">{{ item.rating.toFixed(1) }}/5</strong>
        </div>
        <div class="comparison-row">
          <span>Stock</span>
          <strong v-for="item in store.comparisonProducts" :key="item.id">{{ item.stock }} left</strong>
        </div>
      </div>

      <button type="button" class="button-soft button-sm" @click="store.clearComparison()">
        Clear comparison
      </button>
    </section>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue"
import { useProductStore } from "../stores/productStore"
import ProductCard from "../components/ProductCard.vue"

const store = useProductStore()
const standardProductsPerPage = 12
const guidedProductsPerPage = 4
const currentPage = ref(1)

const search = ref(store.filters.search)
const category = ref(store.filters.category)
const collection = ref(store.filters.collection)
const sort = ref(store.filters.sort)
const availableCollections = computed(() => store.collections(category.value))

const currentPageSize = computed(() => (store.wizard.active ? guidedProductsPerPage : standardProductsPerPage))

const wizardInstruction = computed(() => {
  const instructions = {
    1: "Choose a category to begin browsing.",
    2: "Select one product to continue.",
    3: "Open the selected product card.",
    4: "Choose the required product options.",
    5: "Add the configured product to cart.",
    6: "Complete the checkout form.",
  }

  return instructions[store.wizard.step] ?? "Follow the guided shopping flow."
})

const wizardSupport = computed(() => {
  const support = {
    1: "The system is waiting for a category choice before anything else becomes available.",
    2: "Only a small set of products is shown to keep the decision focused.",
    3: "Only the selected product can be opened during this step.",
    4: "Choose color, size, and quantity before you can continue.",
    5: "Secondary actions are hidden so the add-to-cart task stays central.",
    6: "Checkout is now the only remaining task in the guided journey.",
  }

  return support[store.wizard.step] ?? "Use the visible guidance to continue."
})

const heroTitle = computed(() =>
  store.wizard.active ? "Complete the guided shopping task." : "Discover your next outfit.",
)

const heroLead = computed(() =>
  store.wizard.active
    ? "This view is intentionally narrowed so participants move through a structured, system-controlled purchase flow."
    : "Browse, filter, compare, and explore products designed for everyday wear.",
)

const sectionTitle = computed(() => {
  if (!store.wizard.active) {
    return `${store.filteredProducts.length} results`
  }

  if (store.wizard.step === 1) {
    return "Awaiting category selection"
  }

  return `${visibleResultsCount.value} focused options`
})

const sectionSupport = computed(() => {
  if (!store.wizard.active) {
    return "Select up to two products to compare them before opening the product page."
  }

  return wizardSupport.value
})

let timeout = null

watch(search, (value) => {
  clearTimeout(timeout)
  timeout = setTimeout(() => {
    store.setSearch(value)
    currentPage.value = 1
  }, 300)
})

watch(category, (value) => {
  store.setCategory(value)
  currentPage.value = 1
})

watch(collection, (value) => {
  store.setCollection(value)
  currentPage.value = 1
})

watch(sort, (value) => {
  store.setSort(value)
  currentPage.value = 1
})

watch(
  () => store.filters.search,
  (value) => {
    if (search.value !== value) {
      search.value = value
    }
  },
)

watch(
  () => store.filters.category,
  (value) => {
    if (category.value !== value) {
      category.value = value
    }
  },
)

watch(
  () => store.filters.collection,
  (value) => {
    if (collection.value !== value) {
      collection.value = value
    }
  },
)

watch(
  () => store.filters.sort,
  (value) => {
    if (sort.value !== value) {
      sort.value = value
    }
  },
)

const totalPages = computed(() => Math.max(1, Math.ceil(store.filteredProducts.length / currentPageSize.value)))

const visibleProducts = computed(() => {
  const start = (currentPage.value - 1) * currentPageSize.value
  return store.filteredProducts.slice(start, start + currentPageSize.value)
})

const visibleResultsCount = computed(() => visibleProducts.value.length)

const pageStart = computed(() => {
  if (!store.filteredProducts.length) {
    return 0
  }

  return (currentPage.value - 1) * currentPageSize.value + 1
})

const pageEnd = computed(() => Math.min(currentPage.value * currentPageSize.value, store.filteredProducts.length))

const showPagination = computed(() => !store.wizard.active && store.filteredProducts.length && totalPages.value > 1)

const goToPage = (page) => {
  currentPage.value = page
}

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value -= 1
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value += 1
  }
}

const isStep = (step) => store.wizard.active && store.wizard.step === step

const isProductOpenLocked = (productId) => {
  if (!store.wizard.active) {
    return false
  }

  if (store.wizard.step <= 2) {
    return true
  }

  return store.wizard.step === 3 && store.wizard.selectedProductId !== productId
}

const shouldMuteProduct = (productId) =>
  store.wizard.step === 3 && store.wizard.selectedProductId && store.wizard.selectedProductId !== productId

const handleBlockedOpen = () => {
  if (!store.wizard.active) {
    return
  }

  if (store.wizard.step <= 2) {
    store.showToast("Follow guided mode: choose a category and select a product first", "warning")
    return
  }

  store.showToast("Follow guided mode: open the selected product", "warning")
}

const handleProductOpen = (productId) => {
  if (store.wizard.active && store.wizard.step === 3 && store.wizard.selectedProductId !== productId) {
    store.showToast("Follow guided mode: open the selected product", "warning")
  }
}

watch(
  () => [store.filteredProducts.length, currentPageSize.value],
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
)
</script>
