import cv from "@techstark/opencv-js";

export function convertCvMatToImageData(mat: cv.Mat): ImageData {
  const matImage = new cv.Mat();
  const depth = mat.type() % 8;
  const scale = depth <= cv.CV_8S ? 1 : depth <= cv.CV_32S ? 1 / 256 : 255;
  const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128 : 0;
  mat.convertTo(matImage, cv.CV_8U, scale, shift);
  switch (matImage.type()) {
    case cv.CV_8UC1:
      cv.cvtColor(matImage, matImage, cv.COLOR_GRAY2RGBA);
      break;
    case cv.CV_8UC3:
      cv.cvtColor(matImage, matImage, cv.COLOR_RGB2RGBA);
      break;
    case cv.CV_8UC4:
      break;
    default:
      throw new Error(
        "Bad number of channels (Source image must have 1, 3 or 4 channels)"
      );
  }
  const canvasImageData = new ImageData(
    new Uint8ClampedArray(matImage.data),
    matImage.cols,
    matImage.rows
  );
  matImage.delete();
  return canvasImageData;
}

export function convertImageDataToUrl(imageData: ImageData): string {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not supported");
  }
  canvas.setAttribute("id", "_temp_canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  context.putImageData(imageData, 0, 0);

  return canvas.toDataURL();
}
