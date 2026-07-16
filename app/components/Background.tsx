import { Dithering } from "@paper-design/shaders-react";

import { useShaderFrame } from "../hooks/useShaderFrame";

export function BackgroundDither() {
  const shaderRef = useShaderFrame({ fps: 15, speed: -0.5 });

  return (
    <Dithering
      aria-hidden
      ref={shaderRef}
      className="fixed inset-0 -z-10 pointer-events-none opacity-30 dark:opacity-20 **:[image-rendering:pixelated]"
      colorBack="#00000000"
      colorFront="#777777aa"
      shape="swirl"
      type="8x8"
      size={4}
      speed={0}
      scale={1.5}
      minPixelRatio={1}
    />
  );
}
