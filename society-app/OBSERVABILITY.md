# Observability, Testing, and Debugging in SocietySync

This document covers the monitoring, testing, and debugging stack implemented in the SocietySync application.

## 1. Sentry Integration (Error Tracking & Performance Monitoring)

Sentry is integrated on both the frontend (React) and backend (Express) to capture unhandled exceptions, track API failures, and monitor performance.

### Configuration
You need to set the following environment variables in `.env` (server) and `.env.local` (client):
- `VITE_SENTRY_DSN` (Frontend)
- `SENTRY_DSN` (Backend)

*Note: The app will run normally without these variables, gracefully disabling error tracking.*

### Features
- **PII Scrubbing**: Passwords, auth tokens, and emails are stripped before being sent to Sentry.
- **Source Maps**: Vite is configured to upload source maps to Sentry on build (requires `SENTRY_AUTH_TOKEN`).
- **Error Boundaries**: A user-friendly `ErrorFallback` component catches frontend crashes.
- **Performance**: Tracks slow API routes and long frontend tasks.

## 2. Playwright (Automated E2E Testing)

We use Playwright to run end-to-end tests covering both Admin and Member roles.

### Running Tests
Make sure the dev server is NOT running (Playwright will start it automatically):

```bash
npm run test:e2e          # Run all tests headlessly
npm run test:e2e:ui       # Open Playwright UI mode (recommended for debugging)
npm run test:e2e:headed   # Run tests in visible browsers
npm run test:e2e:report   # View HTML report of the last test run
```

### Test Structure
Tests are located in `society-app/e2e/`:
- `auth/`: Login, registration, session persistence.
- `dashboard/`: Admin/member dashboard views and realtime updates.
- `payments/`: Bill generation, payment records, receipts.
- `expenses/`: Adding and managing expenses.
- `responsive/`: Tests for Mobile (Pixel 5), Tablet, and Desktop.
- `ui/`: Navigation, modals, forms, and theme toggle.

## 3. Continue.dev (AI Coding Assistant)

The workspace is configured for [Continue.dev](https://continue.dev/), using the Gemini API.

### Configuration
1. Install the Continue extension in VS Code.
2. The workspace `.continue/config.yaml` is pre-configured with the SocietySync tech stack and context.
3. Set your `GEMINI_API_KEY` in your environment or Continue settings.

### Custom Prompts
Use these slash commands in the Continue chat:
- `/debug`: Analyzes an error and suggests fixes considering Sentry, MongoDB, and React.
- `/review`: Reviews code against SocietySync best practices (security, performance, mobile).
- `/test`: Generates Playwright E2E tests using existing fixtures.
- `/refactor`: Suggests architectural improvements.

## 4. Supabase Auth Disabled

The Supabase client (`src/config/supabase.js`) has auto-auth disabled to prevent it from sending confirmation emails on signup, since SocietySync uses a custom MongoDB + JWT authentication system.

## 5. Advanced Debugging (Optional)

- **LogRocket**: A stub configuration exists in `client/src/utils/logrocket.js`. To enable session replays, provide a `VITE_LOGROCKET_APP_ID`.
- **Diagnostics**: Custom performance tracking for long tasks and memory leaks feeds into Sentry automatically.
