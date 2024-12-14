import { createApp } from "vue";
import { createPinia } from "pinia";
import { createRouter, createWebHistory } from "vue-router";
import App from "./App.vue";
import HomeView from "./pages/Home.vue";
import "./index.css";
import cv from "@techstark/opencv-js";

// Router
const router = createRouter({
  history: createWebHistory("/"),
  routes: [{ path: "/", name: "Home", component: HomeView }],
});

// State Management
const stateManagement = createPinia();

cv.onRuntimeInitialized = () => {
  // Initialize
  createApp(App).use(router).use(stateManagement).mount("#app");
};
