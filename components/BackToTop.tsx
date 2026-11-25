"use client";

import { useEffect, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const halfway = (document.documentElement.scrollHeight - window.innerHeight) / 2;
      setVisible(window.scrollY >= halfway);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      id="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: 24,
        right: 84,
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: "var(--lake)",
        color: "white",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "1.25rem",
        lineHeight: 1,
        zIndex: 1000,
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
        touchAction: "manipulation",
      }}
    >
      ▲
    </button>
  );
}
