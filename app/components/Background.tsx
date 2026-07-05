import { Dithering, type PaperShaderElement } from "@paper-design/shaders-react";
import { useEffect, useRef } from "react";

// The library defaults are expensive for a fullscreen background: the canvas
// renders at 2x device resolution and repaints on every animation frame. We
// drive the animation ourselves at a low frame rate via setFrame instead of
// the library's uncapped rAF loop (speed={0} disables it entirely).
const FPS = 10;
const FRAME_MS = 1000 / FPS;
const SPEED = 1;

export function BackgroundDither() {
  const shaderRef = useRef<PaperShaderElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;
    let frame = 0;
    let last = performance.now();
    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      if (now - last < FRAME_MS) return;
      // Clamp dt so a hidden tab resumes where it left off instead of jumping
      frame += SPEED * Math.min(now - last, 2 * FRAME_MS);
      last = now;
      shaderRef.current?.paperShaderMount?.setFrame(frame);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <Dithering
      aria-hidden
      ref={shaderRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-20 **:[image-rendering:pixelated]"
      colorBack="#00000000"
      colorFront="#71717a"
      shape="simplex"
      type="8x8"
      size={2}
      speed={0}
      scale={2}
      minPixelRatio={1}
    />
  );
}
