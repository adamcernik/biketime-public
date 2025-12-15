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

    // Access and timestamps
    hasAccess: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    lastLoginAt?: Date;
    approvedBy?: string;
    approvedAt?: Date;
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
}
