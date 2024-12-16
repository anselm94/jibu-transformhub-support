<script setup lang="ts">
import cv from "@techstark/opencv-js";
import { computed, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { convertCvMatToImageData, convertImageDataToCanvas, extractPaperByPerspectiveTransform } from '../lib/image-processing';
import { useImageStore } from '../store';
import Konva from "konva";

type VueKonvaProxy<Group> = { getNode(): Group };

const router = useRouter()
const imageStore = useImageStore();

const contourPolygon = useTemplateRef<VueKonvaProxy<Konva.Line>>('contour-polygon');
const contourImage = useTemplateRef<VueKonvaProxy<Konva.Image>>('photo-image');

const contourP0 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p0');
const contourP1 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p1');
const contourP2 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p2');
const contourP3 = useTemplateRef<VueKonvaProxy<Konva.Circle>>('p3');

const imageDataUrl = computed(() => imageStore.photoCaptured ? convertImageDataToCanvas(imageStore.photoCaptured) : undefined)
const windowWidth = window.innerWidth
const windowHeight = window.innerHeight
const polygonCornerPoints = computed(() => [
    imageStore.photoPerspectiveCropPoints.topLeftCorner.x,
    imageStore.photoPerspectiveCropPoints.topLeftCorner.y,
    imageStore.photoPerspectiveCropPoints.topRightCorner.x,
    imageStore.photoPerspectiveCropPoints.topRightCorner.y,
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.x,
    imageStore.photoPerspectiveCropPoints.bottomRightCorner.y,
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.x,
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner.y,
])

/// Event Handlers

function onP0DragMove() {
    imageStore.photoPerspectiveCropPoints.topLeftCorner = contourP0.value!.getNode().getPosition()
}
function onP1DragMove() {
    imageStore.photoPerspectiveCropPoints.topRightCorner = contourP1.value!.getNode().getPosition()
}
function onP2DragMove() {
    imageStore.photoPerspectiveCropPoints.bottomRightCorner = contourP2.value!.getNode().getPosition()
}
function onP3DragMove() {
    imageStore.photoPerspectiveCropPoints.bottomLeftCorner = contourP3.value!.getNode().getPosition()
}

function onOtherDragMove() {
    contourPolygon.value!.getNode().x(0).y(0);
    contourImage.value!.getNode().x(0).y(0);
}

function onConfirmPress() {
    const matSrc = cv.matFromImageData(imageStore.photoCaptured!);
    const matPerspectiveTransformed = extractPaperByPerspectiveTransform(matSrc, imageStore.photoPerspectiveCropPoints);
    const matDst = new cv.Mat();
    cv.cvtColor(matPerspectiveTransformed, matDst, cv.COLOR_RGBA2GRAY);
    cv.adaptiveThreshold(matDst, matDst, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
    // cv.threshold(matPerspectiveTransformed, matDst, 130, 255, cv.THRESH_BINARY);
    imageStore.photoCropped = convertCvMatToImageData(matDst);

    router.push({ name: "scan-preview" })

    matSrc.delete();
    matDst.delete();
}

function onRetakePress() {
    router.push({ name: "capture-photo-scan" })
}

</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <div class="relative h-full w-full">
            <v-stage ref="stage" :width="windowWidth" :height="windowHeight">
                <v-layer draggable="false">
                    <v-image ref="photo-image" @dragmove="onOtherDragMove" :image="imageDataUrl" draggable="false" />
                </v-layer>
                <v-layer draggable="false">
                    <v-line ref="contour-polygon" @dragmove="onOtherDragMove" :points="polygonCornerPoints"
                        stroke="#ff0000" strokeWidth=5 draggable="false" closed="true" />
                    <v-circle ref="p0" @dragmove="onP0DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.topLeftCorner.x"
                        :y="imageStore.photoPerspectiveCropPoints.topLeftCorner.y" radius=10 fill="#00ff00"
                        draggable="true" />
                    <v-circle ref="p1" @dragmove="onP1DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.topRightCorner.x"
                        :y="imageStore.photoPerspectiveCropPoints.topRightCorner.y" radius=10 fill="#00ff00"
                        draggable="true" />
                    <v-circle ref="p2" @dragmove="onP2DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.bottomRightCorner.x"
                        :y="imageStore.photoPerspectiveCropPoints.bottomRightCorner.y" radius=10 fill="#00ff00"
                        draggable="true" />
                    <v-circle ref="p3" @dragmove="onP3DragMove"
                        :x="imageStore.photoPerspectiveCropPoints.bottomLeftCorner.x"
                        :y="imageStore.photoPerspectiveCropPoints.bottomLeftCorner.y" radius=10 fill="#00ff00"
                        draggable="true" />
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
