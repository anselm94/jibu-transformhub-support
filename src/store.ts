import { defineStore } from "pinia";
import { ref } from "vue";

export type Point = {
  x: number;
  y: number;
};

export type CornerPoints = {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomLeftCorner: Point;
  bottomRightCorner: Point;
};

export const useImageStore = defineStore("imagedata", () => {
  const photoCaptured = ref<ImageData>();
  const photoCropped = ref<ImageData>();
  const photoPerspectiveCrop = ref();
  const photoPerspectiveCropPoints = ref<CornerPoints>({
    topLeftCorner: { x: 0, y: 0 },
    topRightCorner: { x: 0, y: 0 },
    bottomLeftCorner: { x: 0, y: 0 },
    bottomRightCorner: { x: 0, y: 0 },
  });

  // Actions

  return {
    photoCaptured,
    photoCropped,
    photoPerspectiveCrop,
    photoPerspectiveCropPoints,
  };
});
