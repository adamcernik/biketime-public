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
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            const hasConsent = typeof window !== 'undefined' && localStorage.getItem('cookie-consent') === 'accepted'

            posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
                api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
                person_profiles: 'identified_only',
                capture_pageview: false, // We handle this manually in PostHogPageView
                opt_out_capturing_by_default: !hasConsent,
                persistence: hasConsent ? 'localStorage+cookie' : 'memory'
            })
        }
    }, [])

    return (
        <PostHogProvider client={posthog}>
            {children}
        </PostHogProvider>
    )
}
