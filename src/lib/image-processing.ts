import cv from "@techstark/opencv-js";
import type { CornerPoints, Point } from "../store";

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

export function convertImageDataToCanvas(
  imageData: ImageData
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not supported");
  }
  canvas.setAttribute("id", "_temp_canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;

  context.putImageData(imageData, 0, 0);

  return canvas;
}

export async function convertDataUrlToImageData(
  dataUrl: string
): Promise<ImageData> {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is not supported");
  }

  const promise = new Promise<ImageData>((resolve) => {
    const image = new Image();
    image.src = dataUrl;
    image.onload = () => {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0);
      resolve(context.getImageData(0, 0, image.width, image.height));
    };
  });
  return promise;
}

/**
 * Calculates distance between two points. Each point must have `x` and `y` property
 * @param {*} p1 point 1
 * @param {*} p2 point 2
 * @returns distance between two points
 */
function distance(p1: Point, p2: Point) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

/**
 * Finds the contour of the paper within the image
 * @param {*} img image to process (cv.Mat)
 * @returns the biggest contour inside the image
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
 * @param {*} image image to process
 * @param {*} options options for highlighting. Accepts `color` and `thickness` parameter
 * @returns `HTMLCanvasElement` with original image and paper highlighted
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
 * @param {*} image image to process
 * @param {*} resultWidth desired result paper width
 * @param {*} resultHeight desired result paper height
 * @param {*} cornerPoints optional custom corner points, in case automatic corner points are incorrect
 * @returns `HTMLCanvasElement` containing undistorted image
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

  // compute the width of the new image, which will be the
  // maximum distance between bottom-right and bottom-left
  // x-coordiates or the top-right and top-left x-coordinates
  const widthA = Math.sqrt(
    (bottomRightCorner.x - bottomLeftCorner.x) ** 2 +
      (bottomRightCorner.y - bottomLeftCorner.y) ** 2
  );
  const widthB = Math.sqrt(
    (topRightCorner.x - topLeftCorner.x) ** 2 +
      (topRightCorner.y - topLeftCorner.y) ** 2
  );
  const maxWidth = Math.max(widthA, widthB);
  // compute the height of the new image, which will be the
  // maximum distance between the top-right and bottom-right
  // y-coordinates or the top-left and bottom-left y-coordinates
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
 * @param {*} contour contour from {@link findPaperContour}
 * @returns object with properties `topLeftCorner`, `topRightCorner`, `bottomLeftCorner`, `bottomRightCorner`, each with `x` and `y` property
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
      // top left
      if (dist > topLeftCornerDist) {
        topLeftCorner = point;
        topLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y < center.y) {
      // top right
      if (dist > topRightCornerDist) {
        topRightCorner = point;
        topRightCornerDist = dist;
      }
    } else if (point.x < center.x && point.y > center.y) {
      // bottom left
      if (dist > bottomLeftCornerDist) {
        bottomLeftCorner = point;
        bottomLeftCornerDist = dist;
      }
    } else if (point.x > center.x && point.y > center.y) {
      // bottom right
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
