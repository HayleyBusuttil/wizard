<template>
  <section class="page page-shop refined-layout">
    <div v-if="store.toast" class="toast" :class="`toast-${store.toast.type}`">
      <span>{{ store.toast.message }}</span>
      <button type="button" @click="store.dismissToast()">×</button>
    </div>

    <header class="shop-hero">
      <div>
        <p class="eyebrow">Shop</p>
        <h1>Discover your next outfit.</h1>
        <p class="lead">
          Browse, filter, compare, and explore products designed for everyday wear.
        </p>
      </div>

      <div class="hero-stats">
        <span>{{ store.products.length }} items</span>
        <span>{{ store.categories.length - 1 }} categories</span>
        <span>{{ store.cartCount }} in cart</span>
      </div>
    </header>

    <section v-if="store.wizard.active" class="wizard-inline-banner">
      <p class="eyebrow">Guided step</p>
      <h3>{{ wizardInstruction }}</h3>
      <p>{{ wizardSupport }}</p>
    </section>

    <section class="filters-bar" :class="{ 'wizard-focus': isStep(1) }" aria-label="Product filters">
      <input v-model="search" type="search" placeholder="Search products..." class="search-input" />

      <select
        v-model="category"
        :class="{ 'wizard-focus': isStep(1) }"
        aria-label="Category"
        data-wizard-target="category-select"
      >
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
      <button v-if="store.wizard.active" class="button-soft" @click="store.exitWizard()">
        Exit Guided Mode
      </button>
    </section>

    <section v-if="store.comparisonProducts.length" class="compare-tray">
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

    <section class="products-section" :class="{ 'wizard-focus': isStep(2) || isStep(3) }">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured results</p>
          <h2>{{ store.filteredProducts.length }} results</h2>
        </div>
        <p v-if="!store.wizard.active">Select up to two products to compare them before opening the product page.</p>
        <p v-else>{{ wizardSupport }}</p>
      </div>

      <p v-if="store.wizard.active" class="wizard-inline-note">{{ wizardInstruction }}</p>

      <div v-if="store.filteredProducts.length" class="product-grid" data-wizard-target="product-grid">
        <ProductCard
          v-for="product in paginatedProducts"
          :key="product.id"
          v-memo="[product.id, store.comparison.includes(product.id), store.comparison.length >= 2, store.wizard.step, store.wizard.selectedProductId]"
          :product="product"
          :is-compared="store.comparison.includes(product.id)"
          :compare-disabled="store.comparison.length >= 2"
          :show-compare-action="true"
          :show-select-action="isStep(2)"
          :is-wizard-selected="store.wizard.selectedProductId === product.id"
          :open-locked="isProductOpenLocked(product.id)"
          @quick-add="store.addToCart(product.id)"
          @compare="store.toggleComparison(product.id)"
          @select="store.selectWizardProduct(product.id)"
          @blocked-open="handleBlockedOpen"
          @open="handleProductOpen(product.id)"
        />
      </div>

      <div v-if="store.filteredProducts.length && totalPages > 1" class="pagination-bar" aria-label="Pagination">
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

      <div v-else class="empty-state">
        <h3>No products found</h3>
        <p>Try adjusting your filters.</p>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue"
import { useProductStore } from "../stores/productStore"
import ProductCard from "../components/ProductCard.vue"

const store = useProductStore()
const productsPerPage = 12
const currentPage = ref(1)

const search = ref(store.filters.search)
const category = ref(store.filters.category)
const collection = ref(store.filters.collection)
const sort = ref(store.filters.sort)
const availableCollections = computed(() => store.collections(category.value))

const wizardInstruction = computed(() => {
  const instructions = {
    1: "Choose a category to begin browsing.",
    2: "Select one product card to continue.",
    3: "Open the highlighted product card.",
    4: "Add the selected product to your cart.",
    5: "Open checkout to finish the task.",
  }

  return instructions[store.wizard.step] ?? "Follow the guided shopping flow."
})

const wizardSupport = computed(() => {
  const support = {
    1: "The category filter is the required first action.",
    2: "The selected card will glow and stay pinned for the next step.",
    3: "Only the selected product can move you forward.",
    4: "The add-to-cart button becomes the next highlighted target.",
    5: "Review the checkout section to complete the simulated order.",
  }

  return support[store.wizard.step] ?? "Use the visible guidance to continue."
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

const totalPages = computed(() => Math.max(1, Math.ceil(store.filteredProducts.length / productsPerPage)))

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * productsPerPage
  return store.filteredProducts.slice(start, start + productsPerPage)
})

const pageStart = computed(() => {
  if (!store.filteredProducts.length) {
    return 0
  }

  return (currentPage.value - 1) * productsPerPage + 1
})

const pageEnd = computed(() => {
  return Math.min(currentPage.value * productsPerPage, store.filteredProducts.length)
})

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

const isStep = (step) => {
  return store.wizard.active && store.wizard.step === step
}

onMounted(() => {
  if (!store.wizard.active) {
    store.startWizard()
  }
})

const isProductOpenLocked = (productId) => {
  if (!store.wizard.active) {
    return false
  }

  if (store.wizard.step <= 2) {
    return true
  }

  return store.wizard.step === 3 && store.wizard.selectedProductId !== productId
}

const handleBlockedOpen = () => {
  if (!store.wizard.active) {
    return
  }

  if (store.wizard.step <= 2) {
    store.showToast("Follow guided mode: select a product first", "warning")
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
  () => store.filteredProducts.length,
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
)
</script>
