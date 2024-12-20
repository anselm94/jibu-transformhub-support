<script setup lang="ts">
import { onMounted, ref, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useImageStore } from '../store';
import { Dialog } from "frappe-ui"

// Get the router instance to navigate between pages
const router = useRouter()
// Get the image store to access the photo and extracted data
const imageStore = useImageStore();

// Reference to the canvas element where the image will be displayed
const scanPreview = useTemplateRef<HTMLCanvasElement>('scan-preview');

// Flag to indicate if the backend is processing the image
const isProcessingInBackend = ref(false);

onMounted(() => {
    // Set the canvas size to match the window size
    if (scanPreview.value) {
        scanPreview.value.width = window.innerWidth;
        scanPreview.value.height = window.innerHeight;
    }

    // If there is a cropped photo, draw it on the canvas
    if (imageStore.photoCropped && scanPreview.value) {
        // Create a temporary canvas to draw the cropped photo
        const tempCanvasEl = document.createElement('canvas');
        tempCanvasEl.width = imageStore.photoCropped.width;
        tempCanvasEl.height = imageStore.photoCropped.height;
        const tempCtx = tempCanvasEl.getContext('2d')!;
        tempCtx.putImageData(imageStore.photoCropped, 0, 0);

        // Calculate the scaling ratio to fit the image within the canvas
        const widthRatio = scanPreview.value.width / imageStore.photoCropped.width
        const heightRatio = scanPreview.value.height / imageStore.photoCropped.height
        const ratio = Math.min(widthRatio, heightRatio)

        // Draw the scaled image on the main canvas
        const ctxScanPreview = scanPreview.value.getContext('2d')!;
        ctxScanPreview.scale(ratio, ratio)
        ctxScanPreview.drawImage(tempCanvasEl, 0, 0);
    }
})

// Event Handlers

// Function to handle the confirm button click
function onConfirm() {
    // Set the processing flag to true
    isProcessingInBackend.value = true;
    // Convert the canvas content to a blob (binary large object)
    scanPreview.value?.toBlob(async (blob) => {
        if (blob) {
            // Create a form data object to send the image to the backend
            const formData = new FormData();
            formData.append('photo', blob, "photo.png");
            // Send the image to the backend using a POST request
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            // Set the processing flag to false
            isProcessingInBackend.value = false;
            if (res.ok) {
                // If the response is OK, get the extracted data and navigate to the preview page
                const data = await res.json();
                imageStore.extractedTable = data;
                router.push({ name: "extracted-data-preview" })
            }
        }
    }, "image/png")
}

// Function to handle the back button click
function onBackPress() {
    // Navigate back to the photo crop page
    router.push({ name: "edit-photo-crop" })
}
</script>

<template>
    <!-- Dialog to show processing status -->
    <Dialog v-model="isProcessingInBackend" :options="{ title: 'Processing...' }" @close="isProcessingInBackend = true">
    </Dialog>
    <!-- Main container for the camera preview -->
    <div class="flex camera-container w-screen h-screen">
        <div class="relative h-full w-full p-8">
            <!-- Canvas element to display the image -->
            <canvas class="w-full h-full" ref="scan-preview"></canvas>
        </div>
        <!-- Container for the action buttons -->
        <div class="fixed preview-container" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="justify-self-center">
                    <!-- Confirm button -->
                    <button class="text-gray-700 rounded-full p-4 bg-gray-50 hover:bg-gray-200 active:bg-gray-400"
                        @click="onConfirm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center">
                    <!-- Back button -->
                    <button class="text-white rounded-full p-4 bg-black-overlay-200 active:bg-black-overlay-400"
                        @click="onBackPress">
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
