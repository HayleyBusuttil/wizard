<template>
  <div class="app-shell">
    <!-- Background -->
    <div class="app-bg app-bg-a"></div>
    <div class="app-bg app-bg-b"></div>

    <!-- Navigation -->
    <Navbar />

    <div class="app-content-shell" :class="{ 'has-wizard': showWizardPanel }">
      <aside v-if="showWizardPanel" class="app-wizard-rail">
        <WizardPanel />
      </aside>

      <main class="app-main">
        <router-view />
      </main>
    </div>

    <transition name="fade">
      <div v-if="store.toast" class="guided-toast">
        <div class="guided-toast-content">
          <strong>
            {{ store.toast.title || "Guided step" }}
          </strong>

          <p>
            {{ store.toast.message }}
          </p>

          <button @click="store.dismissToast()">Got it</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import Navbar from "./components/Navbar.vue"
import WizardPanel from "./components/WizardPanel.vue"
import { useProductStore } from "./stores/productStore"

const store = useProductStore()
const route = useRoute()
const showWizardPanel = computed(() => route.path !== "/")
</script>

<style scoped>
.app-content-shell {
  position: relative;
  z-index: 1;
  padding-top: 108px;
}

.app-content-shell.has-wizard {
  width: min(calc(100% - 20px), 1480px);
  margin: 0 auto;
  display: block;
  position: relative;
  padding-left: 344px;
}

.app-wizard-rail,
.app-main {
  min-width: 0;
}

.app-wizard-rail {
  position: fixed;
  top: 110px;
  left: max(10px, calc((100vw - min(1480px, calc(100vw - 20px))) / 2));
  width: 320px;
  z-index: 30;
}

.app-content-shell.has-wizard :deep(.page),
.app-content-shell.has-wizard :deep(.refined-layout),
.app-content-shell.has-wizard :deep(.cart-layout),
.app-content-shell.has-wizard :deep(.order-confirmation),
.app-content-shell.has-wizard :deep(.page-hero),
.app-content-shell.has-wizard :deep(.section-block),
.app-content-shell.has-wizard :deep(.home-hero),
.app-content-shell.has-wizard :deep(.product-grid-wrap) {
  width: 100%;
  max-width: none;
  margin-left: 0;
  margin-right: 0;
}

.app-content-shell.has-wizard :deep(.refined-layout) {
  padding: 0.75rem 0 2rem;
}

.guided-toast {
  position: fixed;
  bottom: 28px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 50;
}

.guided-toast-content {
  background: #ffffff;
  border: 1px solid rgba(35, 45, 68, 0.12);
  padding: 16px 20px;
  border-radius: 18px;
  box-shadow: 0 20px 40px rgba(35, 45, 68, 0.15);
  max-width: 420px;
  text-align: center;
  backdrop-filter: blur(12px);
}

.guided-toast-content strong {
  display: block;
  margin-bottom: 6px;
  font-size: 1rem;
  color: #232d44;
}

.guided-toast-content p {
  margin: 0 0 10px;
  color: #666;
  font-size: 0.95rem;
}

.guided-toast-content button {
  border: none;
  background: #232d44;
  color: white;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 1024px) {
  .app-content-shell {
    padding-top: 132px;
  }

  .app-content-shell.has-wizard {
    width: min(calc(100% - 20px), 1200px);
    padding-left: 0;
  }

  .app-wizard-rail {
    position: static;
    width: auto;
  }

  .app-content-shell.has-wizard :deep(.refined-layout) {
    padding-top: 1rem;
  }
}
</style>
