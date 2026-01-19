// src/components/useZoomPan.ts
import { useState } from "react";

export default function useZoomPan() {
  const [scale, setScale] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const onWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    setScale((s) => Math.min(2, Math.max(0.5, s - e.deltaY * 0.001)));
  };

  const onMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const startX = e.clientX - offset.x;
    const startY = e.clientY - offset.y;

    const move = (ev: MouseEvent) => {
      setOffset({
        x: ev.clientX - startX,
        y: ev.clientY - startY,
      });
    };

    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return { scale, offset, onWheel, onMouseDown };
}
