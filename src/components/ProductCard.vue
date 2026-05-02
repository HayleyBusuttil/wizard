<script setup>
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useProductStore } from "../stores/productStore"

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
  isCompared: {
    type: Boolean,
    default: false,
  },
  compareDisabled: {
    type: Boolean,
    default: false,
  },
  showCompareAction: {
    type: Boolean,
    default: false,
  },
  showSelectAction: {
    type: Boolean,
    default: false,
  },
  isWizardSelected: {
    type: Boolean,
    default: false,
  },
  openLocked: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(["quick-add", "compare", "select", "blocked-open", "open"])

const router = useRouter()
const store = useProductStore()

const isSelectStep = computed(() => store.wizard.active && store.wizard.step === 2)
const isOpenStep = computed(() => store.wizard.active && store.wizard.step === 3 && props.isWizardSelected)
const canQuickAdd = computed(() => !store.wizard.active || store.wizard.step >= 4)
const wizardTarget = computed(() => {
  if (props.isWizardSelected && store.wizard.active && store.wizard.step === 3) {
    return "wizard-selected-product"
  }

  return null
})

const helperText = computed(() => {
  if (props.isWizardSelected && store.wizard.active && store.wizard.step === 3) {
    return "Selected. Open this product to continue."
  }

  if (isSelectStep.value && props.showSelectAction) {
    return "Click Select to continue."
  }

  if (store.wizard.active && store.wizard.step < 4) {
    return "Follow the guided step before using quick add."
  }

  return ""
})

function openProduct() {
  if (props.openLocked) {
    emit("blocked-open", props.product.id)
    return
  }

  if (isSelectStep.value && props.showSelectAction) {
    emit("select", props.product.id)
    return
  }

  if (!store.guardProductAccess(props.product.id)) {
    emit("blocked-open", props.product.id)
    return
  }

  emit("open", props.product.id)
  router.push(`/product/${props.product.id}`)
}

function selectProduct() {
  emit("select", props.product.id)
}

function quickAdd() {
  if (!canQuickAdd.value) {
    return
  }

  emit("quick-add", props.product.id)
}

function compareProduct() {
  emit("compare", props.product.id)
}

// --- Inline editor state ---
const editorOpen = ref(false)
const selectedColor = ref(props.product.colors?.[0] ?? "")
const sizes = ["XS", "S", "M", "L", "XL"]
const selectedSize = ref(sizes[2])
const quantity = ref(1)
const hasOptions = computed(() => Boolean(selectedColor.value && selectedSize.value && quantity.value > 0))

const colorSwatches = {
  Ivory: "#f3efe7",
  Sand: "#d9c6a3",
  Clay: "#c38b67",
  Stone: "#b3aea3",
  Charcoal: "#5f6368",
  Olive: "#78804f",
  Pearl: "#ece5dc",
  Taupe: "#b79f87",
  Espresso: "#4b2f25",
  White: "#f4f4f2",
  Sky: "#a9c9e8",
  Ink: "#1e293b",
  Cloud: "#d9e5ee",
  Graphite: "#51555e",
  Mint: "#a8d8c7",
  Black: "#111111",
  Walnut: "#6f4a2f",
  Navy: "#1f3557",
  Bone: "#efe7db",
  Mocha: "#8d6d52",
  Onyx: "#1e1e1f",
}

function colorSwatch(color) {
  return colorSwatches[color] ?? "#d8d0c4"
}

function openEditor() {
  // If wizard restricts quick add entirely, show blocked event instead
  if (store.wizard.active && store.wizard.step < 4) {
    // Keep the editor closed and notify the host
    emit("blocked-open", props.product.id)
    return
  }

  selectedColor.value = props.product.colors?.[0] ?? ""
  selectedSize.value = sizes.includes(selectedSize.value) ? selectedSize.value : sizes[2]
  quantity.value = 1
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
}

function confirmAddToCart() {
  if (!hasOptions.value) {
    return
  }

  // Respect guard in store.addToCart and send the chosen options through.
  store.addToCart(props.product.id, Number(quantity.value), selectedColor.value, selectedSize.value)

  // If guided flow expects a call to complete wizard add, allow store to advance as well
  if (store.wizard.active && store.wizard.selectedProductId === props.product.id) {
    try {
      store.completeWizardAddToCart(props.product.id)
    } catch (e) {
      // ignore — store.addToCart already advances in many cases
    }
  }

  editorOpen.value = false
}
</script>

