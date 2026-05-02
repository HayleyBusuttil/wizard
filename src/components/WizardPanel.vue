<template>
  <section class="wizard-panel-shell" :class="{ 'is-active': store.wizard.active }" aria-live="polite">
    <div class="wizard-panel-card">
      <div class="wizard-panel-header">
        <div>
          <p class="eyebrow">Guided mode</p>
          <h2>{{ panelTitle }}</h2>
        </div>

        <span class="wizard-step-counter">{{ stepCounter }}</span>
      </div>

      <p class="wizard-panel-copy">{{ panelCopy }}</p>

      <div class="wizard-panel-actions">
        <button
          v-if="store.wizard.active"
          type="button"
          class="button-soft button-sm"
          @click="store.exitWizard()"
        >
          Exit guided mode
        </button>
        <button v-else type="button" class="button button-sm" @click="store.startWizard()">
          Start guided mode
        </button>
      </div>

      <ol class="wizard-step-list" aria-label="Wizard steps">
        <li
          v-for="step in store.wizardSteps"
          :key="step.step"
          class="wizard-step-item"
          :class="wizardStepState(step.step)"
        >
          <span class="wizard-step-number">{{ step.step }}</span>
          <div>
            <strong>{{ step.title }}</strong>
            <p>{{ step.description }}</p>
          </div>
        </li>
      </ol>
    </div>

    <div v-if="spotlightStyle" class="wizard-overlay" aria-hidden="true">
      <div class="wizard-overlay-piece wizard-overlay-top" :style="spotlightStyle.top"></div>
      <div class="wizard-overlay-piece wizard-overlay-left" :style="spotlightStyle.left"></div>
      <div class="wizard-overlay-piece wizard-overlay-right" :style="spotlightStyle.right"></div>
      <div class="wizard-overlay-piece wizard-overlay-bottom" :style="spotlightStyle.bottom"></div>
    </div>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { useRoute } from "vue-router"
import { useProductStore } from "../stores/productStore"

const store = useProductStore()
const route = useRoute()
const spotlight = ref(null)

const stepMap = {
  1: {
    selector: '[data-wizard-target="category-select"]',
    title: "Choose category",
    copy: "Open the shop, choose a category, and unlock the product grid.",
  },
  2: {
    selector: '[data-wizard-target="product-grid"]',
    title: "Select product",
    copy: "Use the product cards to choose a single item to continue with.",
  },
  3: {
    selector: '[data-wizard-target="wizard-selected-product"]',
    title: "Open product",
    copy: "Open the selected product card to move into the detail page.",
  },
  4: {
    selector: '[data-wizard-target="add-to-cart"]',
    title: "Add to cart",
    copy: "Add the selected item from the product page to continue.",
  },
  5: {
    selector: '[data-wizard-target="checkout-panel"]',
    title: "Checkout",
    copy: "Review the cart and complete the simulated checkout form.",
  },
}

const currentStep = computed(() => store.wizardSteps.find((item) => item.step === store.wizard.step))

const panelTitle = computed(() => {
  if (!store.wizard.active) {
    return "Guided mode paused"
  }

  return currentStep.value?.title ?? "Guided mode"
})

const stepCounter = computed(() => {
  if (!store.wizard.active) {
    return `0 of ${store.wizardSteps.length}`
  }

  return `Step ${store.wizard.step} of ${store.wizardSteps.length}`
})

const panelCopy = computed(() => {
  if (!store.wizard.active) {
    return "Start guided mode to follow the shop-to-checkout path with visible in-context guidance."
  }

  const step = stepMap[store.wizard.step]
  if (!step) {
    return "Follow the guided flow to complete the shopping task."
  }

  return step.copy
})

const spotlightStyle = computed(() => {
  if (!spotlight.value || !store.wizard.active || typeof window === "undefined") {
    return null
  }

  const { top, left, width, height } = spotlight.value
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  const right = Math.max(viewportWidth - (left + width), 0)
  const bottom = Math.max(viewportHeight - (top + height), 0)

  return {
    top: { left: "0px", top: "0px", width: "100%", height: `${top}px` },
    left: { left: "0px", top: `${top}px`, width: `${left}px`, height: `${height}px` },
    right: {
      left: `${left + width}px`,
      top: `${top}px`,
      width: `${right}px`,
      height: `${height}px`,
    },
    bottom: {
      left: "0px",
      top: `${top + height}px`,
      width: "100%",
      height: `${bottom}px`,
    },
  }
})

function wizardStepState(step) {
  if (!store.wizard.active) {
    return step === 1 ? "is-current" : "is-upcoming"
  }

  if (step < store.wizard.step) {
    return "is-complete"
  }

  if (step === store.wizard.step) {
    return "is-current"
  }

  return "is-upcoming"
}

function updateSpotlight() {
  if (!store.wizard.active || typeof document === "undefined") {
    spotlight.value = null
    return
  }

  const step = stepMap[store.wizard.step]
  if (!step) {
    spotlight.value = null
    return
  }

  const target = document.querySelector(step.selector)
  if (!target) {
    spotlight.value = null
    return
  }

  const rect = target.getBoundingClientRect()
  spotlight.value = {
    top: Math.max(rect.top - 12, 0),
    left: Math.max(rect.left - 12, 0),
    width: rect.width + 24,
    height: rect.height + 24,
  }
}

let resizeHandler = null
let scrollHandler = null

watch(
  () => [store.wizard.active, store.wizard.step, store.wizard.selectedProductId, route.path],
  async () => {
    await nextTick()
    updateSpotlight()
  },
  { immediate: true },
)

onMounted(() => {
  resizeHandler = () => updateSpotlight()
  scrollHandler = () => updateSpotlight()

  window.addEventListener("resize", resizeHandler, { passive: true })
  window.addEventListener("scroll", scrollHandler, { passive: true })
})

onBeforeUnmount(() => {
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler)
  }

  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler)
  }
})
</script>