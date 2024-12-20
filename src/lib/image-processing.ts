import cv from "@techstark/opencv-js";
import type { CornerPoints, Point } from "../store";

/**
 * Converts an OpenCV Mat object to ImageData.
 * @param {cv.Mat} mat - The OpenCV Mat object to convert.
 * @returns {ImageData} The converted ImageData object.
 */
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

/**
 * Converts ImageData to a canvas element.
 * @param {ImageData} imageData - The ImageData to convert.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @returns {Promise<HTMLCanvasElement>} A promise that resolves to the canvas element.
 */
export function convertImageDataToCanvas(
  imageData: ImageData,
  canvasWidth: number,
  canvasHeight: number
): Promise<HTMLCanvasElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    const context = canvas.getContext("2d")!;
    context.putImageData(imageData, 0, 0);

    const imgObject = new Image();
    imgObject.onload = () => {
      const canvasTarget = document.createElement("canvas");
      canvasTarget.width = canvasWidth;
      canvasTarget.height = canvasHeight;

      const ctxCanvasTarget = canvasTarget.getContext("2d")!;
      const xScale = imageData.width / canvasWidth;
      const yScale = imageData.height / canvasHeight;
      ctxCanvasTarget.scale(1 / xScale, 1 / yScale);
      ctxCanvasTarget.drawImage(imgObject, 0, 0);
      resolve(canvasTarget);
    };
    imgObject.src = canvas.toDataURL();
  });
}

/**
 * Converts a data URL to ImageData.
 * @param {string} dataUrl - The data URL to convert.
 * @param {number} canvasWidth - The width of the canvas.
 * @param {number} canvasHeight - The height of the canvas.
 * @returns {Promise<ImageData>} A promise that resolves to the ImageData object.
 */
export async function convertDataUrlToImageData(
  dataUrl: string,
  canvasWidth: number,
  canvasHeight: number
): Promise<ImageData> {
  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d")!;

  const promise = new Promise<ImageData>((resolve) => {
    const image = new Image();
    image.src = dataUrl;
    image.onload = () => {
      const canvasAspectRatio = canvasWidth / canvasHeight;
      const imageAspectRatio = image.width / image.height;
      let imageWidth = 0;
      let imageHeight = 0;
      let dx = 0;
      let dy = 0;
      if (imageAspectRatio > canvasAspectRatio) {
        // image is wider than canvas
        imageWidth = canvasWidth;
        imageHeight = canvasWidth / imageAspectRatio;
        dx = 0;
        dy = (canvasHeight - imageHeight) / 2;
      } else {
        // image is taller than canvas
        imageWidth = canvasHeight * imageAspectRatio;
        imageHeight = canvasHeight;
        dx = (canvasWidth - imageWidth) / 2;
        dy = 0;
      }
      context.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        dx,
        dy,
        imageWidth,
        imageHeight
      );
      const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
      resolve(imageData);
    };
  });
  return promise;
}

/**
 * Below code is adapted from https://github.com/puffinsoft/jscanify/blob/master/src/jscanify.js
 */

/**
 * Calculates distance between two points. Each point must have `x` and `y` property.
 * @param {Point} p1 - Point 1.
 * @param {Point} p2 - Point 2.
 * @returns {number} Distance between two points.
 */
