"use client";
import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";

export function NotificationHandler({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!searchParams || !router) return;
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success) {
      showToast(success, "success");
      router.replace(window.location.pathname);
    }
    if (error) {
      showToast(error, "error");
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);

  return children;
}