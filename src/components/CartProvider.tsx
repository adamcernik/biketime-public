'use client';

import { ReactNode, createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';

/**
 * B2B košík přihlášeného partnera. Drží se v localStorage per-uid, takže
 * přežije reload i odhlášení/přihlášení téhož uživatele. Ceny v položkách
 * jsou jen zobrazovací snapshot z okamžiku přidání — závazné ceny počítá
 * server při odeslání objednávky (/api/orders) podle cenové skupiny.
 */
export interface CartItem {
    productId: string;
    variantId: string;
    qty: number;
    brand: string;
    model: string;
    year?: number;
    color?: string;
    size?: string;
    frameShape?: string;
    capacity?: string;
    image?: string;
    /** MOC s DPH vybrané varianty (zobrazovací) */
    moc?: number | null;
    /** VOC bez DPH zobrazená při přidání (zobrazovací) */
    dealerPrice?: number | null;
}

const MAX_QTY = 99;

type CartContextValue = {
    items: CartItem[];
    count: number;
    addItem: (item: Omit<CartItem, 'qty'>, qty?: number) => void;
    setQty: (productId: string, variantId: string, qty: number) => void;
    removeItem: (productId: string, variantId: string) => void;
    clear: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function useCart(): CartContextValue {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
}

const storageKey = (uid: string) => `biketime_cart_v1:${uid}`;

export default function CartProvider({ children }: { children: ReactNode }) {
    const { firebaseUser } = useAuth();
    const uid = firebaseUser?.uid || null;
    const [items, setItems] = useState<CartItem[]>([]);

    // Načtení košíku při přihlášení / změně uživatele
    useEffect(() => {
        if (!uid) {
            setItems([]);
            return;
        }
        try {
            const raw = localStorage.getItem(storageKey(uid));
            const parsed = raw ? JSON.parse(raw) : [];
            setItems(Array.isArray(parsed) ? parsed.filter(i => i && i.productId && i.variantId && i.qty > 0) : []);
        } catch {
            setItems([]);
        }
    }, [uid]);

    const persist = useCallback((next: CartItem[]) => {
        setItems(next);
        if (uid) {
            try {
                localStorage.setItem(storageKey(uid), JSON.stringify(next));
            } catch {
                // plné/nedostupné úložiště — košík zůstane jen v paměti
            }
        }
    }, [uid]);

    const addItem = useCallback((item: Omit<CartItem, 'qty'>, qty: number = 1) => {
        persist((() => {
            const existing = items.find(i => i.productId === item.productId && i.variantId === item.variantId);
            if (existing) {
                return items.map(i =>
                    i === existing ? { ...i, ...item, qty: Math.min(MAX_QTY, i.qty + qty) } : i
                );
            }
            return [...items, { ...item, qty: Math.min(MAX_QTY, Math.max(1, qty)) }];
        })());
    }, [items, persist]);

    const setQty = useCallback((productId: string, variantId: string, qty: number) => {
        const clamped = Math.min(MAX_QTY, Math.max(1, Math.round(qty) || 1));
        persist(items.map(i =>
            i.productId === productId && i.variantId === variantId ? { ...i, qty: clamped } : i
        ));
    }, [items, persist]);

    const removeItem = useCallback((productId: string, variantId: string) => {
        persist(items.filter(i => !(i.productId === productId && i.variantId === variantId)));
    }, [items, persist]);

    const clear = useCallback(() => persist([]), [persist]);

    const value = useMemo<CartContextValue>(() => ({
        items,
        count: items.reduce((s, i) => s + i.qty, 0),
        addItem,
        setQty,
        removeItem,
        clear,
    }), [items, addItem, setQty, removeItem, clear]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
