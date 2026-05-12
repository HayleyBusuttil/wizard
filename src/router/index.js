import { createRouter, createWebHistory } from "vue-router"
import { useProductStore } from "../stores/productStore"

const routes = [
  { path: "/", name: "home", component: () => import("../views/HomeView.vue") },
  { path: "/shop", name: "shop", component: () => import("../views/ShopView.vue") },
  { path: "/product/:id", component: () => import("../views/ProductView.vue") },
  { path: "/cart", component: () => import("../views/CartView.vue") },
  { path: "/about", name: "about", component: () => import("../views/AboutView.vue") },
  { path: "/:pathMatch(.*)*", redirect: "/" },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const store = useProductStore()

  if (!store.wizard.active) {
    return true
  }

  const stepRoutes = {
    1: ["/shop"],
    2: ["/shop"],
    3: ["/product"],
    4: ["/product"],
    5: ["/product"],
    6: ["/cart"],
  }

  const allowed = stepRoutes[store.wizard.step] ?? []
  const isAllowed = allowed.some((path) => to.path.startsWith(path))

  if (isAllowed) {
    return true
  }

  switch (store.wizard.step) {
    case 1:
    case 2:
      return "/shop"
    case 3:
    case 4:
    case 5:
      return `/product/${store.wizard.selectedProductId || ""}`
    case 6:
      return "/cart"
    default:
      return true
  }
})

export default router
