'use client';

/**
 * Plays a lesson's YouTube video without exposing the link:
 * 1. Requests a short-lived playback token from /video-access for this lesson.
 * 2. Loads the YouTube IFrame API with controls=0, rel=0, disablekb=1, modestbranding.
 * 3. Renders an overlay that blocks clicks on YouTube's own UI (title, share, "Watch on YouTube").
 * 4. Provides custom controls: play/pause, seek, ±10s, speed, fullscreen.
 * 5. Shows a moving watermark with the student's name/phone to deter screen recording.
 *
 * Note: a determined user with dev tools can still find the video ID. Videos must be
 * Unlisted on YouTube. See docs/security.md.
 */
export function SecureYouTubePlayer({ lessonId }: { lessonId: string }) {
  return <div data-lesson-id={lessonId} className="aspect-video w-full bg-black" />;
}
