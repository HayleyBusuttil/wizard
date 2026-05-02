<template>
  <div class="app-shell">
    <!-- Background -->
    <div class="app-bg app-bg-a"></div>
    <div class="app-bg app-bg-b"></div>

    <!-- Navigation -->
    <Navbar />

    <!-- Wizard Panel (main guidance) -->
    <WizardPanel />

    <!-- Main Content -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- ✅ NEW: Guided Toast (improved) -->
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
import Navbar from "./components/Navbar.vue"
import WizardPanel from "./components/WizardPanel.vue"
import { onMounted } from "vue"
import { useProductStore } from "./stores/productStore"

const store = useProductStore()

// ✅ Auto-start wizard
onMounted(() => {
  if (!store.wizard.active) {
    store.startWizard()

    // ✅ Show first instruction clearly
    store.toast = {
      title: "Welcome to Guided Mode",
      message: "Start by selecting a category to explore products."
    }
  }
})
</script>

<style scoped>
/* ===== Improved Toast ===== */
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

/* ===== Smooth animation ===== */
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
</style>