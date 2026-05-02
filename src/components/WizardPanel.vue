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
        <button v-else type="button" class="button button-sm" @click="startWizard()">
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
import { useRoute, useRouter } from "vue-router"
import { useProductStore } from "../stores/productStore"

const store = useProductStore()
const route = useRoute()
const router = useRouter()
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
    selector: '[data-wizard-target="product-options"]',
    title: "Choose options",
    copy: "Use the product options area to choose color, size, or quantity for the selected item.",
  },
  5: {
    selector: '[data-wizard-target="add-to-cart"]',
    title: "Add to cart",
    copy: "Add the selected item from the product page to continue.",
  },
  6: {
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
  if (
    !spotlight.value ||
    !store.wizard.active ||
    store.wizard.step <= 2 ||
    typeof window === "undefined"
  ) {
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

function startWizard() {
  store.startWizard()
  router.replace("/shop")
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
    window.setTimeout(updateSpotlight, 80)
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

<style scoped>
.wizard-panel-shell {
  position: sticky;
  top: 18px;
  z-index: 12;
  width: min(calc(100% - 32px), 1200px);
  margin: 16px auto 0;
}

.wizard-panel-card {
  display: grid;
  gap: 16px;
  padding: 20px 22px;
  border: 1px solid rgba(35, 45, 68, 0.12);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(248, 245, 239, 0.92)),
    rgba(255, 255, 255, 0.88);
  box-shadow: 0 18px 38px rgba(35, 45, 68, 0.08);
  backdrop-filter: blur(14px);
}

.wizard-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.wizard-panel-header h2,
.wizard-panel-copy,
.wizard-step-item p,
.wizard-step-item strong {
  margin: 0;
}

.wizard-step-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(35, 45, 68, 0.08);
  color: #232d44;
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
}

.wizard-panel-copy {
  color: #5f677a;
  max-width: 58ch;
}

.wizard-panel-actions {
  display: flex;
  gap: 10px;
}

.wizard-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.wizard-step-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(35, 45, 68, 0.08);
}

.wizard-step-number {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(35, 45, 68, 0.08);
  color: #232d44;
  font-weight: 700;
}

.wizard-step-item strong {
  display: block;
  margin-bottom: 4px;
  color: #1d2436;
}

.wizard-step-item p {
  color: #6c7486;
  font-size: 0.92rem;
  line-height: 1.45;
}

.wizard-step-item.is-current {
  border-color: rgba(35, 45, 68, 0.18);
  background: linear-gradient(180deg, rgba(35, 45, 68, 0.08), rgba(35, 45, 68, 0.03));
}

.wizard-step-item.is-current .wizard-step-number {
  background: #232d44;
  color: #f7f5f1;
}

.wizard-step-item.is-complete {
  border-color: rgba(120, 144, 110, 0.22);
  background: linear-gradient(180deg, rgba(120, 144, 110, 0.12), rgba(120, 144, 110, 0.04));
}

.wizard-step-item.is-upcoming {
  opacity: 0.82;
}

.wizard-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 11;
}

.wizard-overlay-piece {
  position: fixed;
  background: rgba(243, 242, 240, 0.28);
  backdrop-filter: blur(2px);
}

@media (max-width: 720px) {
  .wizard-panel-shell {
    width: min(calc(100% - 20px), 1200px);
    top: 10px;
  }

  .wizard-panel-card {
    padding: 18px;
    border-radius: 20px;
  }

  .wizard-panel-header {
    flex-direction: column;
  }

  .wizard-step-list {
    grid-template-columns: 1fr;
  }
}
</style>
