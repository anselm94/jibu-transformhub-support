<script setup lang="ts">
import cv from "@techstark/opencv-js";
import { defineEmits, defineExpose, onMounted, ref, useTemplateRef } from 'vue';
import { highlightPaper } from "../lib/image-processing";

defineExpose({
    startCameraPreview,
    stopCameraPreview,
    getImageData
})

defineProps({
    class: String
})

const emit = defineEmits<{
    'camera-ready': [deviceId: string, deviceIds: string[]]
    'error-loading': []
}>()

const FPS = 30;

const videoEl = useTemplateRef<HTMLVideoElement>('video-el')
const canvasPreview = useTemplateRef<HTMLCanvasElement>('video-preview')
const canvasPaperContourPreview = useTemplateRef<HTMLCanvasElement>('video-paper-contour')

const dataCamera = ref({
    availableCameras: [] as MediaDeviceInfo[],
    cameraDeviceId: null as string | null,
    cameraVideoStream: null as MediaStream | null,
})

const dataOpenCV = ref({
    videoCapture: null as cv.VideoCapture | null,
    size: {
        preview: {
            width: 0,
            height: 0
        }
    }
})

onMounted(async () => {
    const previewWidth = window.innerWidth;
    const previewHeight = window.innerHeight;
    dataOpenCV.value.size.preview.width = previewWidth;
    dataOpenCV.value.size.preview.height = previewHeight;
    if (videoEl.value && canvasPreview.value && canvasPaperContourPreview.value) {
        videoEl.value.width = previewWidth;
        videoEl.value.height = previewHeight;
        canvasPreview.value.width = canvasPaperContourPreview.value.width = previewWidth;
        canvasPreview.value.height = canvasPaperContourPreview.value.height = previewHeight;

        dataOpenCV.value.videoCapture = new cv.VideoCapture(videoEl.value)
    }
})

/// Methods

async function startCameraPreview() {
    const cameraVideoStream = await startCameraPreviewFor();

    const availableCameras = await getAvailableCameras();

    dataCamera.value.availableCameras = availableCameras;
    dataCamera.value.cameraDeviceId = cameraVideoStream.getVideoTracks()[0].getSettings().deviceId ?? availableCameras[0].deviceId;
    dataCamera.value.cameraVideoStream = cameraVideoStream;

    emit('camera-ready', dataCamera.value.cameraDeviceId, availableCameras.map(c => c.deviceId))

    await processVideoCapture();
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

function getImageData() {
    if (!canvasPreview.value) {
        throw new Error('Webcam Canvas not initialized');
    }
    const contextCanvasPreview = canvasPreview.value.getContext('2d')!;
    return contextCanvasPreview.getImageData(0, 0, canvasPreview.value.width, canvasPreview.value.height);
}

// Internal

async function startCameraPreviewFor(deviceId?: string) {
    const cameraDeviceConstraint: MediaStreamConstraints = {
        video: deviceId ? {
            deviceId: {
                exact: deviceId
            }
        } : true
    }
    const videoStream = await navigator.mediaDevices.getUserMedia(cameraDeviceConstraint);
    if (videoEl.value) {
        videoEl.value.srcObject = videoStream;
    }
    return videoStream;
}

async function getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    await navigator.mediaDevices.getUserMedia({
        video: true
    })
    const deviceInfos = await navigator.mediaDevices.enumerateDevices();
    return deviceInfos
        .filter(deviceInfo => !!deviceInfo.deviceId)
        .filter(deviceInfo => deviceInfo.kind === 'videoinput')
}

async function processVideoCapture() {
    const timeBegin = Date.now();

    const matSrc = new cv.Mat(dataOpenCV.value.size.preview.height, dataOpenCV.value.size.preview.width, cv.CV_8UC4);
    dataOpenCV.value.videoCapture?.read(matSrc);

    if (canvasPreview.value && canvasPaperContourPreview.value) {
        cv.imshow(canvasPreview.value, matSrc);
        // highlight the detected paper
        const ctxContourPreview = canvasPaperContourPreview.value.getContext('2d')!;
        ctxContourPreview.clearRect(0, 0, canvasPaperContourPreview.value.width, canvasPaperContourPreview.value.height);
        highlightPaper(matSrc, ctxContourPreview, {
            color: 'rgba(0, 255, 0, 0.5)',
            thickness: 10,
        });
        // schedule the next one.
        let timeDelay = 1000 / FPS - (Date.now() - timeBegin);
        setTimeout(processVideoCapture, timeDelay);
    }
    matSrc.delete();
}

</script>

<template>
    <video ref="video-el" class="hidden" autoplay />
    <canvas ref="video-paper-contour" style="z-index: 1;" :class="class" v-bind="{ ...$attrs }" />
    <canvas ref="video-preview" style="z-index: 0;" :class="class" v-bind="{ ...$attrs }" />
</template>

<style></style>