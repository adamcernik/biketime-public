'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export default function CSPostHogProvider({
    children
}: {
    children: React.ReactNode
}) {
    useEffect(() => {
        const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN || process.env.NEXT_PUBLIC_POSTHOG_KEY
        if (typeof window !== 'undefined' && posthogToken) {
            const hasConsent = typeof window !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted'

            posthog.init(posthogToken, {
                // First-party reverse proxy (see next.config.ts rewrites) so ad
                // blockers don't drop events. Must NOT read NEXT_PUBLIC_POSTHOG_HOST
                // here — that env var points at eu.i.posthog.com and would bypass
                // the proxy. ui_host keeps in-app links pointing at the real EU UI.
                api_host: '/relay',
                ui_host: 'https://eu.posthog.com',
                person_profiles: 'identified_only',
                capture_pageview: false, // We handle this manually in PostHogPageView
                opt_out_capturing_by_default: !hasConsent,
                persistence: hasConsent ? 'localStorage+cookie' : 'memory',
                // Session replay must stay pseudonymous (privacy policy promise):
                // mask every input field so no typed PII (registration form —
                // name, e-mail, phone, company) is ever recorded. Page text stays
                // visible so replays remain useful for debugging UX.
                session_recording: {
                    maskAllInputs: true,
                },
            })
        }
    }, [])

    return (
        <PostHogProvider client={posthog}>
            {children}
        </PostHogProvider>
    )
}
