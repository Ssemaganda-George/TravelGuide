import { useState, useEffect } from 'react';

export function useInternalDevice() {
  const [internal, setInternal] = useState(() => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    const stored = localStorage.getItem('ti_internal');
    if (stored !== null) return stored === 'true';
    try {
      const url = new URL(window.location.href);
      const ip = url.searchParams.get('internal');
      if (ip === '1') {
        localStorage.setItem('ti_internal', 'true');
        return true;
      }
      if (ip === '0') {
        localStorage.setItem('ti_internal', 'false');
        return false;
      }
    } catch {}
    return false;
  });

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem('ti_internal', internal.toString());
  }, [internal]);

  return internal;
}