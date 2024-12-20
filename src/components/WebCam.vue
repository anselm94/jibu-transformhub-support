<script setup lang="ts">
import cv from "@techstark/opencv-js";
import { defineEmits, defineProps, defineExpose, onMounted, ref, useTemplateRef } from 'vue';
import { highlightPaper } from "../lib/image-processing";

defineExpose({
    startCameraPreview,
    stopCameraPreview,
    capturePhoto,
})

defineProps({
    class: String
})

const emit = defineEmits<{
    'camera-available': []
    'camera-ready': []
    'error-loading': []
}>()

const FPS = 30;

const videoEl = useTemplateRef<HTMLVideoElement>('video-el')
const canvasPreview = useTemplateRef<HTMLCanvasElement>('video-preview')
const canvasPaperContourPreview = useTemplateRef<HTMLCanvasElement>('video-paper-contour')

const dataCamera = ref({
    cameraVideoStream: null as MediaStream | null,
})

const dataOpenCV = ref({
    size: {
        preview: {
            dx: 0,
            dy: 0,
            width: 0,
            height: 0
        }
    }
})

onMounted(async () => {
    videoEl.value!.onloadedmetadata = async () => {
        const videoWidth = videoEl.value!.videoWidth;
        const videoHeight = videoEl.value!.videoHeight;

        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        const windowAspectRatio = windowWidth / windowHeight;
        const videoAspectRatio = videoWidth / videoHeight;

        if (windowAspectRatio > videoAspectRatio) {
            // window is wider than video
            dataOpenCV.value.size.preview.width = videoWidth;
            dataOpenCV.value.size.preview.height = videoWidth / windowAspectRatio;
            dataOpenCV.value.size.preview.dx = 0;
            dataOpenCV.value.size.preview.dy = (videoHeight - dataOpenCV.value.size.preview.height) / 2;
        } else {
            // window is taller than video
            dataOpenCV.value.size.preview.width = videoHeight * windowAspectRatio;
            dataOpenCV.value.size.preview.height = videoHeight;
            dataOpenCV.value.size.preview.dx = (videoWidth - dataOpenCV.value.size.preview.width) / 2;
            dataOpenCV.value.size.preview.dy = 0;
        }

        if (canvasPreview.value && canvasPaperContourPreview.value) {
            canvasPreview.value.width = canvasPaperContourPreview.value.width = dataOpenCV.value.size.preview.width;
            canvasPreview.value.height = canvasPaperContourPreview.value.height = dataOpenCV.value.size.preview.height;
        }

        emit('camera-available')

        await processVideoCapture();
    }
})

/// Methods

async function startCameraPreview() {
    dataCamera.value.cameraVideoStream = await beginCamera();
    emit('camera-ready')
}

function stopCameraPreview() {
    if (dataCamera.value.cameraVideoStream) {
        dataCamera.value.cameraVideoStream.getVideoTracks().forEach(track => {
            track.stop()
        });
    }
    if (videoEl.value) {
        videoEl.value.srcObject = null;
    }
}

async function capturePhoto() {
    if (dataCamera.value.cameraVideoStream && videoEl.value) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = dataOpenCV.value.size.preview.width;
        tempCanvas.height = dataOpenCV.value.size.preview.height;

        const ctxTempCanvas = tempCanvas.getContext('2d')!;
        ctxTempCanvas.drawImage(videoEl.value, dataOpenCV.value.size.preview.dx, dataOpenCV.value.size.preview.dy, dataOpenCV.value.size.preview.width, dataOpenCV.value.size.preview.height, 0, 0, dataOpenCV.value.size.preview.width, dataOpenCV.value.size.preview.height);
        return ctxTempCanvas.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    }
}

// Internal

async function beginCamera() {
    const cameraDeviceConstraint: MediaStreamConstraints = {
        video: {
            facingMode: {
                ideal: 'environment'
            }
        }
    }
    const videoStream = await navigator.mediaDevices.getUserMedia(cameraDeviceConstraint);
    if (videoEl.value) {
        videoEl.value.srcObject = videoStream;
    }
    return videoStream;
}

async function processVideoCapture() {
    const timeBegin = Date.now();

    if (videoEl.value && canvasPreview.value && canvasPaperContourPreview.value) {
        const ctxCanvasPreview = canvasPreview.value.getContext('2d', { alpha: false })!;
        ctxCanvasPreview.drawImage(videoEl.value, dataOpenCV.value.size.preview.dx, dataOpenCV.value.size.preview.dy, dataOpenCV.value.size.preview.width, dataOpenCV.value.size.preview.height, 0, 0, dataOpenCV.value.size.preview.width, dataOpenCV.value.size.preview.height);

        const matSrc = cv.matFromImageData(ctxCanvasPreview.getImageData(0, 0, canvasPreview.value.width, canvasPreview.value.height));

        // cv.flip(matSrc, matSrc, 1);
        // highlight the detected paper
        const ctxContourPreview = canvasPaperContourPreview.value.getContext('2d')!;
        ctxContourPreview.clearRect(0, 0, canvasPaperContourPreview.value.width, canvasPaperContourPreview.value.height);
        highlightPaper(matSrc, ctxContourPreview, {
            color: 'rgba(0, 255, 0, 0.5)',
            thickness: 10,
        });
        matSrc.delete();

        // schedule the next one.
        let timeDelay = 1000 / FPS - (Date.now() - timeBegin);
        setTimeout(processVideoCapture, timeDelay);
    }
}

</script>

<template>
    <video ref="video-el" class="hidden h-screen w-screen" autoplay />
    <canvas ref="video-paper-contour" style="z-index: 1;" :class="class" v-bind="{ ...$attrs }" />
    <canvas ref="video-preview" style="z-index: 0;" :class="class" v-bind="{ ...$attrs }" />
</template>

<style></style>