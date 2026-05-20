const { createLogger, format, transports } = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Sentry transport for error-level logs
const SentryTransport = class extends require('winston-transport') {
  log(info, callback) {
    setImmediate(() => this.emit('logged', info));
    if (info.level === 'error') {
      try {
        const Sentry = require('@sentry/node');
        if (info instanceof Error) {
          Sentry.captureException(info);
        } else if (info.message) {
          Sentry.captureException(new Error(info.message), {
            extra: { ...info, level: undefined, message: undefined }
          });
        }
      } catch (e) {
        // Sentry not initialized, silently skip
      }
    }
    callback();
  }
};

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'society-app' },
  transports: [
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5
    }),
    new SentryTransport({ level: 'error' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  );
}

module.exports = logger;