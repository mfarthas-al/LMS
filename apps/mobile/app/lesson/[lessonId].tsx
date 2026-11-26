import { useLocalSearchParams } from 'expo-router';
import { SecureVideoPlayer } from '@/components/video/SecureVideoPlayer';

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  return <SecureVideoPlayer lessonId={lessonId} />;
}
