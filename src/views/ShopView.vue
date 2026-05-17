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
      :class="{ 'wizard-focus': isStep(2) || isStep(3) || isStep(4), 'guided-results': store.wizard.active }"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ store.wizard.active ? "Guided results" : "Featured results" }}</p>
          <h2>{{ sectionTitle }}</h2>
        </div>
        <p>{{ sectionSupport }}</p>
      </div>

      <p v-if="store.wizard.active" class="wizard-inline-note">{{ wizardInstruction }}</p>
      <div
        v-if="comparisonCallout"
        class="progress-callout"
        :class="{ 'is-emphasized': store.comparison.length > 0 }"
        aria-live="polite"
      >
        <strong>{{ comparisonCallout.title }}</strong>
        <p>{{ comparisonCallout.body }}</p>
        <button
          v-if="store.comparison.length > 0"
          type="button"
          class="text-button progress-callout-action"
          @click="scrollToCompareTray"
        >
          Jump to comparison
        </button>
      </div>

      <div v-if="store.filteredProducts.length" class="product-grid" data-wizard-target="product-grid">
        <ProductCard
          v-for="product in visibleProducts"
          :key="product.id"
          v-memo="[product.id, store.comparison.includes(product.id), store.comparison.length >= 2, store.wizard.step, store.wizard.selectedProductId]"
          :product="product"
          :is-compared="store.comparison.includes(product.id)"
          :compare-disabled="store.comparison.length >= 2"
          :show-compare-action="!store.wizard.active || isStep(3)"
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
    </section>

    <section
      v-if="store.comparisonProducts.length && (!store.wizard.active || isStep(3))"
      ref="compareTrayRef"
      class="compare-tray"
      :class="{ 'wizard-focus': isStep(3) }"
      data-wizard-target="compare-products"
    >
      <div>
        <p class="eyebrow">{{ store.wizard.active ? "Guided comparison" : "Compare" }}</p>
        <h2>{{ store.comparisonProducts.length }}/2 products selected</h2>
        <p v-if="isStep(3)" class="wizard-inline-note">
          {{ comparisonInstruction }}
        </p>
      </div>

      <div class="compare-items">
        <article v-for="item in store.comparisonProducts" :key="item.id" class="compare-mini-card">
          <img :src="item.image" :alt="item.name" loading="lazy" decoding="async" />
          <div>
            <strong>{{ item.name }}</strong>
            <span>{{ item.category }} · €{{ item.price }}</span>
          </div>
          <button
            type="button"
            class="text-button"
            :disabled="isStep(3) && item.id === store.wizard.selectedProductId"
            @click="store.toggleComparison(item.id)"
          >
            Remove
          </button>
          <button
            v-if="isStep(3) && store.comparisonProducts.length === 2"
            type="button"
            class="button button-sm compare-open-button"
            @click="openComparedProduct(item.id)"
          >
            Open details
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
import { computed, nextTick, onMounted, ref, watch } from "vue"
import { useRouter } from "vue-router"
import { useProductStore } from "../stores/productStore"
import ProductCard from "../components/ProductCard.vue"

const router = useRouter()
const store = useProductStore()
const standardProductsPerPage = 12
const guidedProductsPerPage = 4
const currentPage = ref(1)

const search = ref(store.filters.search)
const category = ref(store.filters.category)
const collection = ref(store.filters.collection)
const sort = ref(store.filters.sort)
const compareTrayRef = ref(null)
const availableCollections = computed(() => store.collections(category.value))

const currentPageSize = computed(() => (store.wizard.active ? guidedProductsPerPage : standardProductsPerPage))

const wizardInstruction = computed(() => {
  const instructions = {
    1: "Choose a category.",
    2: "Pick one product.",
    3: "Compare two products.",
    4: "Open the chosen product.",
    5: "Choose options.",
    6: "Add it to cart.",
    7: "Finish checkout.",
  }

  return instructions[store.wizard.step] ?? "Follow the guided shopping flow."
})

const wizardSupport = computed(() => {
  const support = {
    1: "Start here.",
    2: "Only a few products are shown.",
    3: "Then open one from the compare tray.",
    4: "Only the chosen product can be opened.",
    5: "Choose color, size, and quantity.",
    6: "Use the add to cart button.",
    7: "Submit the form to finish.",
  }

  return support[store.wizard.step] ?? "Use the visible guidance to continue."
})


const heroLead = computed(() =>
  store.wizard.active
    ? "The shop is simplified so the next action is clear."
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

const comparisonInstruction = computed(() => {
  if (store.comparisonProducts.length < 2) {
    return "Add one more product."
  }

  return "Compare them, then open one."
})

const comparisonCallout = computed(() => {
  if (!store.comparison.length) {
    return null
  }

  if (store.comparison.length === 1) {
    return {
      title: "1 item ready to compare",
      body: "Choose one more product.",
    }
  }

  return {
    title: "Comparison ready",
    body: "Open the compare tray below.",
  }
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

  if (store.wizard.step <= 3) {
    return true
  }

  return store.wizard.step === 4 && store.wizard.selectedProductId !== productId
}

const shouldMuteProduct = (productId) =>
  store.wizard.step === 4 && store.wizard.selectedProductId && store.wizard.selectedProductId !== productId

const handleBlockedOpen = () => {
  if (!store.wizard.active) {
    return
  }

  if (store.wizard.step <= 3) {
    store.showToast("Follow guided mode: choose a category, select a product, and complete comparison first", "warning")
    return
  }

  store.showToast("Follow guided mode: open the selected product", "warning")
}

const handleProductOpen = (productId) => {
  if (store.wizard.active && store.wizard.step === 4 && store.wizard.selectedProductId !== productId) {
    store.showToast("Follow guided mode: open the selected product", "warning")
  }
}

const openComparedProduct = (productId) => {
  if (store.chooseWizardComparisonProduct(productId)) {
    router.push(`/product/${productId}`)
  }
}

const scrollToCompareTray = () => {
  if (!compareTrayRef.value) {
    return
  }

  compareTrayRef.value.scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

onMounted(() => {
  if (store.wizard.active) {
    return
  }

  store.startWizard()
  store.setToast({
    title: "Welcome to Guided Mode",
    message: "Start by selecting a category to explore products.",
  })
})

watch(
  () => [store.filteredProducts.length, currentPageSize.value],
  () => {
    if (currentPage.value > totalPages.value) {
      currentPage.value = totalPages.value
    }
  },
)

watch(
  () => store.comparison.length,
  async (newLength, oldLength) => {
    if (!newLength || newLength === oldLength) {
      return
    }

    await nextTick()

    if (newLength >= 2) {
      scrollToCompareTray()
      return
    }

    if (oldLength === 0 && newLength === 1) {
      store.showToast("First item added to compare. Choose one more, then use the comparison section below.", "info")
    }
  },
)
</script>
