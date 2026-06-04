import {loadTensorflowModel, TensorflowModel} from 'react-native-nitro-tflite';

let faceDetector: TensorflowModel | null = null;
let livenessModel: TensorflowModel | null = null;
let faceRecogniser: TensorflowModel | null = null;

export async function loadModels(): Promise<boolean> {
  try {
    faceDetector = await loadTensorflowModel(require('../assets/blazeface.tflite'));
    console.log('[TFLite] blazeface loaded');
  } catch (e) {
    console.error('[TFLite] blazeface failed:', e);
  }
  try {
    faceRecogniser = await loadTensorflowModel(
      require('../assets/mobilefacenet.tflite'),
      'default',
      (p: number) => console.log('[TFLite] facenet:', p),
    );
    console.log('[TFLite] mobilefacenet loaded');
  } catch (e) {
    console.error('[TFLite] mobilefacenet failed:', e);
  }
  try {
    livenessModel = await loadTensorflowModel(require('../assets/liveness.tflite'));
    console.log('[TFLite] liveness loaded');
  } catch (e) {
    console.error('[TFLite] liveness failed:', e);
  }
  const ok = !!faceDetector && !!faceRecogniser && !!livenessModel;
  console.log('[TFLite] all loaded:', ok);
  return ok;
}

export function areModelsLoaded(): boolean {
  return !!faceDetector && !!faceRecogniser && !!livenessModel;
}

function normaliseFaceNet(pixels: Uint8Array, w: number, h: number): Float32Array {
  if (pixels.length !== w * h * 3) {
    console.error('[normaliseFaceNet] size mismatch', pixels.length, 'expected', w * h * 3);
    return new Float32Array(0);
  }
  const out = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    out[i * 3 + 0] = (pixels[i * 3 + 0] / 127.5) - 1.0;
    out[i * 3 + 1] = (pixels[i * 3 + 1] / 127.5) - 1.0;
    out[i * 3 + 2] = (pixels[i * 3 + 2] / 127.5) - 1.0;
  }
  return out;
}

function normaliseLiveness(pixels: Uint8Array, w: number, h: number): Float32Array {
  const out = new Float32Array(w * h * 3);
  for (let i = 0; i < w * h; i++) {
    out[i * 3 + 0] = pixels[i * 3 + 0] / 255.0;
    out[i * 3 + 1] = pixels[i * 3 + 1] / 255.0;
    out[i * 3 + 2] = pixels[i * 3 + 2] / 255.0;
  }
  return out;
}

export function getFaceEmbedding(pixels: Uint8Array): number[] {
  if (!faceRecogniser) return [];
  try {
    const input = normaliseFaceNet(pixels, 112, 112);
    if (input.length === 0) return [];
    const output = faceRecogniser.runSync([input]);
    return Array.from(output[0] as Float32Array);
  } catch (e) {
    console.error('[getFaceEmbedding]', e);
    return [];
  }
}

