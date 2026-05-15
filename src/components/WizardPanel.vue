<template>
  <section class="wizard-panel-shell" :class="{ 'is-active': store.wizard.active }" aria-live="polite">
    <div class="wizard-panel-card">
      <div class="wizard-panel-header">
        <div>
          <p class="eyebrow">Guided mode</p>
          <h2>{{ panelTitle }}</h2>
          <p class="wizard-panel-copy">{{ panelCopy }}</p>
        </div>

        <span class="wizard-step-counter">{{ stepCounter }}</span>
      </div>

      <div v-if="store.wizard.active" class="wizard-progress-block">
        <div class="wizard-progress-meta">
          <strong>Current objective</strong>
          <span>{{ currentObjective }}</span>
        </div>

        <div class="wizard-progress-track" aria-hidden="true">
          <div class="wizard-progress-fill" :style="{ width: `${progressPercent}%` }"></div>
        </div>
      </div>

      <div class="wizard-panel-actions">
        <button
          v-if="store.wizard.active"
          type="button"
          class="button-soft button-sm"
          :disabled="store.wizard.step === 1"
          @click="goBack"
        >
          Back a step
        </button>
        <p v-if="store.wizard.active" class="wizard-lock-note">
          Complete the guided flow to unlock full site access.
        </p>
        <button v-else type="button" class="button button-sm" @click="startWizard()">
          Start guided mode
        </button>
      </div>

      <ol ref="stepListRef" class="wizard-step-list" aria-label="Wizard steps">
        <li
          v-for="step in store.wizardSteps"
          :key="step.step"
          :ref="(element) => setStepRef(element, step.step)"
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
const stepListRef = ref(null)
const stepItemRefs = new Map()

const stepMap = {
  1: {
    selector: '[data-wizard-target="category-select"]',
    title: "Choose category",
    copy: "Choose a category.",
    route: "/shop",
  },
  2: {
    selector: '[data-wizard-target="product-grid"]',
    title: "Select product",
    copy: "Pick one product.",
    route: "/shop",
  },
  3: {
    selector: '[data-wizard-target="compare-products"]',
    title: "Compare products",
    copy: "Compare two products.",
    route: "/shop",
  },
  4: {
    selector: '[data-wizard-target="wizard-selected-product"]',
    title: "Open product",
    copy: "Open the chosen product.",
    route: () => `/product/${store.wizard.selectedProductId || ""}`,
  },
  5: {
    selector: '[data-wizard-target="product-options"]',
    title: "Choose options",
    copy: "Choose the options.",
    route: () => `/product/${store.wizard.selectedProductId || ""}`,
  },
  6: {
    selector: '[data-wizard-target="add-to-cart"]',
    title: "Add to cart",
    copy: "Add it to cart.",
    route: () => `/product/${store.wizard.selectedProductId || ""}`,
  },
  7: {
    selector: '[data-wizard-target="checkout-panel"]',
    title: "Checkout",
    copy: "Finish checkout.",
    route: "/cart",
  },
}

const currentStep = computed(() => store.wizardSteps.find((item) => item.step === store.wizard.step))
const progressPercent = computed(() => (store.wizard.active ? (store.wizard.step / store.wizardSteps.length) * 100 : 0))
const currentObjective = computed(() => currentStep.value?.description ?? "Start the guided flow.")

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
    return route.path === "/shop"
      ? "Simple step-by-step shopping."
      : "The guide starts in the shop."
  }

  return stepMap[store.wizard.step]?.copy ?? "Follow the steps."
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

function startWizard() {
  if (route.path !== "/shop") {
    router.replace("/shop")
    return
  }

  store.startWizard()
  store.setToast({
    title: "Welcome to Guided Mode",
    message: "Start by selecting a category to explore products.",
  })
}

