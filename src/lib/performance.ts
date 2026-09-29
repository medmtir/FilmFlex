// Performance monitoring utilities for flixer.gd speed optimization

export interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
}

export class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private startTime: number = Date.now();

  constructor() {
    if (typeof window !== 'undefined') {
      this.startTime = performance.now();
      this.initObservers();
    }
  }

  private initObservers() {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries[0] as PerformanceEntry;
          this.metrics.firstContentfulPaint = fcp.startTime;
        });
        fcpObserver.observe({ type: 'paint', buffered: true });
      } catch (e) {
        console.warn('FCP observer not supported');
      }

      // Largest Contentful Paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lcp = entries[entries.length - 1] as PerformanceEntry;
          this.metrics.largestContentfulPaint = lcp.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fid = entries[0] as PerformanceEntry;
          this.metrics.firstInputDelay = (fid as any).processingStart - fid.startTime;
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift
      try {
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            clsValue += (entry as any).value;
          }
          this.metrics.cumulativeLayoutShift = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }
  }

  public getPageLoadTime(): number {
    if (typeof window !== 'undefined' && performance.timing) {
      return performance.timing.loadEventEnd - performance.timing.navigationStart;
    }
    return Date.now() - this.startTime;
  }

  public getTimeToInteractive(): number {
    if (typeof window !== 'undefined' && performance.timing) {
      return performance.timing.domInteractive - performance.timing.navigationStart;
    }
    return 0;
  }

  public getMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: this.getPageLoadTime(),
      firstContentfulPaint: this.metrics.firstContentfulPaint || 0,
      largestContentfulPaint: this.metrics.largestContentfulPaint || 0,
      firstInputDelay: this.metrics.firstInputDelay || 0,
      cumulativeLayoutShift: this.metrics.cumulativeLayoutShift || 0,
      timeToInteractive: this.getTimeToInteractive(),
    };
  }

  public logMetrics(): void {
    const metrics = this.getMetrics();
    console.log('🚀 FilmFlex Performance Metrics:', metrics);
    
    // Send to analytics (if implemented)
    this.sendToAnalytics(metrics);
  }

  private sendToAnalytics(metrics: PerformanceMetrics): void {
    // Placeholder for analytics integration
    // This could be Google Analytics, custom endpoint, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metrics', {
        page_load_time: metrics.pageLoadTime,
        fcp: metrics.firstContentfulPaint,
        lcp: metrics.largestContentfulPaint,
        fid: metrics.firstInputDelay,
        cls: metrics.cumulativeLayoutShift,
        tti: metrics.timeToInteractive,
      });
    }
  }
}

// Global performance monitor instance
let globalMonitor: PerformanceMonitor | null = null;

export function initPerformanceMonitor(): PerformanceMonitor {
  if (!globalMonitor && typeof window !== 'undefined') {
    globalMonitor = new PerformanceMonitor();
    
    // Log metrics on page load
    if (document.readyState === 'complete') {
      globalMonitor.logMetrics();
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => globalMonitor?.logMetrics(), 0);
      });
    }
  }
  return globalMonitor!;
}

export function getPerformanceMetrics(): PerformanceMetrics | null {
  return globalMonitor?.getMetrics() || null;
}