import jpeg from 'jpeg-js';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import {detectFace, getFaceEmbedding} from '../services/inferenceService';

function cropRGB(src: Uint8Array, srcW: number, srcH: number, x1: number, y1: number, x2: number, y2: number, dstSize: number): Uint8Array {
  let cropX = Math.floor(x1 * srcW);
  let cropY = Math.floor(y1 * srcH);
  const cropW = Math.max(1, Math.floor((x2 - x1) * srcW));
  const cropH = Math.max(1, Math.floor((y2 - y1) * srcH));
  const side = Math.min(Math.max(cropW, cropH), srcW, srcH);
  cropX = cropX - Math.floor((side - cropW) / 2);
  cropY = cropY - Math.floor((side - cropH) / 2);
  if (cropX < 0) cropX = 0;
  if (cropY < 0) cropY = 0;
  if (cropX + side > srcW) cropX = srcW - side;
  if (cropY + side > srcH) cropY = srcH - side;
  const dst = new Uint8Array(dstSize * dstSize * 3);
  const ratio = side / dstSize;
  for (let y = 0; y < dstSize; y++) {
    for (let x = 0; x < dstSize; x++) {
      const srcX = Math.min(cropX + Math.floor(x * ratio), srcW - 1);
      const srcY = Math.min(cropY + Math.floor(y * ratio), srcH - 1);
      const srcIdx = (srcY * srcW + srcX) * 3;
      const dstIdx = (y * dstSize + x) * 3;
      dst[dstIdx + 0] = src[srcIdx + 0];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
    }
  }
  return dst;
}

function centerCropRGB(src: Uint8Array, srcW: number, srcH: number, cropPct: number, dstSize: number): Uint8Array {
  const margin = (1 - cropPct) / 2;
  return cropRGB(src, srcW, srcH, margin, margin, 1 - margin, 1 - margin, dstSize);
}

function letterboxSquare(src: Uint8Array, srcW: number, srcH: number): {rgb: Uint8Array; side: number} {
  const side = Math.max(srcW, srcH);
  const out = new Uint8Array(side * side * 3);
  const offX = Math.floor((side - srcW) / 2);
  const offY = Math.floor((side - srcH) / 2);
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const s = (y * srcW + x) * 3;
      const d = ((y + offY) * side + (x + offX)) * 3;
      out[d + 0] = src[s + 0];
      out[d + 1] = src[s + 1];
      out[d + 2] = src[s + 2];
    }
  }
  return {rgb: out, side};
}

async function decodeResizedJpeg(uri: string): Promise<{rgb: Uint8Array; w: number; h: number} | null> {
  try {
    const response = await fetch(uri);
    const buffer = await response.arrayBuffer();
    const raw = jpeg.decode(new Uint8Array(buffer), {useTArray: true, maxResolutionInMP: 5});
    const rgb = new Uint8Array(raw.width * raw.height * 3);
    for (let i = 0; i < raw.width * raw.height; i++) {
      rgb[i * 3 + 0] = raw.data[i * 4 + 0];
      rgb[i * 3 + 1] = raw.data[i * 4 + 1];
      rgb[i * 3 + 2] = raw.data[i * 4 + 2];
    }
    return {rgb, w: raw.width, h: raw.height};
  } catch (e) {
    console.error('[imageUtils] decode failed:', e);
    return null;
  }
}

export async function snapshotToPixels(
  filePath: string,
): Promise<{px112: Uint8Array; px224: Uint8Array} | null> {
  try {
    const uri = filePath.startsWith('file://') ? filePath : `file://${filePath}`;

    const resized = await ImageResizer.createResizedImage(uri, 320, 320, 'JPEG', 85, 0, undefined, undefined, {mode: 'cover'});
    const decoded = await decodeResizedJpeg(resized.uri);
    if (!decoded) return null;

    const {rgb: square, side} = letterboxSquare(decoded.rgb, decoded.w, decoded.h);
    const detectInput = cropRGB(square, side, side, 0, 0, 1, 1, 128);

    const bbox = detectFace(detectInput);
    console.log('[imageUtils] bbox:', bbox);

    let px112: Uint8Array;
    let px224: Uint8Array;

    if (bbox) {
      const pad = 0.10;
      const x1 = Math.max(0, bbox[0] - pad);
      const y1 = Math.max(0, bbox[1] - pad);
      const x2 = Math.min(1, bbox[2] + pad);
      const y2 = Math.min(1, bbox[3] + pad);
      px112 = cropRGB(square, side, side, x1, y1, x2, y2, 112);
      px224 = cropRGB(square, side, side, x1, y1, x2, y2, 224);
      console.log('[imageUtils] used BlazeFace crop');
    } else {
      px112 = centerCropRGB(square, side, side, 0.45, 112);
      px224 = centerCropRGB(square, side, side, 0.45, 224);
      console.log('[imageUtils] used center crop fallback');
    }

    return {px112, px224};
  } catch (e) {
    console.error('[imageUtils] failed:', e);
    return null;
  }
}
