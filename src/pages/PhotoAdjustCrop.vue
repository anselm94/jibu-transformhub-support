<script setup lang="ts">
import cv from "@techstark/opencv-js";
import Konva from "konva";
import { computed, onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { convertCvMatToImageData, convertImageDataToCanvas, extractPaperByPerspectiveTransform } from '../lib/image-processing';
import { useImageStore } from '../store';

type VueKonvaProxy<Group> = { getNode(): Group };

const router = useRouter()
const imageStore = useImageStore();

// References to the draggable points and image on the canvas
const contourPolygon = useTemplateRef<VueKonvaProxy<Konva.Line>>('contour-polygon');
const contourImage = useTemplateRef<VueKonvaProxy<Konva.Image>>('photo-image');

const contourP0 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p0');
const contourP1 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p1');
const contourP2 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p2');
const contourP3 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p3');

// Get the window dimensions
const windowWidth = window.innerWidth
const windowHeight = window.innerHeight

// Calculate the scale to fit the image within the window
const imageToWindowScale = computed(() => imageStore.photoCaptured?.width ? windowWidth / imageStore.photoCaptured.width : 1)

// Calculate the positions of the polygon corners
const polygonCornerPoints = computed(() => [
    imageStore.photoPerspectiveCropPoints.topLeftCorner.x * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.topLeftCorner.y * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.topRightCorner.x * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.topRightCorner.y * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.x * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.y * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.x * imageToWindowScale.value,
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.y * imageToWindowScale.value,
])

onMounted(async () => {
    // When the component is mounted, draw the captured photo on the canvas
    if (imageStore.photoCaptured && contourImage.value) {
        const canvas = await convertImageDataToCanvas(imageStore.photoCaptured, windowWidth, windowHeight)
        contourImage.value.getNode().image(canvas)
    }
})

// Event Handlers

// Update the position of the top-left corner
function onP0DragMove() {
    imageStore.photoPerspectiveCropPoints.topLeftCorner.x = contourP0.value!.getNode().getPosition().x / imageToWindowScale.value
    imageStore.photoPerspectiveCropPoints.topLeftCorner.y = contourP0.value!.getNode().getPosition().y / imageToWindowScale.value
}
// Update the position of the top-right corner
function onP1DragMove() {
    imageStore.photoPerspectiveCropPoints.topRightCorner.x = contourP1.value!.getNode().getPosition().x / imageToWindowScale.value
    imageStore.photoPerspectiveCropPoints.topRightCorner.y = contourP1.value!.getNode().getPosition().y / imageToWindowScale.value
}
// Update the position of the bottom-right corner
function onP2DragMove() {
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.x = contourP2.value!.getNode().getPosition().x / imageToWindowScale.value
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.y = contourP2.value!.getNode().getPosition().y / imageToWindowScale.value
}
// Update the position of the bottom-left corner
function onP3DragMove() {
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.x = contourP3.value!.getNode().getPosition().x / imageToWindowScale.value
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.y = contourP3.value!.getNode().getPosition().y / imageToWindowScale.value
}

// Keep the polygon and image in place while dragging
function onOtherDragMove() {
    contourPolygon.value!.getNode().x(0).y(0);
    contourImage.value!.getNode().x(0).y(0);
}

// Confirm the crop and process the image
function onConfirmPress() {
    const matSrc = cv.matFromImageData(imageStore.photoCaptured!);
    const matPerspectiveTransformed = extractPaperByPerspectiveTransform(matSrc, imageStore.photoPerspectiveCropPoints);
    const matDst = new cv.Mat();
    cv.cvtColor(matPerspectiveTransformed, matDst, cv.COLOR_BGR2GRAY);

    cv.threshold(matDst, matDst, 0, 255, cv.THRESH_BINARY | cv.THRESH_OTSU);

    imageStore.photoCropped = convertCvMatToImageData(matDst);

    router.push({ name: "scan-preview" })

    matSrc.delete();
    matDst.delete();
}

// Retake the photo
function onRetakePress() {
    router.push({ name: "capture-photo-scan" })
}

</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <div class="relative h-full w-full">
            <v-stage ref="stage" :width="windowWidth" :height="windowHeight">
                <v-layer draggable="false">
                    <v-image ref="photo-image" @dragmove="onOtherDragMove" draggable="false" />
                </v-layer>
                <v-layer draggable="false">
                    <v-line ref="contour-polygon" @dragmove="onOtherDragMove" :points="polygonCornerPoints"
                        stroke="#ff0000" strokeWidth=5 draggable="false" closed="true" />
                    <v-circle ref="p0" @dragmove="onP0DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.topLeftCorner.x * imageToWindowScale"
                        :y="imageStore.photoPerspectiveCropPoints.topLeftCorner.y * imageToWindowScale" radius=10
                        fill="#00ff00" draggable="true" />
                    <v-circle ref="p1" @dragmove="onP1DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.topRightCorner.x * imageToWindowScale"
                        :y="imageStore.photoPerspectiveCropPoints.topRightCorner.y * imageToWindowScale" radius=10
                        fill="#00ff00" draggable="true" />
                    <v-circle ref="p2" @dragmove="onP2DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.bottomRightCorner.x * imageToWindowScale"
                        :y="imageStore.photoPerspectiveCropPoints.bottomRightCorner.y * imageToWindowScale" radius=10
                        fill="#00ff00" draggable="true" />
                    <v-circle ref="p3" @dragmove="onP3DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.bottomLeftCorner.x * imageToWindowScale"
                        :y="imageStore.photoPerspectiveCropPoints.bottomLeftCorner.y * imageToWindowScale" radius=10
                        fill="#00ff00" draggable="true" />
                </v-layer>
            </v-stage>
        </div>
        <div class="fixed preview-container z-10" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="justify-self-center">
                    <button class="text-gray-700 rounded-full p-4 bg-gray-50 hover:bg-gray-200 active:bg-gray-400"
                        @click="onConfirmPress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center">
                    <button class="text-white rounded-full p-4 bg-black-overlay-200 active:bg-black-overlay-400"
                        @click="onRetakePress">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <line x1="19" y1="12" x2="5" y2="12"></line>
                            <polyline points="12 19 5 12 12 5"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="postcss" scoped>
@media(orientation: landscape) {
    .camera-container {
        @apply flex-row items-center justify-center
    }

    .preview-container {
        @apply top-0 right-0 w-32 h-full
    }

    .preview-overlay {
        @apply flex-col p-4 items-center h-full justify-around
    }
}

@media(orientation: portrait) {
    .camera-container {
        @apply flex-col items-center justify-center
    }

    .preview-container {
        @apply bottom-0 left-0 w-full h-32
    }

    .preview-overlay {
        @apply flex-row-reverse p-4 items-center h-full justify-around
    }
}
</style>
