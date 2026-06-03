import {useFrameProcessor} from 'react-native-vision-camera';
import {useSharedValue} from 'react-native-worklets-core';

export type FrameResult = {
  hasFrame: boolean;
  pixels128: Uint8Array;  // 128x128x3 for blazeface + mobilefacenet
  pixels224: Uint8Array;  // 224x224x3 for liveness
};

export function useFaceFrameProcessor(isActive: boolean) {
  const frameReady = useSharedValue(false);
  const rawPixels = useSharedValue<Uint8Array>(new Uint8Array(0));

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    if (!isActive || frame.width === 0) return;
    // Mark frame as available — JS thread picks it up via useEffect
    frameReady.value = true;
  }, [isActive]);

  return {frameProcessor, frameReady, rawPixels};
}
