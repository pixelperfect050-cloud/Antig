/**
 * LogRocket Session Replay — Stub Configuration
 *
 * This module is a STUB. LogRocket will NOT be loaded unless
 * VITE_LOGROCKET_APP_ID is set in your environment variables.
 *
 * To enable:
 * 1. Sign up at https://logrocket.com
 * 2. Create a project and get your App ID
 * 3. Add VITE_LOGROCKET_APP_ID=your-app-id to your .env
 * 4. Optionally install: npm install logrocket
 *
 * Zero overhead when not configured — no code is loaded.
 */

import { Sentry } from './sentry';

let LogRocket = null;
let isInitialized = false;

/**
 * Initialize LogRocket session replay.
 * Only loads the LogRocket SDK when VITE_LOGROCKET_APP_ID is set.
 */
export async function initLogRocket() {
  const appId = import.meta.env.VITE_LOGROCKET_APP_ID;

  if (!appId) {
    // LogRocket not configured — silent no-op
    return;
  }

  try {
    // Dynamic import — only loads the bundle if configured
    const LR = await import('logrocket');
    LogRocket = LR.default;

    LogRocket.init(appId, {
      // PII Scrubbing
      network: {
        requestSanitizer: (request) => {
          // Remove auth headers
          if (request.headers) {
            if (request.headers['Authorization']) {
              request.headers['Authorization'] = '[FILTERED]';
            }
          }

          // Scrub sensitive body fields
          if (request.body) {
            try {
              const body = JSON.parse(request.body);
              if (body.password) body.password = '[FILTERED]';
              if (body.confirmPassword) body.confirmPassword = '[FILTERED]';
              if (body.token) body.token = '[FILTERED]';
              request.body = JSON.stringify(body);
            } catch (e) {
              // Not JSON, leave as-is
            }
          }

          return request;
        },
        responseSanitizer: (response) => {
          if (response.body) {
            try {
              const body = JSON.parse(response.body);
              if (body.token) body.token = '[FILTERED]';
              response.body = JSON.stringify(body);
            } catch (e) {
              // Not JSON
            }
          }
          return response;
        },
      },

      // DOM scrubbing
      dom: {
        inputSanitizer: true, // Mask all input fields
      },

      // Console scrubbing
      console: {
        isEnabled: {
          log: false,    // Don't capture console.log
          warn: true,
          error: true,
          info: false,
        },
      },
    });

    isInitialized = true;
    console.log('✅ LogRocket session replay initialized');

    // Integrate with Sentry if available
    try {
      if (Sentry && typeof Sentry.setContext === 'function') {
        LogRocket.getSessionURL((sessionURL) => {
          Sentry.setContext('logrocket', { sessionURL });
          Sentry.setTag('logrocket.session', sessionURL);
        });
      }
    } catch (e) {
      // Sentry not available, skip integration
    }
  } catch (e) {
    console.warn('LogRocket could not be loaded:', e.message);
  }
}

/**
 * Identify the current user in LogRocket.
 * Only sends non-PII identifiers.
 */
export function identifyLogRocketUser(user) {
  if (!LogRocket || !isInitialized || !user) return;

  LogRocket.identify(user.id || user._id, {
    role: user.role,
    // Don't send email or name — PII
  });
}

/**
 * Track a custom event in LogRocket.
 */
export function trackLogRocketEvent(name, data = {}) {
  if (!LogRocket || !isInitialized) return;
  LogRocket.track(name, data);
}
