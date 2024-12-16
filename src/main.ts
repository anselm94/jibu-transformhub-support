import cv from "@techstark/opencv-js";
import { createPinia } from "pinia";
import { createApp } from "vue";
import VueKonva from "vue-konva";
import { createRouter, createWebHashHistory } from "vue-router";
import App from "./App.vue";
import "./index.css";
import CameraPreviewPage from "./pages/CameraPreview.vue";
import PhotoAdjustCropPage from "./pages/PhotoAdjustCrop.vue";
import ScanPreviewPage from "./pages/ScanPreview.vue";

// Router
const router = createRouter({
  history: createWebHashHistory("/"),
  routes: [
    {
      path: "/",
      name: "capture-photo-scan",
      component: CameraPreviewPage,
    },
    {
      path: "/photo-crop-edit",
      name: "edit-photo-crop",
      component: PhotoAdjustCropPage,
    },
    { path: "/scan-preview", name: "scan-preview", component: ScanPreviewPage },
  ],
});

// State Management
const stateManagement = createPinia();

cv.onRuntimeInitialized = () => {
  // Initialize
  createApp(App).use(router).use(stateManagement).use(VueKonva).mount("#app");
};
