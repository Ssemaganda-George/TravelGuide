'use client';
import React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useDialog } from '@/components/DialogContext';
import QuickEnquiryDialog from '@/components/QuickEnquiryDialog';
import { trackEvent, currentChannel, isInternalDevice } from '@/lib/track';

export default function StickyCta() {
  const pathname = usePathname();

  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const { isOpen, open } = useDialog();
  // Intersection observer for form visibility
  useEffect(() => {
    if (!formRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      setFormVisible(entry.isIntersecting);
    }, { threshold: 0.5 });
    observer.observe(formRef.current);
    return () => observer.disconnect();
  }, []);

  // Detect keyboard open (focus)
  useEffect(() => {
    const handleFocus = () => setIsKeyboardOpen(true);
    const handleBlur = () => setIsKeyboardOpen(false);
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(el => {
      el.addEventListener('focus', handleFocus);
      el.addEventListener('blur', handleBlur);
    });
    return () => {
      inputs.forEach(el => {
        el.removeEventListener('focus', handleFocus);
        el.removeEventListener('blur', handleBlur);
      });
    };
  }, []);

  // Sync local showDialog with context isOpen
  useEffect(() => {
    setShowDialog(isOpen);
  }, [isOpen]);

  const channel = currentChannel();
  const internal = isInternalDevice();

  // Hide sticky bar on admin pages
  if (pathname.startsWith('/admin')) return null;

  const handlePlanClick = () => {
    trackEvent({ type: "plan_click", label: "sticky_bar", path: pathname, channel, internal });
    if (pathname === '/plan' || pathname.startsWith('/plan/')) {
      router.push(pathname, { scroll: true });
      formRef.current?.querySelector('input')?.focus();
    } else {
      open();
    }
  };

  return (
    <div
      ref={barRef}
      className="sticky-cta"
      style={{ pointerEvents: isKeyboardOpen || formVisible ? 'none' : 'auto' }}
    >
      <Button onClick={handlePlanClick} className="text-yellow-600">
        <Target className="h-5 w-5 mr-2" /> Plan my trip
      </Button>
      {showDialog && (
        <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <QuickEnquiryDialog />
        </React.Suspense>
      )}
    </div>
  );
}
