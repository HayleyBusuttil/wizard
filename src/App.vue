<!--Main layout of the application-->
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
    <AppToast />
  </div>
</template>

<script setup>
import { computed } from "vue"
import { useRoute } from "vue-router"
import AppToast from "./components/AppToast.vue"
import Navbar from "./components/Navbar.vue"
import WizardPanel from "./components/WizardPanel.vue"

const route = useRoute()
const showWizardPanel = computed(() => route.path !== "/")
</script>

<style scoped>
.app-content-shell {
  position: relative;
  z-index: 1;
  padding-top: 88px;
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
  top: 92px;
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

@media (max-width: 1024px) {
  .app-content-shell {
    padding-top: 124px;
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
