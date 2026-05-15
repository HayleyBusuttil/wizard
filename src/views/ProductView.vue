<template>
  <section v-if="product" class="page page-product" :class="{ 'wizard-product-mode': store.wizard.active }">
    <nav v-if="!store.wizard.active" class="breadcrumbs">
      <RouterLink to="/shop">Shop</RouterLink>
      <span>/</span>
      <RouterLink :to="`/shop?category=${product.category}`">{{ product.category }}</RouterLink>
      <span>/</span>
      <span>{{ product.name }}</span>
    </nav>

    <section v-if="store.wizard.active" class="wizard-inline-banner wizard-product-banner">
      <div>
        <p class="eyebrow">Guided product step</p>
        <h3>{{ wizardObjective }}</h3>
        <p>{{ wizardSupport }}</p>
      </div>
      <span class="wizard-stage-pill">Step {{ store.wizard.step }} / {{ store.wizardSteps.length }}</span>
    </section>

    <div class="product-detail-layout">
      <div class="product-visual" :class="{ 'is-muted': store.wizard.active && !isDetailStep }">
        <img :src="selectedImage" :alt="product.name" loading="eager" decoding="async" fetchpriority="high" />
        <span class="product-chip">{{ product.badge }}</span>

        <div class="product-gallery" v-if="galleryImages.length > 1">
          <button
            v-for="image in galleryImages"
            :key="image"
            class="gallery-thumb"
            :class="{ active: image === selectedImage }"
            type="button"
            @click="selectedImage = image"
            :aria-label="`Preview ${product.name}`"
          >
            <img :src="image" :alt="product.name" loading="lazy" decoding="async" />
          </button>
        </div>
      </div>

      <aside class="product-buybox" :class="{ 'wizard-detail-lock': store.wizard.active }">
        <p class="eyebrow">{{ product.category }}</p>
        <h1>{{ product.name }}</h1>
        <p class="lead">{{ product.summary }}</p>

        <div class="price-row">
          <strong>€{{ product.price }}</strong>
          <span v-if="product.originalPrice">€{{ product.originalPrice }}</span>
        </div>

        <div class="meta-row" :class="{ 'is-deemphasized': store.wizard.active }">
          <span>{{ product.rating.toFixed(1) }} rating</span>
          <span>{{ product.reviews }} reviews</span>
          <span>{{ product.stock }} left</span>
        </div>

        <div
          class="selection-panel"
          :class="{ 'wizard-focus': shouldHighlightOptions, 'is-muted': store.wizard.active && !shouldHighlightOptions }"
          data-wizard-target="product-options"
        >
          <div v-if="store.wizard.active" class="option-setup-header">
            <strong>Customize this item</strong>
            <span>Required: size and color. Quantity is optional and defaults to 1.</span>
          </div>

          <label class="input-group">
            <span>Color</span>
            <select v-model="selectedColor" @change="completeOptionStep">
              <option v-for="color in product.colors" :key="color" :value="color">{{ color }}</option>
            </select>
          </label>

          <div class="input-group">
            <span>Size</span>
            <div class="size-options">
              <button
                v-for="size in sizes"
                :key="size"
                type="button"
                class="size-pill"
                :class="{ active: selectedSize === size }"
                @click="selectSize(size)"
              >
                {{ size }}
              </button>
            </div>
          </div>

          <label class="input-group optional-quantity">
            <span>Quantity</span>
            <div class="quantity-control">
              <button type="button" @click="decreaseQuantity">−</button>
              <input v-model.number="quantity" type="number" min="1" :max="product.stock" @change="completeOptionStep" />
              <button type="button" @click="increaseQuantity">+</button>
            </div>
            <small>Optional. Leave at 1 if you only need one item.</small>
          </label>

          <p v-if="store.wizard.active" class="wizard-inline-note">
            {{ shouldHighlightOptions ? "Choose valid options to unlock the next required action. Your selection will remain visible briefly before the wizard advances." : "The system is holding this detail page to the current required action." }}
          </p>
        </div>

        <div class="button-row guided-buy-actions">
          <button
            class="button primary-add"
            :class="{ 'wizard-focus': shouldHighlightAdd }"
            data-wizard-target="add-to-cart"
            type="button"
            @click="addToCart"
          >
            Add {{ quantity }} to cart
          </button>
          <button
            v-if="!store.wizard.active"
            class="button button-soft"
            type="button"
            :class="{ active: store.comparison.includes(product.id) }"
            @click="store.toggleComparison(product.id)"
          >
            {{ store.comparison.includes(product.id) ? "Remove comparison" : "Compare item" }}
          </button>
          <RouterLink v-if="!store.wizard.active" class="button button-soft" to="/cart">Go to cart</RouterLink>
        </div>

        <p class="support-copy" :class="{ 'is-deemphasized': store.wizard.active }">
          {{ store.wizard.active ? "Only the required purchase controls remain visible in guided mode." : "Free shipping over €180 and a 30-day return policy. This page gives shoppers enough context to move from browsing into buying." }}
        </p>
      </aside>
    </div>

    <section class="detail-blocks" :class="{ 'is-muted': store.wizard.active }">
      <article class="detail-card">
        <p class="eyebrow">Description</p>
        <p>{{ product.description }}</p>
      </article>

      <article class="detail-card">
        <p class="eyebrow">Highlights</p>
        <ul class="feature-list">
          <li v-for="item in product.details" :key="item">{{ item }}</li>
        </ul>
      </article>

      <article class="detail-card">
        <p class="eyebrow">Decision support</p>
        <p>
          {{ store.wizard.active ? "Background information remains visible but de-emphasized so the current task stays central." : "Details, size options, color choices, and comparison support make the product page more useful for realistic shopping tasks." }}
        </p>
      </article>
    </section>

    <section v-if="!store.wizard.active" class="related-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">You may also like</p>
          <h2>Related products</h2>
        </div>
      </div>

      <div class="product-grid related-grid">
        <ProductCard
          v-for="item in relatedProducts"
          :key="item.id"
          :product="item"
          :is-compared="store.comparison.includes(item.id)"
          :compare-disabled="store.comparison.length >= 2"
          @quick-add="store.addToCart(item.id)"
          @compare="store.toggleComparison(item.id)"
        />
      </div>
    </section>
  </section>

  <section v-else class="page empty-detail">
    <div class="empty-state">
      <h1>Product not found.</h1>
      <p>The item may have moved. Return to the shop and keep browsing.</p>
      <RouterLink class="button" to="/shop">Back to shop</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from "vue"
