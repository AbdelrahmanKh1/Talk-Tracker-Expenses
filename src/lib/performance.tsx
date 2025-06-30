// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private marks: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Start timing an operation
  startTimer(name: string): void {
    if (import.meta.env.DEV) {
      this.marks.set(name, performance.now());
    }
  }

  // End timing an operation
  endTimer(name: string): number {
    if (!import.meta.env.DEV) return 0;
    
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`Timer '${name}' was not started`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Store metric for analysis
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);

    // Log slow operations
    if (duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Measure async operation
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startTimer(name);
    try {
      const result = await operation();
      return result;
    } finally {
      this.endTimer(name);
    }
  }

  // Get performance statistics
  getStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    
    for (const [name, values] of this.metrics.entries()) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);
      
      stats[name] = { avg, min, max, count: values.length };
    }
    
    return stats;
  }

  // Clear metrics
  clearMetrics(): void {
    this.metrics.clear();
    this.marks.clear();
  }

  // Report performance data
  reportPerformance(): void {
    if (!import.meta.env.DEV) return;
    
    const stats = this.getStats();
    console.group('Performance Report');
    for (const [name, stat] of Object.entries(stats)) {
      console.log(`${name}: avg=${stat.avg.toFixed(2)}ms, min=${stat.min.toFixed(2)}ms, max=${stat.max.toFixed(2)}ms, count=${stat.count}`);
    }
    console.groupEnd();
  }
}

// Convenience functions
export const perf = PerformanceMonitor.getInstance();

// React performance hook
export const usePerformance = () => {
  return {
    measure: perf.measureAsync.bind(perf),
    startTimer: perf.startTimer.bind(perf),
    endTimer: perf.endTimer.bind(perf),
  };
};

// Memory usage monitoring
export const getMemoryUsage = (): { used: number; total: number; percentage: number } | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }
  return null;
};

// Network performance monitoring
export const measureNetworkPerformance = async (url: string): Promise<number> => {
  const start = performance.now();
  try {
    await fetch(url, { method: 'HEAD' });
    return performance.now() - start;
  } catch {
    return -1; // Error
  }
};

// Component render performance
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return React.memo((props: P) => {
    perf.startTimer(`render-${componentName}`);
    React.useEffect(() => {
      perf.endTimer(`render-${componentName}`);
    });
    return <Component {...props} />;
  });
} 