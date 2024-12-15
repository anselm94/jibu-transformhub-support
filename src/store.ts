import { defineStore } from "pinia";
import { ref } from "vue";

export const useImageStore = defineStore("imagedata", () => {
  const photoCaptured = ref<ImageData>();
  const photoCropped = ref<ImageData>();
  const photoPerspectiveCrop = ref();

  // Actions

  return { photoCaptured, photoCropped, photoPerspectiveCrop };
});
