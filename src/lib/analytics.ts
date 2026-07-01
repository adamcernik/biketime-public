import posthog from 'posthog-js';

// Central place for custom product analytics. Using the posthog singleton (not the
// React hook) so events can be fired from anywhere — effects, handlers, deep in the
// tree — without prop-drilling the client. PostHog respects consent/opt-out on its
// own, so callers don't need to check: while opted out, capture() is a no-op.
//
// Keep event names snake_case and stable — renaming an event splits its history in
// PostHog. Property names snake_case too. Never pass PII here (no e-mail); person
// identification (name + company) is handled once in AuthProvider.identify().

export type EventProps = Record<string, string | number | boolean | null | undefined>;

export function track(event: string, props?: EventProps): void {
    try {
        posthog.capture(event, props);
    } catch {
        // Analytics must never break the app.
    }
}
