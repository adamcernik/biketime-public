export interface ShopUser {
    id: string;
    uid: string; // Firebase Auth UID
    email: string;
    displayName?: string | null;
    photoURL?: string | null;

    // Shop-specific fields
    companyName?: string;
    firstName?: string;
    lastName?: string;
    companyAddress?: string;
    phone?: string;

    // Price level (A, B, C, D, E, F)
    priceLevel?: PriceLevel;

    // Structured company / ARES data (all optional — legacy users have none).
    // companyName/companyAddress above stay the canonical display fields; ARES
    // fills these AND mirrors legalName→companyName so the rest of the app is
    // unaffected. Price level lives in root priceLevel and is NEVER touched here.
    company?: CompanyDetails;

    // Access and timestamps
    hasAccess: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
}

export interface CompanyDetails {
    ico?: string;                 // 8 digits, indexed (duplicity check + lookup)
    vatId?: string | null;        // DIČ — absent for non-VAT payers
    legalName?: string;           // obchodní jméno z ARES
    street?: string;
    city?: string;
    zip?: string;                 // no spaces
    country?: string;             // "CZ", "SK", ...
    legalFormCode?: string | null;
    foundedAt?: string | null;    // ISO date
    isVatPayer?: boolean;
    aresVerifiedAt?: string | null; // ISO timestamp; null/absent = neověřeno
    aresEditedAfterVerify?: boolean; // user changed an auto-filled field after lookup
    aresTerminated?: boolean;     // ARES lists the company as zaniklá — flag only, never auto-block (§6.4)
    isForeignCompany?: boolean;   // true = registration without ARES (checkbox)
}

export enum PriceLevel {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D'
}

export enum UserRole {
    POWERADMIN = 'poweradmin',
    ADMIN = 'admin',
    SHOP = 'shop', // Shop user with price level
    PENDING = 'pending'
}

export interface ShopRegistrationData {
    companyName: string;
    firstName: string;
    lastName: string;
    companyAddress: string;
    email: string;
    phone: string;
    // Optional structured company/ARES block. When present it is persisted to
    // ShopUser.company; legalName is mirrored into companyName by the form.
    company?: CompanyDetails;
}