function goBack() {
  if (!store.wizard.active || store.wizard.step === 1) {
    return
  }

  store.goToPreviousWizardStep()
  const target = stepMap[store.wizard.step]?.route
  const destination = typeof target === "function" ? target() : target

  if (destination && route.path !== destination) {
    router.replace(destination)
  }
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

function setStepRef(element, step) {
  if (element) {
    stepItemRefs.set(step, element)
    return
  }

  stepItemRefs.delete(step)
}

function scrollActiveStepIntoView() {
  if (!store.wizard.active) {
    return
  }

  const stepList = stepListRef.value
  const activeStep = stepItemRefs.get(store.wizard.step)

  if (!stepList || !activeStep) {
    return
  }

  const containerRect = stepList.getBoundingClientRect()
  const stepRect = activeStep.getBoundingClientRect()
  const currentScrollTop = stepList.scrollTop
  const targetScrollTop =
    currentScrollTop +
    (stepRect.top - containerRect.top) -
    containerRect.height * 0.28 +
    stepRect.height * 0.5

  stepList.scrollTo({
    top: Math.max(targetScrollTop, 0),
    behavior: "smooth",
  })
}

let resizeHandler = null
let scrollHandler = null

watch(
  () => [store.wizard.active, store.wizard.step, store.wizard.selectedProductId, route.path],
  async () => {
    await nextTick()
    updateSpotlight()
    scrollActiveStepIntoView()
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
  z-index: 20;
  isolation: isolate;
  width: 100%;
}

.wizard-panel-card {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr);
  gap: 16px;
  max-height: min(calc(100dvh - 114px), 760px);
  padding: 20px 22px;
  border: 1px solid rgba(35, 45, 68, 0.18);
  border-radius: 28px;
  background:
    radial-gradient(circle at top right, rgba(24, 116, 110, 0.12), transparent 28%),
    linear-gradient(135deg, #ffffff, #f0ece5),
    #ffffff;
  box-shadow: 0 24px 50px rgba(35, 45, 68, 0.16);
  overflow: hidden;
}

.wizard-panel-card::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
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
.wizard-step-item strong,
.wizard-progress-meta strong,
.wizard-progress-meta span {
  margin: 0;
}

.wizard-step-counter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, #18746e, #232d44);
  color: #f7f5f1;
  font-size: 0.88rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 10px 24px rgba(24, 116, 110, 0.22);
}

.wizard-panel-copy {
  color: #33405a;
  max-width: 58ch;
  margin-top: 6px;
}

.wizard-progress-block {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 22px;
  background:
    linear-gradient(135deg, rgba(24, 116, 110, 0.08), rgba(255, 255, 255, 0.96)),
    rgba(35, 45, 68, 0.08);
  border: 1px solid rgba(24, 116, 110, 0.14);
}

.wizard-progress-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.wizard-progress-meta strong {
  color: #1d2436;
}

.wizard-progress-meta span {
  color: #33405a;
  font-weight: 600;
}

.wizard-progress-track {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(35, 45, 68, 0.12);
}

.wizard-progress-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #18746e 0%, #232d44 100%);
  transition: width 220ms ease;
}

.wizard-panel-actions {
  display: grid;
  gap: 10px;
  align-items: start;
}

.wizard-lock-note {
  margin: 0;
  color: #33405a;
  font-weight: 600;
}

.wizard-step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-behavior: smooth;
  scroll-padding-block: 22%;
}

.wizard-step-list::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.wizard-step-item {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 45, 68, 0.1);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
  position: relative;
}

.wizard-step-item:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 31px;
  top: calc(100% + 2px);
  width: 2px;
  height: 12px;
  background: linear-gradient(180deg, rgba(24, 116, 110, 0.35), rgba(35, 45, 68, 0.06));
}

.wizard-step-number {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(24, 116, 110, 0.12);
  color: #155b57;
  font-weight: 700;
}

.wizard-step-item strong {
  display: block;
  margin-bottom: 4px;
  color: #1d2436;
}

.wizard-step-item p {
  color: #33405a;
  font-size: 0.92rem;
  line-height: 1.45;
}

.wizard-step-item.is-current {
  border-color: rgba(24, 116, 110, 0.34);
  background: linear-gradient(180deg, rgba(24, 116, 110, 0.16), rgba(24, 116, 110, 0.05));
  box-shadow: 0 16px 30px rgba(24, 116, 110, 0.14);
}

.wizard-step-item.is-current .wizard-step-number {
  background: linear-gradient(135deg, #18746e, #232d44);
  color: #f7f5f1;
}

.wizard-step-item.is-complete {
  border-color: rgba(24, 116, 110, 0.2);
  background: linear-gradient(180deg, rgba(24, 116, 110, 0.1), rgba(24, 116, 110, 0.03));
}

.wizard-step-item.is-upcoming {
  opacity: 0.72;
}

.wizard-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.wizard-overlay-piece {
  position: fixed;
  background: rgba(243, 242, 240, 0.12);
}

@media (max-width: 720px) {
  .wizard-panel-shell {
    top: 10px;
  }

  .wizard-panel-card {
    max-height: min(calc(100dvh - 20px), 720px);
    padding: 18px;
    border-radius: 20px;
  }

  .wizard-panel-header,
  .wizard-progress-meta {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
