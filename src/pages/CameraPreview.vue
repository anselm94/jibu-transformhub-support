<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { useRouter } from "vue-router";
import WebCam from '../components/WebCam.vue';
import { useImageStore } from '../store';
import { findPaperContour, getCornerPoints } from '../lib/image-processing';
import cv from "@techstark/opencv-js"

const router = useRouter()
const imageStore = useImageStore()

const availableCameraCount = ref(0)

const webcamPreview = useTemplateRef("webcamPreview");

onMounted(() => {
    webcamPreview.value!.startCameraPreview()
})

onBeforeUnmount(() => {
    webcamPreview.value!.stopCameraPreview()
})

/// Event Handlers

function onCameraReady(_: string, deviceIds: string[]) {
    availableCameraCount.value = deviceIds.length
}

function onCameraCapture() {
    const capturedImageData = webcamPreview.value?.getImageData();
    if (!capturedImageData) return

    const matCapturedImage = cv.matFromImageData(capturedImageData);
    imageStore.photoCaptured = capturedImageData

    const paperContour = findPaperContour(matCapturedImage);
    if (paperContour) {
        const cornerPoints = getCornerPoints(paperContour)
        imageStore.photoPerspectiveCropPoints = cornerPoints
    }

    router.push({ name: "edit-photo-crop" })
}

function onCameraFlip() {

}
</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <WebCam ref="webcamPreview" class="absolute left-0 top-0 h-full w-full" @camera-ready="onCameraReady" />
        <div class="fixed preview-container z-20" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="w-6 h-6"></div>
                <div class="justify-self-center">
                    <button class="text-gray-700 rounded-full p-4 bg-gray-50 hover:bg-gray-200 active:bg-gray-400"
                        @click="onCameraCapture">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <path
                                d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center">
                    <button class="text-white rounded-full p-4 bg-black-overlay-200 active:bg-black-overlay-400"
                        @click="onCameraFlip" v-if="availableCameraCount > 1">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round"
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
        @apply flex-row p-4 items-center h-full justify-around
    }
}
</style>