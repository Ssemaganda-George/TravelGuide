"use client";

export default function BackToTop() {
  return (
    <button
      id="back-to-top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      title="Back to top"
      aria-label="Back to top"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: "var(--lake)",
        color: "white",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "1.5rem",
        lineHeight: 1,
        zIndex: 100,
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
        touchAction: "manipulation",
      }}
    >
      ▲
    </button>
  );
}
