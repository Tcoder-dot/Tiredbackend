import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface HeroWaterRippleRef {
  triggerRipple: (x?: number, y?: number, strength?: number, radius?: number) => void;
}

interface HeroWaterRippleProps {
  imageSrc: string;
  className?: string;
}

export const HeroWaterRipple = forwardRef<HeroWaterRippleRef, HeroWaterRippleProps>(({ imageSrc, className }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rippleEngineRef = useRef<{
    trigger: (x?: number, y?: number, strength?: number, radius?: number) => void;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    triggerRipple: (x, y, strength, radius) => {
      if (rippleEngineRef.current) {
        rippleEngineRef.current.trigger(x, y, strength, radius);
      }
    }
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationFrameId: number;
    let isDestroyed = false;

    // Load background image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      if (isDestroyed || !canvas) return;

      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      let width = Math.max(1, Math.floor(canvas.parentElement?.clientWidth || window.innerWidth || 300));
      let height = Math.max(1, Math.floor(canvas.parentElement?.clientHeight || window.innerHeight || 300));

      if (width <= 0 || height <= 0) return;

      // Downsampled grid for 60FPS fluid physics performance
      const scale = 2; // grid resolution divider
      const cols = Math.floor(width / scale);
      const rows = Math.floor(height / scale);

      if (cols < 3 || rows < 3) return;

      const size = cols * rows;

      let buf1 = new Float32Array(size);
      let buf2 = new Float32Array(size);

      // Source image canvas
      const imgCanvas = document.createElement('canvas');
      imgCanvas.width = width;
      imgCanvas.height = height;
      const imgCtx = imgCanvas.getContext('2d');
      if (!imgCtx) return;

      // Draw background image scaled cover
      const drawCover = (): boolean => {
        const parentW = canvas.parentElement?.clientWidth;
        const parentH = canvas.parentElement?.clientHeight;

        width = Math.max(1, Math.floor(parentW || window.innerWidth || 300));
        height = Math.max(1, Math.floor(parentH || window.innerHeight || 300));

        if (width < 1 || height < 1) return false;

        canvas.width = width;
        canvas.height = height;
        imgCanvas.width = width;
        imgCanvas.height = height;

        const imgRatio = (img.width && img.height) ? (img.width / img.height) : 1;
        const canvasRatio = width / height;
        let renderW = width;
        let renderH = height;
        let offsetX = 0;
        let offsetY = 0;

        if (canvasRatio > imgRatio) {
          renderH = width / imgRatio;
          offsetY = (height - renderH) / 2;
        } else {
          renderW = height * imgRatio;
          offsetX = (width - renderW) / 2;
        }

        imgCtx.drawImage(img, offsetX, offsetY, renderW, renderH);

        // Apply dark plum brand overlay directly to base texture
        imgCtx.fillStyle = 'rgba(59, 26, 92, 0.65)';
        imgCtx.fillRect(0, 0, width, height);
        return true;
      };

      if (!drawCover()) return;

      let sourceData: ImageData | null = null;
      let targetData: ImageData | null = null;

      try {
        if (width >= 1 && height >= 1) {
          sourceData = imgCtx.getImageData(0, 0, width, height);
          targetData = ctx.createImageData(width, height);
        }
      } catch (e) {
        console.warn('HeroWaterRipple getImageData exception handled:', e);
        return;
      }

      if (!sourceData || !targetData) return;

      const handleResize = () => {
        if (!canvas || isDestroyed) return;
        if (!drawCover()) return;
        try {
          if (width >= 1 && height >= 1) {
            sourceData = imgCtx.getImageData(0, 0, width, height);
            targetData = ctx.createImageData(width, height);
          }
        } catch (e) {
          console.warn('HeroWaterRipple resize getImageData exception handled:', e);
        }
      };

      window.addEventListener('resize', handleResize);

      // Function to drop a disturbance
      const drop = (dropX?: number, dropY?: number, strength = 450, radius = 5) => {
        const cx = dropX !== undefined ? Math.floor(dropX / scale) : Math.floor(cols / 2);
        const cy = dropY !== undefined ? Math.floor(dropY / scale) : Math.floor(rows / 2);

        for (let j = -radius; j <= radius; j++) {
          for (let i = -radius; i <= radius; i++) {
            const rx = cx + i;
            const ry = cy + j;
            if (rx > 1 && rx < cols - 1 && ry > 1 && ry < rows - 1) {
              const dist = Math.sqrt(i * i + j * j);
              if (dist <= radius) {
                const index = ry * cols + rx;
                buf1[index] += strength * (1 - dist / radius);
              }
            }
          }
        }
      };

      rippleEngineRef.current = {
        trigger: (x, y, strength, radius) => {
          drop(x, y, strength, radius);
        }
      };

      // Trigger initial organic load ripple after a brief 150ms delay
      setTimeout(() => {
        if (!isDestroyed) {
          drop(width * 0.5, height * 0.45, 600, 7);
        }
      }, 150);

      // Physics loop
      let activeFrames = 0;
      const dampening = 0.962;

      const render = () => {
        if (isDestroyed || !sourceData || !targetData) return;

        // Wave propagation
        let isWaveActive = false;
        for (let y = 1; y < rows - 1; y++) {
          const yCols = y * cols;
          for (let x = 1; x < cols - 1; x++) {
            const idx = yCols + x;
            const val =
              (buf1[idx - 1] +
                buf1[idx + 1] +
                buf1[idx - cols] +
                buf1[idx + cols]) / 2 - buf2[idx];

            const updated = val * dampening;
            buf2[idx] = updated;

            if (Math.abs(updated) > 0.05) {
              isWaveActive = true;
            }
          }
        }

        // Swap height buffers
        const temp = buf1;
        buf1 = buf2;
        buf2 = temp;

        if (isWaveActive || activeFrames < 90) {
          activeFrames++;

          const srcPixels = sourceData.data;
          const dstPixels = targetData.data;

          // Render refraction distortion
          for (let y = 0; y < height; y++) {
            const gy = Math.min(rows - 2, Math.max(1, Math.floor(y / scale)));
            const gyCols = gy * cols;

            for (let x = 0; x < width; x++) {
              const gx = Math.min(cols - 2, Math.max(1, Math.floor(x / scale)));
              const gIdx = gyCols + gx;

              // Compute refraction displacement gradient
              const xSlope = buf1[gIdx + 1] - buf1[gIdx - 1];
              const ySlope = buf1[gIdx + cols] - buf1[gIdx - cols];

              let xDisplace = Math.round(x + xSlope * 0.22);
              let yDisplace = Math.round(y + ySlope * 0.22);

              // Clamp inside image boundaries
              xDisplace = Math.max(0, Math.min(width - 1, xDisplace));
              yDisplace = Math.max(0, Math.min(height - 1, yDisplace));

              const srcIdx = (yDisplace * width + xDisplace) * 4;
              const dstIdx = (y * width + x) * 4;

              if (srcIdx >= 0 && srcIdx < srcPixels.length && dstIdx >= 0 && dstIdx < dstPixels.length) {
                // Refracted color
                let r = srcPixels[srcIdx];
                let g = srcPixels[srcIdx + 1];
                let b = srcPixels[srcIdx + 2];
                const a = srcPixels[srcIdx + 3];

                // Add Muted Gold #E8B923 (RGB: 232, 185, 35) & Plum refraction highlights
                const highlight = (xSlope + ySlope) * 0.45;
                if (highlight > 1) {
                  r = Math.min(255, r + highlight * 1.2);
                  g = Math.min(255, g + highlight * 0.95);
                  b = Math.min(255, b + highlight * 0.2);
                } else if (highlight < -1) {
                  r = Math.min(255, r - highlight * 0.3);
                  b = Math.min(255, b - highlight * 0.6);
                }

                dstPixels[dstIdx] = r;
                dstPixels[dstIdx + 1] = g;
                dstPixels[dstIdx + 2] = b;
                dstPixels[dstIdx + 3] = a;
              }
            }
          }

          try {
            ctx.putImageData(targetData, 0, 0);
          } catch (e) {
            console.warn('HeroWaterRipple putImageData exception handled:', e);
          }
        }

        animationFrameId = requestAnimationFrame(render);
      };

      render();

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    return () => {
      isDestroyed = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [imageSrc]);

  return (
    <canvas
      id="hero-ripple-canvas"
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full object-cover z-0 ${className || ''}`}
    />
  );
});

HeroWaterRipple.displayName = 'HeroWaterRipple';
