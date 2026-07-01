'use client';

import { useEffect, useRef } from 'react';
import { track, EventProps } from '@/lib/analytics';

// Fire-and-forget analytics for server-rendered pages: drop this in to capture a
// single event on mount. Renders nothing. Use when there's no client handler to
// hang a track() call off (e.g. the soft-404 ProductUnavailable page).
export default function TrackEvent({ event, props }: { event: string; props?: EventProps }) {
    const fired = useRef(false);
    useEffect(() => {
        if (fired.current) return;
        fired.current = true;
        track(event, props);
    }, [event, props]);
    return null;
}
