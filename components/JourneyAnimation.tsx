"use client";

import { useEffect, useRef } from "react";
import planeImg from "@/logo/plane.png";

const ROUTE = "M -150 350 C 100 250 200 200 300 120 C 400 50 480 60 500 80 C 580 120 640 140 680 160 C 800 220 900 0 1050 -50";

export default function JourneyAnimation() {
  const svgRef = useRef<SVGSVGElement>(null);
  const planeRef = useRef<SVGGElement>(null);
  const carRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const plane = planeRef.current!;
    const car = carRef.current!;
    if (!svg) return;

    const pathEl = svg.querySelector(".route-line");
    if (!pathEl) return;
    const path = pathEl as SVGPathElement;
    const totalLength = path.getTotalLength();

    const DURATION = 9000;
    const startTime = performance.now();
    let rafId: number;

    function frame(t: number) {
      const elapsed = ((t - startTime) / DURATION) % 1;

      // Plane leg: A(0) -> C(0.56), visible 0% -> 60% of cycle
      let planeT = 0;
      let planeOpacity = 0;
      if (elapsed < 0.02) {
        planeT = 0;
        planeOpacity = elapsed / 0.02;
      } else if (elapsed < 0.55) {
        planeT = ((elapsed - 0.02) / 0.53) * 0.56;
        planeOpacity = 1;
      } else if (elapsed < 0.60) {
        planeT = 0.56;
        planeOpacity = (0.60 - elapsed) / 0.05;
      } else {
        planeT = 0;
        planeOpacity = 0;
      }

      // Car leg: C(0.56) -> F(1.0), visible 7% -> 100% of cycle
      let carT = 0.56;
      let carOpacity = 0;
      if (elapsed >= 0.07 && elapsed < 1.0) {
        carT = 0.56 + ((elapsed - 0.07) / 0.93) * 0.44;
        carOpacity = 1;
      }

      const eps = 0.001;

      const p1 = path.getPointAtLength(planeT * totalLength);
      const p1n = path.getPointAtLength(Math.min((planeT + eps) * totalLength, totalLength));
      const a1 = Math.atan2(p1n.y - p1.y, p1n.x - p1.x) * (180 / Math.PI);

      const p2 = path.getPointAtLength(carT * totalLength);
      const p2n = path.getPointAtLength(Math.min((carT + eps) * totalLength, totalLength));
      const a2 = Math.atan2(p2n.y - p2.y, p2n.x - p2.x) * (180 / Math.PI);

      plane.setAttribute("transform", `translate(${p1.x},${p1.y}) rotate(${a1}) translate(-17,-17)`);
      car.setAttribute("transform", `translate(${p2.x},${p2.y}) rotate(${a2})`);
      plane.style.opacity = String(planeOpacity);
      car.style.opacity = String(carOpacity);

      rafId = requestAnimationFrame(frame);
    }

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <div className="hero-journey-wrap" aria-label="Sample animated journey across Uganda">
      <svg ref={svgRef} className="hero-journey-svg" viewBox="0 0 900 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path className="route-line" d={ROUTE} />
        <g className="stops">
          <circle className="stop stop-a" cx="-150" cy="350" r="8" />
          <text className="stop-label" x="-150" y="350">A</text>
          <circle className="stop stop-b" cx="300" cy="120" r="8" />
          <text className="stop-label" x="300" y="120">B</text>
          <circle className="stop stop-c" cx="500" cy="80" r="8" />
          <text className="stop-label" x="500" y="80">C</text>
          <circle className="stop stop-d" cx="680" cy="160" r="8" />
          <text className="stop-label" x="680" y="160">D</text>
          <circle className="stop stop-f" cx="1050" cy="-50" r="8" />
          <text className="stop-label" x="1050" y="-50">F</text>
        </g>
        <g ref={planeRef} className="vehicle vehicle-plane">
          <image href={planeImg.src} width="34" height="34" x="-17" y="-17" />
        </g>
        <g ref={carRef} className="vehicle vehicle-car">
          <g transform="scale(3)">
            <path d="M-8 0 L-6 -4 L6 -4 L8 0 L8 4 L-8 4 Z" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="-5" cy="4" r="1.5" fill="none" stroke="#fff" strokeWidth={2.5} />
            <circle cx="5" cy="4" r="1.5" fill="none" stroke="#fff" strokeWidth={2.5} />
          </g>
        </g>
      </svg>
    </div>
  );
}
