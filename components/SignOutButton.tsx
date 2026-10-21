"use client";
import { useState } from "react";

export function SignOutButton({ action }: { action: (fd: FormData) => Promise<void> }) {
  return (
    <form action={action} style={{ marginTop: 12 }}>
      <button
        className="go"
        style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
        type="button"
        onClick={e => {
          e.preventDefault();
          if (confirm("Are you sure you want to sign out?")) {
            e.currentTarget.closest('form')?.requestSubmit();
          }
        }}
      >
        Sign out
      </button>
    </form>
  );
}