export function isLive(pixels: Uint8Array): boolean {
  if (!livenessModel) return true;
  try {
    const input = normaliseLiveness(pixels, 224, 224);
    const output = livenessModel.runSync([input]);
    const scores = output[0] as Float32Array;
    console.log('[liveness] live:', scores[0].toFixed(3), 'spoof:', scores[1].toFixed(3));
    return scores[0] >= scores[1];
  } catch (e) {
    console.error('[isLive]', e);
    return true;
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export const RECOGNITION_THRESHOLD = 0.72;
export const MIN_SCORE_GAP = 0.03;

export function findBestMatch(
  queryEmbedding: number[],
  enrollments: {employee_id: string; name: string; face_vector: string}[],
): {employee_id: string; name: string; score: number} | null {
  if (queryEmbedding.length === 0 || enrollments.length === 0) return null;

  let best: {employee_id: string; name: string; score: number} | null = null;
  let secondScore = -1;

  for (const row of enrollments) {
    let stored: number[];
    try {
      stored = JSON.parse(row.face_vector);
    } catch {
      continue;
    }
    if (stored.length !== queryEmbedding.length) {
      console.warn('[match] vector length mismatch:', stored.length, 'vs', queryEmbedding.length);
      continue;
    }
    const score = cosineSimilarity(queryEmbedding, stored);
    if (!best || score > best.score) {
      secondScore = best ? best.score : -1;
      best = {employee_id: row.employee_id, name: row.name, score};
    } else if (score > secondScore) {
      secondScore = score;
    }
  }

  if (!best) return null;
  console.log('[match] best candidate:', best.employee_id, best.name, 'score:', best.score.toFixed(3));
  if (best.score < RECOGNITION_THRESHOLD) {
    console.log('[match] rejected — score too low:', best.score.toFixed(3));
    return null;
  }
  if (secondScore > 0 && (best.score - secondScore) < MIN_SCORE_GAP) {
    console.log('[match] rejected — ambiguous match, gap:', (best.score - secondScore).toFixed(3));
    return null;
  }

  return best;
}

let blazeAnchors: number[][] | null = null;

function generateBlazeAnchors(): number[][] {
  const anchors: number[][] = [];
  const strides = [8, 16, 16, 16];
  const inputSize = 128;
  const offset = 0.5;
  let layerId = 0;
  while (layerId < strides.length) {
    let last = layerId;
    let perLocation = 0;
    while (last < strides.length && strides[last] === strides[layerId]) {
      perLocation += 2;
      last++;
    }
    const fmSize = Math.ceil(inputSize / strides[layerId]);
    for (let y = 0; y < fmSize; y++) {
      for (let x = 0; x < fmSize; x++) {
        for (let a = 0; a < perLocation; a++) {
          anchors.push([(x + offset) / fmSize, (y + offset) / fmSize]);
        }
      }
    }
    layerId = last;
  }
  return anchors;
}

export function detectFace(pixels: Uint8Array): [number, number, number, number] | null {
  if (!faceDetector) return null;
  try {
    if (!blazeAnchors) blazeAnchors = generateBlazeAnchors();
    const input = normaliseFaceNet(pixels, 128, 128);
    if (input.length === 0) return null;
    const output = faceDetector.runSync([input]);
    const regressors = output[0] as Float32Array;
    const scores = output[1] as Float32Array;

    let bestIdx = -1;
    let bestLogit = -Infinity;
    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > bestLogit) {
        bestLogit = scores[i];
        bestIdx = i;
      }
    }
    if (bestIdx < 0) return null;

    const clipped = Math.max(-100, Math.min(100, bestLogit));
    const confidence = 1 / (1 + Math.exp(-clipped));
    console.log('[detectFace] best score:', confidence.toFixed(3), 'idx:', bestIdx);
    if (confidence < 0.5) return null;

    const anchor = blazeAnchors[bestIdx];
    const o = bestIdx * 16;
    const xCenter = regressors[o + 0] / 128 + anchor[0];
    const yCenter = regressors[o + 1] / 128 + anchor[1];
    const w = regressors[o + 2] / 128;
    const h = regressors[o + 3] / 128;

    const x1 = Math.max(0, xCenter - w / 2);
    const y1 = Math.max(0, yCenter - h / 2);
    const x2 = Math.min(1, xCenter + w / 2);
    const y2 = Math.min(1, yCenter + h / 2);
    return [x1, y1, x2, y2];
  } catch (e) {
    console.error('[detectFace]', e);
    return null;
  }
}

export function debugBlazeFace(pixels: Uint8Array): void {
  if (!faceDetector) { console.log('[debug] no faceDetector'); return; }
  try {
    const input = normaliseFaceNet(pixels, 128, 128);
    const output = faceDetector.runSync([input]);
    console.log('[debug] output length:', output.length);
    for (let i = 0; i < output.length; i++) {
      const arr = output[i] as Float32Array;
      console.log('[debug] output[' + i + '] length:', arr.length, 'first5:', Array.from(arr.slice(0,5)));
    }
  } catch(e) { console.error('[debug]', e); }
}
