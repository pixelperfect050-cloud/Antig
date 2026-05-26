import { Sentry, addBreadcrumb } from './sentry';

/**
 * Lightweight performance diagnostics module.
 * Monitors long tasks, memory usage, and network quality.
 * Feeds data to Sentry as custom measurements.
 * Zero overhead when Sentry is not configured.
 */

let isInitialized = false;
let longTaskObserver = null;

/**
 * Initialize performance diagnostics.
 * Call once after Sentry is initialized.
 */
export function initDiagnostics() {
  if (isInitialized) return;
  isInitialized = true;

  // Only run diagnostics if we have Sentry configured
  if (!import.meta.env.VITE_SENTRY_DSN) return;

  observeLongTasks();
  trackMemoryUsage();
  trackNetworkQuality();

  console.log('✅ Performance diagnostics initialized');
}

/**
 * Monitor long tasks (>50ms) that block the main thread.
 * These cause UI jank and poor user experience.
 */
function observeLongTasks() {
  if (typeof PerformanceObserver === 'undefined') return;

  try {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          // Only report tasks longer than 100ms to reduce noise
          addBreadcrumb(
            `Long task detected: ${Math.round(entry.duration)}ms`,
            'performance',
            {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            }
          );

          // Report to Sentry as a custom measurement
          Sentry.withScope((scope) => {
            scope.setTag('performance.type', 'long-task');
            scope.setExtra('duration_ms', entry.duration);
            scope.setLevel('warning');
          });
        }
      }
    });

    longTaskObserver.observe({ type: 'longtask', buffered: true });
  } catch (e) {
    // PerformanceObserver for longtask not supported
  }
}

/**
 * Track memory usage periodically.
 * Helps detect memory leaks in long-running sessions.
 */
function trackMemoryUsage() {
  // performance.memory is Chrome-only
  if (!performance.memory) return;

  const checkMemory = () => {
    const { usedJSHeapSize, jsHeapSizeLimit } = performance.memory;
    const usagePercent = (usedJSHeapSize / jsHeapSizeLimit) * 100;

    if (usagePercent > 80) {
      addBreadcrumb(
        `High memory usage: ${usagePercent.toFixed(1)}%`,
        'performance',
        {
          usedMB: Math.round(usedJSHeapSize / 1048576),
          limitMB: Math.round(jsHeapSizeLimit / 1048576),
          percent: usagePercent.toFixed(1),
        }
      );

      if (usagePercent > 90) {
        Sentry.captureMessage('Critical memory usage detected', {
          level: 'warning',
          extra: {
            usedMB: Math.round(usedJSHeapSize / 1048576),
            limitMB: Math.round(jsHeapSizeLimit / 1048576),
          },
        });
      }
    }
  };

  // Check every 60 seconds
  setInterval(checkMemory, 60000);
}

/**
 * Track network quality using the Network Information API.
 * Helps understand mobile user experience.
 */
function trackNetworkQuality() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!connection) return;

  const logNetworkInfo = () => {
    const info = {
      type: connection.type,
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };

    Sentry.setContext('network', info);

    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      addBreadcrumb('Slow network detected', 'network', info);
    }
  };

  logNetworkInfo();
  connection.addEventListener('change', logNetworkInfo);
}

/**
 * Cleanup diagnostics (call on app unmount if needed)
 */
export function cleanupDiagnostics() {
  if (longTaskObserver) {
    longTaskObserver.disconnect();
    longTaskObserver = null;
  }
  isInitialized = false;
}
