<script setup lang="ts">
import { onMounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import { useImageStore } from '../store';

const router = useRouter()
const imageStore = useImageStore();

const scanPreview = useTemplateRef<HTMLCanvasElement>('scan-preview');

onMounted(() => {
    if (scanPreview.value) {
        scanPreview.value.width = window.innerWidth;
        scanPreview.value.height = window.innerHeight;
    }

    if (imageStore.photoCropped && scanPreview.value) {
        const tempCanvasEl = document.createElement('canvas');
        tempCanvasEl.width = imageStore.photoCropped.width;
        tempCanvasEl.height = imageStore.photoCropped.height;
        const tempCtx = tempCanvasEl.getContext('2d')!;
        tempCtx.putImageData(imageStore.photoCropped, 0, 0);

        const widthRatio = scanPreview.value.width / imageStore.photoCropped.width
        const heightRatio = scanPreview.value.height / imageStore.photoCropped.height
        const ratio = Math.min(widthRatio, heightRatio)

        const ctxScanPreview = scanPreview.value.getContext('2d')!;
        // scanPreview.value.width = imageStore.photoCropped.width * ratio
        // scanPreview.value.height = imageStore.photoCropped.height * ratio
        ctxScanPreview.scale(ratio, ratio)
        ctxScanPreview.drawImage(tempCanvasEl, 0, 0);
    }
})

/// Event Handlers

function onConfirm() {

}

function onBackPress() {
    router.push({ name: "edit-photo-crop" })
}
</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <div class="relative h-full w-full p-8">
            <canvas class="w-full h-full" ref="scan-preview"></canvas>
        </div>
        <div class="fixed preview-container" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="justify-self-center">
                    <button class="text-gray-700 rounded-full p-4 bg-gray-50 hover:bg-gray-200 active:bg-gray-400"
                        @click="onConfirm">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center">
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
