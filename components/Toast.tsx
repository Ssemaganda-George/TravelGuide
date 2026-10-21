"use client";
import { useState, useEffect } from "react";

type Toast = { id: number; message: string; type?: "success" | "error" | "info" };

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const hideToast = (id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toasts.length]);

  return { toasts, showToast, hideToast };
}

export function ToastContainer() {
  const { toasts, hideToast } = useToast();
  return (
    <div className="toast-container" style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      pointerEvents: "none"
    }}>
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{
          pointerEvents: "auto",
          padding: "14px 20px",
          borderRadius: 10,
          background: t.type === "error" ? "#b91c1c" : t.type === "success" ? "#166534" : "#1e40af",
          color: "#fff",
          boxShadow: "0 8px 24px rgba(0,0,0,.15)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          minWidth: 280,
          maxWidth: 420,
          animation: "slideIn 0.3s ease"
        }}>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => hideToast(t.id)} style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "18px",
            cursor: "pointer",
            opacity: 0.8,
            lineHeight: 1,
            padding: 0
          }}>✕</button>
        </div>
      ))}
    </div>
  );
}