function distance(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Finds the contour of the paper within the image.
 * @param {cv.Mat} img - Image to process (cv.Mat).
 * @returns {cv.Mat | undefined} The biggest contour inside the image.
 */
export function findPaperContour(img: cv.Mat) {
  const imgGray = new cv.Mat();
  cv.cvtColor(img, imgGray, cv.COLOR_RGBA2GRAY);

  const imgBlur = new cv.Mat();
  cv.GaussianBlur(imgGray, imgBlur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

  const imgThresh = new cv.Mat();
  cv.threshold(imgBlur, imgThresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();

  cv.findContours(
    imgThresh,
    contours,
    hierarchy,
    cv.RETR_CCOMP,
    cv.CHAIN_APPROX_SIMPLE
  );
  let maxArea = 0;
  let maxContourIndex = -1;
  for (let i = 0; i < contours.size(); ++i) {
    let contourArea = cv.contourArea(contours.get(i));
    if (contourArea > maxArea) {
      maxArea = contourArea;
      maxContourIndex = i;
    }
  }

  const maxContour =
    maxContourIndex === -1 ? undefined : contours.get(maxContourIndex);

  imgGray.delete();
  imgBlur.delete();
  imgThresh.delete();
  contours.delete();
  hierarchy.delete();
  return maxContour;
}

/**
 * Highlights the paper detected inside the image.
 * @param {cv.Mat} imgMat - Image to process.
 * @param {CanvasRenderingContext2D} ctxCanvas - Canvas rendering context.
 * @param {Object} [options] - Options for highlighting.
 * @param {string} [options.color] - Color of the highlight.
 * @param {number} [options.thickness] - Thickness of the highlight.
 * @returns {void}
 */
export function highlightPaper(
  imgMat: cv.Mat,
  ctxCanvas: CanvasRenderingContext2D,
  options?: { color?: string; thickness?: number }
) {
  options = options || {};
  options.color = options.color || "orange";
  options.thickness = options.thickness || 10;

  const maxContour = findPaperContour(imgMat);
  if (maxContour) {
    const {
      topLeftCorner,
      topRightCorner,
      bottomLeftCorner,
      bottomRightCorner,
    } = getCornerPoints(maxContour);

    if (
      topLeftCorner &&
      topRightCorner &&
      bottomLeftCorner &&
      bottomRightCorner
    ) {
      ctxCanvas.strokeStyle = options.color;
      ctxCanvas.lineWidth = options.thickness;
      ctxCanvas.beginPath();
      ctxCanvas.moveTo(topLeftCorner.x, topLeftCorner.y);
      ctxCanvas.lineTo(topRightCorner.x, topRightCorner.y);
      ctxCanvas.lineTo(bottomRightCorner.x, bottomRightCorner.y);
      ctxCanvas.lineTo(bottomLeftCorner.x, bottomLeftCorner.y);
      ctxCanvas.lineTo(topLeftCorner.x, topLeftCorner.y);
      ctxCanvas.stroke();
    }
  }
}

/**
 * Extracts and undistorts the image detected within the frame.
 * @param {cv.Mat} matImg - Image to process.
 * @param {CornerPoints} cornerPoints - Corner points of the paper.
 * @returns {cv.Mat} The undistorted image.
 */
export function extractPaperByPerspectiveTransform(
  matImg: cv.Mat,
  cornerPoints: CornerPoints
) {
  const { topLeftCorner, topRightCorner, bottomLeftCorner, bottomRightCorner } =
    cornerPoints;
  let warpedDst = new cv.Mat();

  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    topLeftCorner.x,
    topLeftCorner.y,
    topRightCorner.x,
    topRightCorner.y,
    bottomRightCorner.x,
    bottomRightCorner.y,
    bottomLeftCorner.x,
    bottomLeftCorner.y,
  ]);

  const widthA = Math.sqrt(
    (bottomRightCorner.x - bottomLeftCorner.x) ** 2 +
      (bottomRightCorner.y - bottomLeftCorner.y) ** 2
  );
  const widthB = Math.sqrt(
    (topRightCorner.x - topLeftCorner.x) ** 2 +
      (topRightCorner.y - topLeftCorner.y) ** 2
  );
  const maxWidth = Math.max(widthA, widthB);

  const heightA = Math.sqrt(
    (topRightCorner.x - bottomRightCorner.x) ** 2 +
      (topRightCorner.y - bottomRightCorner.y) ** 2
  );
  const heightB = Math.sqrt(
    (topLeftCorner.x - bottomLeftCorner.x) ** 2 +
      (topLeftCorner.y - bottomLeftCorner.y) ** 2
  );
  const maxHeight = Math.max(heightA, heightB);

  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0,
    0,
    maxWidth - 1,
    0,
    maxWidth - 1,
    maxHeight - 1,
    0,
    maxHeight - 1,
  ]);

  let dsize = new cv.Size(maxWidth - 1, maxHeight - 1);

  let M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(
    matImg,
    warpedDst,
    M,
    dsize,
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
    new cv.Scalar()
  );

  return warpedDst;
}

/**
 * Calculates the corner points of a contour.
 * @param {cv.Mat} contour - Contour from {@link findPaperContour}.
 * @returns {CornerPoints} Object with properties `topLeftCorner`, `topRightCorner`, `bottomLeftCorner`, `bottomRightCorner`, each with `x` and `y` property.
 */
export function getCornerPoints(contour: cv.Mat): CornerPoints {
  let rect = cv.minAreaRect(contour);
  const center = rect.center;

  let topLeftCorner: Point = { x: 0, y: 0 };
  let topLeftCornerDist = 0;

  let topRightCorner: Point = { x: 0, y: 0 };
  let topRightCornerDist = 0;

  let bottomLeftCorner: Point = { x: 0, y: 0 };
  let bottomLeftCornerDist = 0;

  let bottomRightCorner: Point = { x: 0, y: 0 };
  let bottomRightCornerDist = 0;

  for (let i = 0; i < contour.data32S.length; i += 2) {
    const point = { x: contour.data32S[i], y: contour.data32S[i + 1] };
    const dist = distance(point, center);
    if (point.x < center.x && point.y < center.y) {
      if (dist > topLeftCornerDist) {
        topLeftCorner = point;
        topLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y < center.y) {
      if (dist > topRightCornerDist) {
        topRightCorner = point;
        topRightCornerDist = dist;
      }
    } else if (point.x < center.x && point.y > center.y) {
      if (dist > bottomLeftCornerDist) {
        bottomLeftCorner = point;
        bottomLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y > center.y) {
      if (dist > bottomRightCornerDist) {
        bottomRightCorner = point;
        bottomRightCornerDist = dist;
      }
    }
  }

  return {
    topLeftCorner,
    topRightCorner,
    bottomLeftCorner,
    bottomRightCorner,
  };
}
