<!--displays a message to guide or warn the user during flow-->
<template>
  <transition name="toast-drop">
    <div v-if="toast" class="app-toast-wrap" aria-live="polite" aria-atomic="true">
      <div class="app-toast-card" :class="toastClass">
        <div class="app-toast-copy">
          <strong>{{ toast.title || "Guided step" }}</strong>
          <p>{{ toast.message }}</p>
        </div>

        <button type="button" class="button-soft button-sm app-toast-dismiss" @click="store.dismissToast()">
          Dismiss
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from "vue"
import { useProductStore } from "../stores/productStore"

const store = useProductStore()
const toast = computed(() => store.toast)
const toastClass = computed(() => (toast.value?.type ? `is-${toast.value.type}` : "is-info"))
</script>

<style scoped>
.app-toast-wrap {
  position: fixed;
  top: 84px;
  left: 50%;
  transform: translateX(-50%);
  width: min(calc(100vw - 32px), 560px);
  z-index: 60;
  pointer-events: none;
}

.app-toast-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(47, 79, 103, 0.14);
  background:
    linear-gradient(135deg, rgba(24, 116, 110, 0.05), rgba(255, 255, 255, 0.98)),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 247, 245, 0.98)),
    rgba(255, 255, 255, 0.97);
  box-shadow:
    0 0 0 2px rgba(47, 79, 103, 0.08),
    0 10px 22px rgba(28, 49, 74, 0.08);
  backdrop-filter: blur(12px);
  pointer-events: auto;
}

.app-toast-card::after {
  content: "";
  position: absolute;
  inset: -6px;
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  pointer-events: none;
}

.app-toast-copy,
.app-toast-copy strong,
.app-toast-copy p {
  margin: 0;
}

.app-toast-copy {
  display: grid;
  gap: 4px;
}

.app-toast-copy strong {
  color: #1d2436;
}

.app-toast-copy p {
  color: #39465d;
}

.app-toast-dismiss {
  flex-shrink: 0;
  white-space: nowrap;
}

.app-toast-card.is-warning {
  border-color: rgba(157, 123, 83, 0.18);
  box-shadow:
    0 0 0 2px rgba(157, 123, 83, 0.08),
    0 10px 22px rgba(28, 49, 74, 0.08);
}

.toast-drop-enter-active,
.toast-drop-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
}

.toast-drop-enter-from,
.toast-drop-leave-to {
  opacity: 0;
  transform: translate(-50%, -14px);
}

@media (max-width: 720px) {
  .app-toast-wrap {
    top: 122px;
    width: calc(100vw - 20px);
  }

  .app-toast-card {
    flex-direction: column;
    align-items: stretch;
  }

  .app-toast-dismiss {
    width: 100%;
    text-align: center;
  }
}
</style>
