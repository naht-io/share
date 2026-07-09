import { type PaperShaderElement } from "@paper-design/shaders-react";
import { useEffect, useRef } from "react";

/**
 * Drives a paper-design shader's animation manually at a capped frame rate.
 *
 * The library defaults are expensive for a fullscreen background: the canvas
 * renders at 2x device resolution and repaints on every animation frame. We
 * drive the animation ourselves at a low frame rate via `setFrame` instead of
 * the library's uncapped rAF loop (pass `speed={0}` to disable it entirely).
 *
 * @example
 * function BackgroundDither() {
 *   const shaderRef = useShaderFrame({ fps: 10, speed: 0.5 });
 *   return <Dithering ref={shaderRef} speed={0} />;
 * }
 */
export function useShaderFrame({ fps, speed }: { fps: number; speed: number }) {
  const shaderRef = useRef<PaperShaderElement>(null);
  const frameMs = 1000 / fps;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId: number;
    let frame = 0;
    let last = performance.now();
    function tick(now: number) {
      rafId = requestAnimationFrame(tick);
      if (now - last < frameMs) return;
      // Clamp dt so a hidden tab resumes where it left off instead of jumping
      frame += speed * Math.min(now - last, 2 * frameMs);
      last = now;
      shaderRef.current?.paperShaderMount?.setFrame(frame);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [frameMs, speed]);

  return shaderRef;
}
