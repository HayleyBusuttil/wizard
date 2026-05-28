<!--Navigation bar for the application-->
<template>
  <nav class="nav-bar">
    <RouterLink class="brand" to="/">AURA</RouterLink>

    <div class="nav-links">
      <RouterLink
        to="/"
        class="nav-link"
        :class="{ 'is-locked': isLocked('/') }"
        :title="navTitle('/')"
        :tabindex="isLocked('/') ? -1 : 0"
        :aria-disabled="isLocked('/') ? 'true' : 'false'"
      >
        Home
      </RouterLink>
      <RouterLink
        to="/shop"
        class="nav-link"
        :class="{ 'is-locked': isLocked('/shop') }"
        :title="navTitle('/shop')"
        :tabindex="isLocked('/shop') ? -1 : 0"
        :aria-disabled="isLocked('/shop') ? 'true' : 'false'"
      >
        Shop
      </RouterLink>
      <RouterLink
        to="/about"
        class="nav-link"
        :class="{ 'is-locked': isLocked('/about') }"
        :title="navTitle('/about')"
        :tabindex="isLocked('/about') ? -1 : 0"
        :aria-disabled="isLocked('/about') ? 'true' : 'false'"
      >
        About
      </RouterLink>
      <RouterLink
        to="/cart"
        class="nav-link nav-cart"
        :class="{ 'is-locked': isLocked('/cart') }"
        :title="navTitle('/cart')"
        :tabindex="isLocked('/cart') ? -1 : 0"
        :aria-disabled="isLocked('/cart') ? 'true' : 'false'"
      >
        Cart
        <span class="nav-cart-count">{{ store.cartCount }}</span>
      </RouterLink>
    </div>

    <p v-if="store.wizard.active" class="nav-lock-note">
      Complete the current step to unlock navigation.
    </p>
  </nav>
</template>

<script setup>
import { useProductStore } from "../stores/productStore"

const store = useProductStore()

function isLocked(path) {
  if (!store.wizard.active) {
    return false
  }

  if (store.wizard.step <= 2) {
    return path !== "/shop"
  }

  if (store.wizard.step === 3) {
    return path !== "/shop"
  }

  if (store.wizard.step <= 6) {
    return path !== "/product"
  }

  return path !== "/cart"
}

function navTitle(path) {
  if (!isLocked(path)) {
    return undefined
  }

  return "Complete the current step first"
}
</script>
