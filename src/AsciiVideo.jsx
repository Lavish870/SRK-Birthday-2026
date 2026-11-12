
import { useEffect, useRef } from "react";

const ASCII_CHARS = "  .:-=+*#%@";

export default function AsciiVideo() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", {
      willReadFrequently: true
    });

    const COLS = 115;
    const CELL_W = 8;
    const CELL_H = 12;
    const FPS = 30;

    let animationId;
    let lastFrame = 0;
    let cancelled = false;

    function render(time) {
      animationId = requestAnimationFrame(render);

      if (time - lastFrame < 1000 / FPS) return;
      lastFrame = time;

      if (video.readyState < 2 || !video.videoWidth) return;

      // Crop black letterbox bars from source video.
      const sourceX = 0;
      const sourceY = Math.round(video.videoHeight * 0.055);
      const sourceW = video.videoWidth;
      const sourceH = Math.round(video.videoHeight * 0.89);

      const rows = Math.round(
        COLS * (CELL_W / CELL_H) * (sourceH / sourceW)
      );

      if (canvas.width !== COLS * CELL_W ||
          canvas.height !== rows * CELL_H) {
        canvas.width = COLS * CELL_W;
        canvas.height = rows * CELL_H;

        offscreen.width = COLS;
        offscreen.height = rows;
      }

      offCtx.drawImage(
        video,
        sourceX, sourceY, sourceW, sourceH,
        0, 0, COLS, rows
      );

      const image = offCtx.getImageData(
        0, 0, COLS, rows
      );

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = "10px monospace";
      ctx.textBaseline = "top";

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < COLS; x++) {
          const i = (y * COLS + x) * 4;

          const r = image.data[i];
          const g = image.data[i + 1];
          const b = image.data[i + 2];

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;

          // Suppress the highly saturated cyan sky.
          const isSky = b > 125 && g > 115 && b > r * 1.08 && saturation > 0.25;

          if (isSky) continue;

          // Invert brightness: dark SRK clothing becomes dense.
          const brightness = (
            0.299 * r + 0.587 * g + 0.114 * b
          ) / 255;

          let darkness = 1 - brightness;

          // Improve shadow and face detail.
          darkness = Math.pow(darkness, 0.75);

          if (darkness < 0.13) continue;

          const charIndex = Math.min(
            ASCII_CHARS.length - 1,
            Math.floor(darkness * (ASCII_CHARS.length - 1))
          );

          const character = ASCII_CHARS[charIndex];

          if (!character.trim()) continue;

          // Subtle green intensity variation.
          const intensity = Math.round(100 + darkness * 155);

          ctx.fillStyle = `rgb(0, ${intensity}, ${Math.round(intensity * 0.35)})`;
          ctx.fillText(character, x * CELL_W, y * CELL_H);
        }
      }
    }

    const startVideo = () => {
      if (!cancelled) {
        video.play().catch(err => {
          if (err.name !== "AbortError" && !cancelled) {
            console.error(err);
          }
        });
      }
    };

    video.addEventListener("canplay", startVideo);

    if (video.readyState >= 3) startVideo();

    animationId = requestAnimationFrame(render);

    return () => {
      cancelled = true;
      video.removeEventListener("canplay", startVideo);
      cancelAnimationFrame(animationId);
      video.pause();
    };
  }, []);

  return (
    <div className="ascii-video-container">
      <video
        ref={videoRef}
        src="/srk-motion.mp4"
        muted
        loop
        autoPlay
        playsInline
        preload="auto"
        style={{ display: "none" }}
      />

      <canvas
        ref={canvasRef}
        className="ascii-video"
      />
    </div>
  );
}
