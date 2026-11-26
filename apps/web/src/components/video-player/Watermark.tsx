'use client';

/** Moving semi-transparent overlay with the viewer's identity. */
export function Watermark({ text }: { text: string }) {
  return <div aria-hidden className="pointer-events-none absolute inset-0 select-none">{text}</div>;
}