<template>
  <div
    class="product-card-wrapper"
    :class="{
      'is-compared': isCompared,
      'is-wizard-selected': isWizardSelected,
      'is-guided-selected': isSelectStep,
      'is-guided-open': isOpenStep,
      'is-editor-open': editorOpen,
    }"
    :data-wizard-target="wizardTarget"
  >
    <article
      class="product-card"
      :class="{ 'is-open-locked': openLocked }"
      role="button"
      tabindex="0"
      :aria-label="product.name"
      :title="openLocked ? 'Complete the previous step first' : 'Open product details'"
      @click="openProduct"
      @keyup.enter.prevent="openProduct"
      @keyup.space.prevent="openProduct"
    >
      <div class="product-card-media">
        <img :src="product.image" :alt="product.name" loading="lazy" decoding="async" />
        <span class="product-chip">{{ product.badge }}</span>
      </div>

      <div class="product-card-body">
        <div class="product-card-topline">
          <span>{{ product.category }}</span>
          <span>{{ product.collection }}</span>
        </div>

        <h3 class="product-card-title">{{ product.name }}</h3>
        <p class="product-card-summary">{{ product.summary }}</p>

        <p v-if="helperText" class="wizard-hint product-card-hint">
          {{ helperText }}
        </p>

        <div class="product-card-footer">
          <strong>€{{ product.price }}</strong>
          <span>{{ product.stock }} left</span>
        </div>

        <div class="product-card-actions">
          <button
            type="button"
            class="button-soft button-sm"
            :disabled="!canQuickAdd"
            :title="canQuickAdd ? 'Quick add to cart' : 'Complete the guided step first'"
            @click.stop="openEditor"
          >
            Quick add
          </button>

          <button
            v-if="showCompareAction"
            type="button"
            class="button-soft button-sm compare-button"
            :class="{ active: isCompared }"
            :disabled="compareDisabled && !isCompared"
            :title="compareDisabled && !isCompared ? 'Compare is limited to 2 products' : 'Compare this product'"
            @click.stop="compareProduct"
          >
            {{ isCompared ? 'Compared' : 'Compare' }}
          </button>

          <button
            v-if="showSelectAction"
            type="button"
            class="button button-sm select-button"
            :class="{ active: isWizardSelected }"
            @click.stop="selectProduct"
          >
            {{ isWizardSelected ? 'Selected' : 'Select' }}
          </button>
        </div>

      </div>

      <!-- Inline editor modal -->
      <div v-if="editorOpen" class="product-editor-modal" role="dialog" aria-modal="true" :aria-label="`Edit ${product.name}`">
        <div class="product-editor-backdrop" @click="closeEditor"></div>

        <div class="product-editor-card">
          <div class="product-editor-header">
            <div>
              <p class="eyebrow">Edit before adding</p>
              <h4>{{ product.name }}</h4>
            </div>
            <button type="button" class="editor-close" @click="closeEditor" aria-label="Close editor">×</button>
          </div>

          <p class="product-editor-copy">Choose the exact options you want before the item is added to cart.</p>

          <label class="input-group">
            <span>Color</span>
            <div class="color-options">
              <button
                v-for="c in props.product.colors"
                :key="c"
                type="button"
                class="color-pill"
                :class="{ active: selectedColor === c }"
                @click="selectedColor = c"
              >
                <span class="color-dot" :style="{ background: colorSwatch(c) }"></span>
                {{ c }}
              </button>
            </div>
          </label>

          <label class="input-group">
            <span>Size</span>
            <div class="size-options">
              <button
                v-for="s in sizes"
                :key="s"
                type="button"
                class="size-pill"
                :class="{ active: selectedSize === s }"
                @click="selectedSize = s"
              >
                {{ s }}
              </button>
            </div>
          </label>

          <label class="input-group">
            <span>Quantity</span>
            <div class="quantity-control">
              <button type="button" @click="quantity = Math.max(1, quantity - 1)">−</button>
              <input v-model.number="quantity" type="number" min="1" :max="props.product.stock" />
              <button type="button" @click="quantity = Math.min(props.product.stock, quantity + 1)">+</button>
            </div>
          </label>

          <div class="product-editor-footnote">
            <span>{{ quantity }} item{{ quantity === 1 ? "" : "s" }} selected</span>
            <span v-if="selectedColor && selectedSize">{{ selectedColor }} · {{ selectedSize }}</span>
          </div>

          <div class="product-editor-actions">
            <button type="button" class="button" :disabled="!hasOptions" @click="confirmAddToCart">Add to cart</button>
            <button type="button" class="button-soft" @click="closeEditor">Cancel</button>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>
