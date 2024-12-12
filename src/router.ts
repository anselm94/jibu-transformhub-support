import { createRouter, createWebHistory } from "vue-router";
import HomeView from "./pages/Home.vue";

const routes = [{ path: "/", name: "Home", component: HomeView }];

export default createRouter({
  history: createWebHistory("/frontend"),
  routes,
});
