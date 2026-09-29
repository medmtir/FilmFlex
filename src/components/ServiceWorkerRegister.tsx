"use client";

import { useEffect } from "react";
import { initPerformanceMonitor } from "@/lib/performance";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Initialize performance monitoring
    initPerformanceMonitor();

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return null;
}