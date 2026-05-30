import { loadTensorflowModel, TensorflowModel } from 'react-native-nitro-tflite';

let faceDetector: TensorflowModel | null = null;
let livenessModel: TensorflowModel | null = null;
let faceRecogniser: TensorflowModel | null = null;

export async function loadModels() {
  try {
    faceDetector = await loadTensorflowModel(
      require('../../android/app/src/main/assets/blazeface.tflite')
    );
    livenessModel = await loadTensorflowModel(
      require('../../android/app/src/main/assets/liveness.tflite')
    );
    faceRecogniser = await loadTensorflowModel(
      require('../../android/app/src/main/assets/mobilefacenet.tflite')
    );
    console.log('Models loaded successfully');
    return true;
  } catch (e) {
    console.error('Model load failed:', e);
    return false;
  }
}

export function isLive(inputData: Float32Array): boolean {
  if (!livenessModel) return false;
  const output = livenessModel.runSync([inputData]);
  const scores = output[0] as Float32Array;
  // scores[0] = real, scores[1] = spoof
  return scores[0] > scores[1];
}

export function getFaceEmbedding(inputData: Float32Array): number[] {
  if (!faceRecogniser) return [];
  const output = faceRecogniser.runSync([inputData]);
  return Array.from(output[0] as Float32Array);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dot / (magA * magB);
}

// threshold tuned for MobileFaceNet — above 0.6 = same person
export const RECOGNITION_THRESHOLD = 0.6;
