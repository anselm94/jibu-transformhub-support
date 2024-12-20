<script setup lang="ts">
import cv from "@techstark/opencv-js";
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';
import { useRouter } from "vue-router";
import WebCam from '../components/WebCam.vue';
import { convertDataUrlToImageData, findPaperContour, getCornerPoints } from '../lib/image-processing';
import { useImageStore } from '../store';

const router = useRouter() // Create a router instance
const imageStore = useImageStore() // Create an image store instance

const webcamPreview = useTemplateRef("webcamPreview"); // Reference to the webcam preview

onMounted(() => {
    // When the component is mounted, start the camera preview
    webcamPreview.value!.startCameraPreview()
})

onBeforeUnmount(() => {
    // When the component is about to be unmounted, stop the camera preview
    webcamPreview.value!.stopCameraPreview()
})

/// Event Handlers

function onCameraReady() {
    // This function is called when the camera is ready
}

function onPhotoUpload(evt: Event) {
    // This function is called when a photo is uploaded
    const file = (evt.target as HTMLInputElement).files?.[0]; // Get the uploaded file
    if (file) {
        const fileReader = new FileReader(); // Create a FileReader to read the file
        fileReader.onload = async () => {
            // When the file is loaded, convert it to image data
            const uploadPhotoImageData = await convertDataUrlToImageData(fileReader.result as string, window.innerWidth, window.innerHeight);
            imageStore.photoCaptured = uploadPhotoImageData; // Store the captured photo

            const matPhoto = cv.matFromImageData(uploadPhotoImageData); // Convert image data to OpenCV matrix

            detectPaperContourAndNavigate(matPhoto); // Detect paper contour and navigate
            matPhoto.delete(); // Delete the OpenCV matrix to free memory
        }
        fileReader.readAsDataURL(file); // Read the file as a data URL
    }
}

async function onCameraCapture() {
    // This function is called when a photo is captured from the camera
    const capturedImageData = await webcamPreview.value?.capturePhoto(); // Capture the photo
    if (!capturedImageData) return

    imageStore.photoCaptured = capturedImageData // Store the captured photo

    const matPhoto = cv.matFromImageData(capturedImageData); // Convert image data to OpenCV matrix
    detectPaperContourAndNavigate(matPhoto); // Detect paper contour and navigate
    matPhoto.delete(); // Delete the OpenCV matrix to free memory
}

function detectPaperContourAndNavigate(matImg: cv.Mat) {
    // This function detects the paper contour and navigates to the edit-photo-crop page
    const paperContour = findPaperContour(matImg); // Find the paper contour
    if (paperContour) {
        const cornerPoints = getCornerPoints(paperContour) // Get the corner points of the paper
        imageStore.photoPerspectiveCropPoints = cornerPoints // Store the corner points
    }

    router.push({ name: "edit-photo-crop" }) // Navigate to the edit-photo-crop page
}
</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <!-- WebCam component for camera preview -->
        <WebCam ref="webcamPreview" class="absolute left-0 top-0 h-full w-full" @camera-ready="onCameraReady" />
        <div class="fixed preview-container z-20" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="justify-self-center">
                    <!-- Button to upload a photo -->
                    <label for="upload-photo">
                        <div class="text-white rounded-full p-4 bg-black-overlay-200 active:bg-black-overlay-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                            </svg>
                        </div>
                    </label>
                    <input id="upload-photo" type="file" name="photo" accept="image/*" style="display: none"
                        @change="onPhotoUpload" />
                </div>
                <div class="justify-self-center">
                    <!-- Button to capture a photo -->
                    <button class="text-gray-700 rounded-full p-4 bg-gray-50 hover:bg-gray-200 active:bg-gray-400"
                        @click="onCameraCapture">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <circle cx="12" cx="12" r="10" />
                            <path
                                d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center">
                    <div class="w-24 h-24"></div>
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