'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePostHog } from 'posthog-js/react';

export default function CookieBanner() {
    const [show, setShow] = useState(false);
    const [consentGiven, setConsentGiven] = useState(false);
    const posthog = usePostHog();

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            setShow(true);
        } else if (consent === 'accepted') {
            setConsentGiven(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setShow(false);
        setConsentGiven(true);
        posthog?.opt_in_capturing();
        posthog?.set_config({ persistence: 'localStorage+cookie' });
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setShow(false);
        setConsentGiven(false);
        posthog?.opt_out_capturing();
        posthog?.set_config({ persistence: 'memory' });
    };

    return (
        <>
            {show && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-zinc-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-500">
                    <div className="container-custom max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-sm text-zinc-600 flex-1">
                            <p>
                                Tento web používá soubory cookie k zajištění správného fungování a k analýze návštěvnosti.
                                Kliknutím na tlačítko „Přijmout vše“ souhlasíte s používáním všech souborů cookie.
                                Více informací naleznete v našich <Link href="/ochrana-osobnich-udaju" className="text-primary hover:underline">Zásadách ochrany osobních údajů</Link>.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={handleDecline}
                                className="px-4 py-2 text-sm font-medium text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                            >
                                Odmítnout
                            </button>
                            <button
                                onClick={handleAccept}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-red-700 rounded-lg transition-colors shadow-sm"
                            >
                                Přijmout vše
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
