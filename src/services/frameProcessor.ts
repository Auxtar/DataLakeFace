import { useFrameProcessor } from 'react-native-vision-camera';
import { useSharedValue } from 'react-native-worklets-core';

export function useFaceFrameProcessor(isActive: boolean) {
  const faceDetected = useSharedValue(false);

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isActive) return;
    // TFLite inference will be wired here in next step
    // For now just mark face as detected when frame is received
    faceDetected.value = frame.width > 0;
  }, [isActive]);

  return { frameProcessor, faceDetected };
}
