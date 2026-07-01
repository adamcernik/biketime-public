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
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
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