import { useRoute, useRouter } from "vue-router"
import { useProductStore } from "../stores/productStore"
import ProductCard from "../components/ProductCard.vue"

const route = useRoute()
const router = useRouter()
const store = useProductStore()

const product = computed(() => store.productById(route.params.id))
const sizes = ["XS", "S", "M", "L", "XL"]
const quantity = ref(1)
const selectedColor = ref("")
const selectedSize = ref("M")
const selectedImage = ref("")
const optionAdvanceDelayMs = 1500
let optionStepTimeout = null

const galleryImages = computed(() => {
  if (!product.value) {
    return []
  }

  if (store.wizard.active) {
    return [product.value.image]
  }

  const siblings = store.products
    .filter((item) => item.collection === product.value.collection)
    .map((item) => item.image)

  return [...new Set([product.value.image, ...siblings])].slice(0, 5)
})

const relatedProducts = computed(() =>
  store.products
    .filter((item) => item.id !== product.value?.id && item.category === product.value?.category)
    .slice(0, 3),
)

const shouldHighlightAdd = computed(
  () =>
    store.wizard.active &&
    store.wizard.step === 6 &&
    store.wizard.selectedProductId === product.value?.id,
)

const shouldHighlightOptions = computed(
  () =>
    store.wizard.active &&
    store.wizard.step === 5 &&
    store.wizard.selectedProductId === product.value?.id,
)

const isDetailStep = computed(() => shouldHighlightOptions.value || shouldHighlightAdd.value)

const wizardObjective = computed(() => {
  if (store.wizard.step === 5) {
    return "Choose the product options required to continue."
  }

  if (store.wizard.step === 6) {
    return "Add this configured product to the cart."
  }

  return "Stay on the selected product until the current task is complete."
})

const wizardSupport = computed(() => {
  if (store.wizard.step === 5) {
    return "Color, size, and quantity must be valid before the next action unlocks."
  }

  if (store.wizard.step === 6) {
    return "Secondary actions are hidden so the guided purchase remains linear."
  }

  return "This page is locked to the selected product in guided mode."
})

watch(
  product,
  (value) => {
    selectedColor.value = value?.colors?.[0] ?? ""
    selectedSize.value = "M"
    selectedImage.value = value?.image ?? ""
    quantity.value = 1

    if (value) {
      store.trackEvent("view_product", { productId: value.id })
    }
  },
  { immediate: true },
)

watch(galleryImages, (images) => {
  if (!images.length) {
    return
  }

  if (!images.includes(selectedImage.value)) {
    selectedImage.value = images[0]
  }
})

watch(
  product,
  (value) => {
    if (!value) {
      return
    }

    store.completeWizardProductOpen(value.id)
  },
  { immediate: true },
)

function addToCart() {
  if (!product.value) {
    return
  }

  if (
    store.wizard.active &&
    !store.validateWizardOptions(product.value.id, {
      color: selectedColor.value,
      size: selectedSize.value,
      quantity: quantity.value,
    })
  ) {
    return
  }

  store.addToCart(product.value.id, quantity.value, selectedColor.value, selectedSize.value)

  if (store.wizard.active && store.wizard.step === 7) {
    router.push("/cart")
  }
}

function completeOptionStep() {
  if (!product.value) {
    return
  }

  if (!store.wizard.active || store.wizard.step !== 5) {
    return
  }

  if (optionStepTimeout) {
    window.clearTimeout(optionStepTimeout)
  }

  optionStepTimeout = window.setTimeout(() => {
    store.completeWizardOptions(product.value.id, {
      color: selectedColor.value,
      size: selectedSize.value,
      quantity: quantity.value,
    })
  }, optionAdvanceDelayMs)
}

function selectSize(size) {
  selectedSize.value = size
  completeOptionStep()
}

function increaseQuantity() {
  if (!product.value) {
    return
  }

  quantity.value = Math.min(product.value.stock, quantity.value + 1)
  completeOptionStep()
}

function decreaseQuantity() {
  quantity.value = Math.max(1, quantity.value - 1)
  completeOptionStep()
}

onBeforeUnmount(() => {
  if (optionStepTimeout) {
    window.clearTimeout(optionStepTimeout)
  }
})
</script>
