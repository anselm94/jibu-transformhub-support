<script setup lang="ts">
import cv from "@techstark/opencv-js";
import { defineEmits, defineExpose, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

defineExpose({
    startCameraPreview,
})

const emit = defineEmits<{
    'camera-ready': [deviceId: string, deviceIds: string[]]
    'error-loading': []
}>()

const FPS = 30;

const videoEl = useTemplateRef<HTMLVideoElement>('video-el')
const canvasPreview = useTemplateRef<HTMLCanvasElement>('video-preview')

const dataCamera = ref({
    availableCameras: [] as MediaDeviceInfo[],
    cameraDeviceId: null as string | null,
    cameraVideoStream: null as MediaStream | null,
})

const dataOpenCV = ref({
    videoCapture: null as cv.VideoCapture | null,
    matSrc: null as cv.Mat | null,
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
    if (videoEl.value && canvasPreview.value) {
        videoEl.value.width = canvasPreview.value.width = previewWidth;
        videoEl.value.height = canvasPreview.value.height = previewHeight;

        dataOpenCV.value.videoCapture = new cv.VideoCapture(videoEl.value)
    }

    dataOpenCV.value.matSrc = new cv.Mat(previewWidth, previewHeight, cv.CV_8UC4);

    await startCameraPreview();
})

onUnmounted(() => {
    if (dataCamera.value.cameraVideoStream) {
        dataCamera.value.cameraVideoStream.getTracks().forEach(track => track.stop());
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

    cv.imshow(canvasPreview.value!, matSrc);
    matSrc.delete();

    // schedule the next one.
    let timeDelay = 1000 / FPS - (Date.now() - timeBegin);
    setTimeout(processVideoCapture, timeDelay);
}

</script>

<template>
    <video ref="video-el" class="hidden" autoplay />
    <canvas ref="video-preview" class="relative h-full w-full" />
</template>

<style></style>