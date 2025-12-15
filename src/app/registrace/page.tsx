'use client';

import { useAuth } from '@/components/AuthProvider';
import { useState, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegistrationPage() {
    const { firebaseUser, shopUser, signInWithGoogle, signUpWithEmail, loading } = useAuth(); // Added signUpWithEmail
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Auth state
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [authData, setAuthData] = useState({ email: '', password: '' });

    const [formData, setFormData] = useState({
        companyName: '',
        firstName: '',
        lastName: '',
        companyAddress: '',
        email: '',
        phone: '',
    });

    const { registerShop } = useAuth(); // Destructure separately to avoid linter issues if needed, or just keep above

    // Prefill email if user is already signed in
    useEffect(() => {
        if (firebaseUser?.email) {
            setFormData(prev => ({
                ...prev,
                email: firebaseUser.email || ''
            }));
        }
    }, [firebaseUser]);

    // If already registered and approved, redirect
    useEffect(() => {
        if (shopUser?.hasAccess) {
            router.push('/');
        }
    }, [shopUser, router]);

    const handleEmailSignUp = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            await signUpWithEmail(authData.email, authData.password);
            // On success, firebaseUser will update, and the UI will switch to shop details form
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error('Email sign up error:', err);
            let msg = 'Chyba při registraci.';
            if (err.code === 'auth/email-already-in-use') msg = 'Email se již používá.';
            if (err.code === 'auth/weak-password') msg = 'Heslo je příliš slabé (min. 6 znaků).';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        // ... (existing logic)
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            if (!firebaseUser) {
                setError('Nejprve se přihlaste.'); // Should not happen
                setSubmitting(false);
                return;
            }
            // Register the shop
            await registerShop(formData);
            setSuccess(true);
            setTimeout(() => {
                router.push('/');
            }, 3000);
        } catch (err) {
            console.error('Registration error:', err);
            setError('Chyba při registraci. Zkuste to prosím znovu.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (success) {
        return (
            <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center py-16 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Registrace úspěšná!</h1>
                        <p className="text-zinc-600 mb-4">
                            Děkujeme za registraci. Brzy vás kontaktujeme ohledně nastavení cenových skupin a přístupových práv.
                        </p>
                        <p className="text-sm text-zinc-500">
                            Přesměrování na hlavní stránku...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 py-16 px-4">
            <div className="w-full max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2">Registrace prodejny</h1>
                        <p className="text-zinc-600">Vyplňte údaje o vaší prodejně</p>
                    </div>

                    {!firebaseUser ? (
                        <div className="text-center py-8">
                            {/* Auth Options */}
                            {!showEmailForm ? (
                                <>
                                    <p className="text-zinc-600 mb-6">
                                        Pro registraci si vytvořte účet nebo se přihlaste
                                    </p>

                                    <div className="space-y-4 max-w-sm mx-auto">
                                        <button
                                            disabled={loading}
                                            onClick={signInWithGoogle}
                                            className="w-full inline-flex items-center justify-center gap-3 bg-white border-2 border-zinc-200 text-zinc-900 py-3 px-6 rounded-lg font-medium hover:border-primary hover:bg-zinc-50 transition-all disabled:opacity-50"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                            </svg>
                                            Pokračovat přes Google
                                        </button>

                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-zinc-200"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-2 bg-white text-zinc-500">nebo</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setShowEmailForm(true)}
                                            className="w-full inline-flex items-center justify-center gap-3 bg-zinc-900 text-white py-3 px-6 rounded-lg font-medium hover:bg-zinc-800 transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                            </svg>
                                            Registrovat emailem
                                        </button>
                                    </div>

                                    <div className="mt-6">
                                        <Link href="/login" className="text-primary hover:underline">
                                            Již máte účet? Přihlásit se
                                        </Link>
                                    </div>
                                </>
                            ) : (
                                <form onSubmit={handleEmailSignUp} className="max-w-sm mx-auto text-left space-y-4">
                                    <h3 className="text-lg font-semibold text-center mb-4">Vytvořit účet</h3>
                                    {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={authData.email}
                                            onChange={e => setAuthData({ ...authData, email: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Heslo</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={6}
                                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            value={authData.password}
                                            onChange={e => setAuthData({ ...authData, password: e.target.value })}
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">Minimálně 6 znaků</p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full bg-primary text-white py-2 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                    >
                                        {submitting ? 'Vytvářím účet...' : 'Pokračovat'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowEmailForm(false)}
                                        className="w-full text-zinc-500 text-sm hover:underline"
                                    >
                                        Zpět na výběr
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : shopUser?.companyName ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-zinc-900 mb-2">Registrace již proběhla</h2>
                            <p className="text-zinc-600 mb-4">
                                Vaše prodejna <strong>{shopUser.companyName}</strong> je již registrována.
                            </p>
                            {shopUser.hasAccess ? (
                                <p className="text-green-600 font-medium">
                                    Váš účet je schválen a máte přístup k systému.
                                </p>
                            ) : (
                                <p className="text-orange-600 font-medium">
                                    Čekáme na schválení vašeho účtu administrátorem.
                                </p>
                            )}
                            <Link href="/" className="inline-block mt-6 text-primary hover:underline">
                                Zpět na hlavní stránku
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                                    {error}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="companyName" className="block text-sm font-medium text-zinc-700 mb-2">
                                        Název firmy <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="companyName"
                                        name="companyName"
                                        required
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Název vaší prodejny"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-zinc-700 mb-2">
                                        Telefon <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="+420 123 456 789"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-zinc-700 mb-2">
                                        Jméno <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Vaše jméno"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-zinc-700 mb-2">
                                        Příjmení <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Vaše příjmení"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg bg-zinc-50 text-zinc-500"
                                    placeholder="vas@email.cz"
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Email z vašeho Google účtu
                                </p>
                            </div>

                            <div>
                                <label htmlFor="companyAddress" className="block text-sm font-medium text-zinc-700 mb-2">
                                    Adresa firmy <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="companyAddress"
                                    name="companyAddress"
                                    required
                                    rows={3}
                                    value={formData.companyAddress}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    placeholder="Ulice, číslo popisné&#10;PSČ Město"
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-900">
                                    <strong>Co se stane po registraci?</strong><br />
                                    Po odeslání formuláře vás budeme kontaktovat e-mailem. Následně nastavíme vaši cenovou skupinu (A-F) a přístupová práva.
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-primary text-white py-3 px-6 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Probíhá registrace...' : 'Registrovat prodejnu'}
                                </button>
                                <Link
                                    href="/login"
                                    className="px-6 py-3 border-2 border-zinc-300 text-zinc-700 rounded-lg font-medium hover:border-zinc-400 transition-colors"
                                >
                                    Zpět
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </main>
    );
}
