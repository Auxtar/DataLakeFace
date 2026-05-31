import { loadTensorflowModel, TensorflowModel } from 'react-native-nitro-tflite';

let faceDetector: TensorflowModel | null = null;
let livenessModel: TensorflowModel | null = null;
let faceRecogniser: TensorflowModel | null = null;

export async function loadModels() {
  try {
    console.log('[TFLite] Loading blazeface...');
    faceDetector = await loadTensorflowModel(require('../assets/blazeface.tflite'));
    console.log('[TFLite] blazeface loaded');
  } catch (e) {
    console.error('[TFLite] blazeface failed:', e);
  }

  try {
    console.log('[TFLite] Loading mobilefacenet...');
    faceRecogniser = await loadTensorflowModel(require('../assets/mobilefacenet.tflite'), 'default', (p) => console.log('[TFLite] facenet progress:', p));
    console.log('[TFLite] mobilefacenet loaded');
  } catch (e) {
    console.error('[TFLite] mobilefacenet failed:', e);
  }

  try {
    console.log('[TFLite] Loading liveness...');
    livenessModel = await loadTensorflowModel(require('../assets/liveness.tflite'));
    console.log('[TFLite] liveness loaded');
  } catch (e) {
    console.error('[TFLite] liveness failed:', e);
  }

  console.log('[TFLite] face:', !!faceDetector, 'liveness:', !!livenessModel, 'recog:', !!faceRecogniser);
  return true;
}

export function isLive(inputData: Float32Array): boolean {
  if (!livenessModel) return true;
  try {
    const output = livenessModel.runSync([inputData]);
    const scores = output[0] as Float32Array;
    return scores[0] > scores[1];
  } catch (e) {
    return true;
  }
}

export function getFaceEmbedding(inputData: Float32Array): number[] {
  if (!faceRecogniser) return [];
  try {
    const output = faceRecogniser.runSync([inputData]);
    return Array.from(output[0] as Float32Array);
  } catch (e) {
    return [];
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

export const RECOGNITION_THRESHOLD = 0.6;
export function areModelsLoaded() {
  return faceDetector !== null || faceRecogniser !== null;
}
