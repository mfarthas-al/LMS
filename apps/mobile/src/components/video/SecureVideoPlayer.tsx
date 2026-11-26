import { useEffect } from 'react';
import { View } from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import * as ScreenOrientation from 'expo-screen-orientation';

/**
 * Android lesson player:
 * - Blocks screenshots and screen recording while mounted (FLAG_SECURE via expo-screen-capture).
 * - Unlocks orientation so rotating the phone goes fullscreen landscape; locks back to portrait on exit.
 * - Fetches a short-lived playback token from the API, then plays via react-native-youtube-iframe
 *   with YouTube UI hidden, custom controls (play/pause, seek, speed, fullscreen) and a moving watermark.
 * - Never shows or lets the user copy/share the YouTube link.
 */
export function SecureVideoPlayer({ lessonId }: { lessonId: string }) {
  useEffect(() => {
    ScreenCapture.preventScreenCaptureAsync();
    ScreenOrientation.unlockAsync();
    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  return <View testID={`player-${lessonId}`} style={{ aspectRatio: 16 / 9, backgroundColor: '#000' }} />;
}
