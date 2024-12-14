<script setup>
import { Dialog } from 'frappe-ui'
import WebCam from '../components/WebCam.vue';
import { ref, onMounted, useTemplateRef } from 'vue'

const webcam = useTemplateRef("webcam");

onMounted(() => {
    webcam.value.startCameraPreview()
})

</script>

<template>
    <div :class="{ 'fullscreen-overlay': fullscreen }">
        <WebCam ref="webcam" />
    </div>
</template>

<style>
.fullscreen-overlay {
    @apply fixed top-0 bottom-0 left-0 right-0 z-50 w-screen h-screen bg-black
}
</style>
