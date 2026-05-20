const Sentry = require('@sentry/node');

function initSentry(app) {
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN not configured — error tracking disabled');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || 'society-app-server@1.1.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.3 : 1.0,
    integrations: [
      Sentry.mongooseIntegration(),
    ],
    beforeSend(event) {
      // Scrub sensitive data
      if (event.request) {
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }
        if (event.request.data) {
          const data = typeof event.request.data === 'string' 
            ? JSON.parse(event.request.data) 
            : event.request.data;
          if (data.password) data.password = '[FILTERED]';
          if (data.token) data.token = '[FILTERED]';
          if (data.email) data.email = data.email.replace(/(.{2}).*(@.*)/, '$1***$2');
          event.request.data = JSON.stringify(data);
        }
      }
      return event;
    },
    ignoreErrors: [
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
    ],
  });

  console.log('✅ Sentry initialized for error tracking');
}

module.exports = { initSentry };
