<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue';
import { useRouter } from 'vue-router';
import * as fabric from 'fabric';

const router = useRouter()

const photoPreview = useTemplateRef<HTMLCanvasElement>('photo-preview')
let fabricCanvas: fabric.Canvas;

onMounted(async () => {
    if (photoPreview.value) {
        fabricCanvas = new fabric.Canvas(photoPreview.value, {
            width: window.innerWidth,
            height: window.innerHeight,
        });
    }

    const canvasLayerImgPreview = await fabric.FabricImage.fromURL('http://fabricjs.com/assets/pug_small.jpg');
    canvasLayerImgPreview.set({
        left: 0,
        top: 0,
        width: window.innerWidth,
        height: window.innerHeight,
        selectable: false,
    })

    const canvasLayerSelectionHandle = new fabric.Polygon([
        { x: 200, y: 10 },
        { x: 250, y: 50 },
        { x: 250, y: 180 },
        { x: 150, y: 180 },
    ], {
        left: 400,
        top: 400,
        width: 100,
        height: 10,
        fill: 'rgba(0,0,0,0)',
        stroke: 'rgba(1,0,0,1)',
        strokeWidth: 5,
        selectable: true,
        hasBorders: false, // Remove bounding box
    });

    canvasLayerSelectionHandle.controls = fabric.controlsUtils.createPolyControls(4)

    fabricCanvas.add(canvasLayerSelectionHandle, canvasLayerImgPreview)
    fabricCanvas.setActiveObject(canvasLayerSelectionHandle); // Make it selected by default
    fabricCanvas.on('mouse:down', function () {
        fabricCanvas.setActiveObject(canvasLayerSelectionHandle); // Make it selected by default
    });
}
)

onUnmounted(() => {
    fabricCanvas.dispose()
})

/// Event Handlers

function onConfirmPress() {
    router.push({ name: "scan-preview" })
}

function onRetakePress() {
    router.push({ name: "capture-photo-scan" })
}
</script>

<template>
    <div class="flex camera-container w-screen h-screen">
        <div class="relative h-full w-full">
            <canvas class="w-full h-full" ref="photo-preview"></canvas>
        </div>
        <div class="fixed preview-container" style="background: rgba(0,0,0,0.4);">
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
