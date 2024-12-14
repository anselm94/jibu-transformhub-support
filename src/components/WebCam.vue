<script setup lang="ts">
import { ref, onMounted, useTemplateRef, defineExpose, defineEmits, onUnmounted } from 'vue'
import cv from "@techstark/opencv-js";

defineExpose({
    startCameraPreview
})

const emit = defineEmits(['error-loading'])

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

async function startCameraPreview() {
    const cameraVideoStream = await startCameraPreviewFor();

    const availableCameras = await getAvailableCameras();

    dataCamera.value.availableCameras = availableCameras;
    dataCamera.value.cameraDeviceId = cameraVideoStream.getVideoTracks()[0].getSettings().deviceId ?? availableCameras[0].deviceId;
    dataCamera.value.cameraVideoStream = cameraVideoStream;

    await processVideoCapture();
}

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
    <div class="flex camera-container w-screen h-screen">
        <canvas ref="video-preview" class="relative h-full w-full" />
        <div class="fixed preview-container" style="background: rgba(0,0,0,0.4);">
            <div class="flex preview-overlay">
                <div class="justify-self-center" @click="">
                    <button class="text-gray-700 rounded-full bg-gray-50 hover:bg-gray-200 active:bg-gray-400 p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24"
                            stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10" />
                            <path
                                d="M14.31 8l5.74 9.94M9.69 8h11.48M7.38 12l5.74-9.94M9.69 16L3.95 6.06M14.31 16H2.83M16.62 12l-5.74 9.94" />
                        </svg>
                    </button>
                </div>
                <div class="justify-self-center" @click="" v-if="dataCamera.availableCameras.length > 0">
                    <button class="text-gray-700">
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
        @apply top-0 right-0 w-1/12 h-full
    }

    .preview-overlay {
        @apply flex-col p-4 items-center h-full
    }
}

@media(orientation: portrait) {
    .camera-container {
        @apply flex-col items-center justify-center
    }

    .preview-container {
        @apply bottom-0 left-0 w-full h-1/6
    }

    .preview-overlay {
        @apply flex-row p-4 items-center h-full
    }
}
</style>