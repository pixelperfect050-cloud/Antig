import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry error tracking for the frontend.
 * Safe to call even without a DSN — will no-op gracefully.
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;

  if (!dsn) {
    console.log('⚠️  Sentry DSN not configured — frontend error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'development',
    release: import.meta.env.VITE_APP_VERSION || 'society-app-client@1.1.0',

    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,

    // Session Replay (only in production, sampled)
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 0,
    replaysOnErrorSampleRate: import.meta.env.PROD ? 1.0 : 0,

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        maskAllInputs: true, // Mask all form inputs (passwords, emails, etc.)
        blockAllMedia: false,
      }),
    ],

    // Scrub sensitive data before sending to Sentry
    beforeSend(event) {
      // Remove sensitive breadcrumb data
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map(breadcrumb => {
          if (breadcrumb.data) {
            // Remove auth tokens from API call breadcrumbs
            if (breadcrumb.data.headers) {
              delete breadcrumb.data.headers.Authorization;
              delete breadcrumb.data.headers.authorization;
            }
            // Mask sensitive URL params
            if (breadcrumb.data.url && typeof breadcrumb.data.url === 'string') {
              breadcrumb.data.url = breadcrumb.data.url.replace(
                /token=[^&]+/gi, 'token=[FILTERED]'
              );
            }
          }
          return breadcrumb;
        });
      }

      // Scrub request body data
      if (event.request?.data) {
        try {
          const data = typeof event.request.data === 'string'
            ? JSON.parse(event.request.data)
            : event.request.data;

          if (data.password) data.password = '[FILTERED]';
          if (data.confirmPassword) data.confirmPassword = '[FILTERED]';
          if (data.token) data.token = '[FILTERED]';
          if (data.email) data.email = data.email.replace(/(.{2}).*(@.*)/, '$1***$2');

          event.request.data = JSON.stringify(data);
        } catch (e) {
          // Not JSON, leave as-is
        }
      }

      return event;
    },

    // Don't capture these common non-actionable errors
    ignoreErrors: [
      // Network errors that are expected on mobile
      'Network error',
      'Failed to fetch',
      'Load failed',
      'Request timed out',
      'AbortError',
      // Browser extensions
      'ResizeObserver loop',
      /Non-Error exception captured/,
      // Capacitor-specific
      'StatusBar',
    ],

    // Don't track health-check pings
    beforeSendTransaction(event) {
      if (event.transaction && event.transaction.includes('/api/health')) {
        return null;
      }
      return event;
    },
  });

  console.log('✅ Sentry initialized for frontend error tracking');
}

/**
 * Set the current user context in Sentry.
 * Only stores non-PII identifiers.
 */
export function setSentryUser(user) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id || user._id,
    role: user.role,
    // Don't send email or name — PII
  });

  // Set useful context tags
  Sentry.setTag('user.role', user.role);
  if (user.societyId) {
    const societyId = typeof user.societyId === 'object' ? user.societyId._id : user.societyId;
    Sentry.setTag('society.id', societyId);
  }
}

/**
 * Capture an exception with optional context
 */
export function captureError(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Add a breadcrumb for tracking user journey
 */
export function addBreadcrumb(message, category = 'app', data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// Re-export Sentry's ErrorBoundary for use in main.jsx
export { Sentry };
