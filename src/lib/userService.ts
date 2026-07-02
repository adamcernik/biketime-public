import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ShopUser, UserRole, PriceLevel, ShopRegistrationData, CompanyDetails } from '../types/User';

const USERS_COLLECTION = 'users';

// Firestore (client SDK) rejects `undefined` field values (ignoreUndefinedProperties
// is not set). Keep only defined keys before writing the company block.
function cleanCompany(company?: CompanyDetails): CompanyDetails | undefined {
    if (!company) return undefined;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(company)) {
        if (v !== undefined) out[k] = v;
    }
    return Object.keys(out).length ? (out as CompanyDetails) : undefined;
}

export class UserService {

    // Get user by Firebase UID
    static async getUserByUid(uid: string): Promise<ShopUser | null> {
        try {
            const userDoc = await getDoc(doc(db, USERS_COLLECTION, uid));

            if (!userDoc.exists()) {
                return null;
            }

            const userData = userDoc.data();
            return {
                id: userDoc.id,
                uid: userData.uid,
                email: userData.email,
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                companyName: userData.companyName,
                firstName: userData.firstName,
                lastName: userData.lastName,
                companyAddress: userData.companyAddress,
                phone: userData.phone,
                company: userData.company,
                priceLevel: userData.priceLevel as PriceLevel,
                hasAccess: userData.hasAccess || false,
                role: userData.role as UserRole || UserRole.PENDING,
                createdAt: userData.createdAt?.toDate() || new Date(),
                updatedAt: userData.updatedAt?.toDate() || new Date(),
                lastLoginAt: userData.lastLoginAt?.toDate() || undefined,
                approvedBy: userData.approvedBy,
                approvedAt: userData.approvedAt?.toDate() || undefined
            } as ShopUser;
        } catch (error) {
            console.error('Error getting user by UID:', error);
            return null;
        }
    }

    // Update user on login (keep existing data, just update login timestamp and profile)
    static async updateUserOnLogin(userInfo: {
        uid: string;
        email: string;
        displayName?: string;
        photoURL?: string;
    }): Promise<ShopUser & { isNewRegistration?: boolean }> {
        try {
            const existingUser = await this.getUserByUid(userInfo.uid);
            const now = Timestamp.now();

            if (existingUser) {
                // Update existing user's last login and profile info
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updateData: any = {
                    lastLoginAt: now,
                    updatedAt: now
                };

                // Update profile info from Google if available
                if (userInfo.displayName !== undefined) {
                    updateData.displayName = userInfo.displayName;
                }
                if (userInfo.photoURL !== undefined) {
                    updateData.photoURL = userInfo.photoURL;
                }

                await updateDoc(doc(db, USERS_COLLECTION, userInfo.uid), updateData);

                return {
                    ...existingUser,
                    displayName: userInfo.displayName !== undefined ? userInfo.displayName : existingUser.displayName,
                    photoURL: userInfo.photoURL !== undefined ? userInfo.photoURL : existingUser.photoURL,
                    lastLoginAt: now.toDate(),
                    updatedAt: now.toDate()
                };
            } else {
                // Create new user with pending status (Google sign-in for existing users)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const userData: any = {
                    uid: userInfo.uid,
                    email: userInfo.email,
                    displayName: userInfo.displayName || null,
                    photoURL: userInfo.photoURL || null,
                    hasAccess: false,
                    role: UserRole.PENDING,
                    createdAt: now,
                    updatedAt: now,
                    lastLoginAt: now
                };

                await setDoc(doc(db, USERS_COLLECTION, userInfo.uid), userData);

                return {
                    id: userInfo.uid,
                    uid: userInfo.uid,
                    email: userInfo.email,
                    displayName: userInfo.displayName || undefined,
                    photoURL: userInfo.photoURL || undefined,
                    hasAccess: false,
                    role: UserRole.PENDING,
                    createdAt: now.toDate(),
                    updatedAt: now.toDate(),
                    lastLoginAt: now.toDate(),
                    // Transient flag (not persisted): this pending account was just
                    // created → AuthProvider fires the registration-ack e-mail once.
                    isNewRegistration: true
                };
            }
        } catch (error) {
            console.error('Error updating user on login:', error);
            throw error;
        }
    }

    // Register a new shop (will be pending until admin approves)
    static async registerShop(
        uid: string,
        email: string,
        registrationData: ShopRegistrationData
    ): Promise<ShopUser> {
        try {
            const now = Timestamp.now();
            const company = cleanCompany(registrationData.company);

            const userData = {
                uid,
                email,
                companyName: registrationData.companyName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                companyAddress: registrationData.companyAddress,
                phone: registrationData.phone,
                ...(company ? { company } : {}),
                hasAccess: false,
                role: UserRole.PENDING,
                createdAt: now,
                updatedAt: now,
                lastLoginAt: now
            };

            await setDoc(doc(db, USERS_COLLECTION, uid), userData);

            return {
                id: uid,
                uid,
                email,
                companyName: registrationData.companyName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                companyAddress: registrationData.companyAddress,
                phone: registrationData.phone,
                hasAccess: false,
                role: UserRole.PENDING,
                createdAt: now.toDate(),
                updatedAt: now.toDate(),
                lastLoginAt: now.toDate()
            };
        } catch (error) {
            console.error('Error registering shop:', error);
            throw error;
        }
    }

    // Update shop registration info (if user already exists but needs to complete registration)
    static async updateShopRegistration(
        uid: string,
        registrationData: ShopRegistrationData
    ): Promise<void> {
        try {
            const now = Timestamp.now();
            const company = cleanCompany(registrationData.company);

            await updateDoc(doc(db, USERS_COLLECTION, uid), {
                companyName: registrationData.companyName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                companyAddress: registrationData.companyAddress,
                phone: registrationData.phone,
                ...(company ? { company } : {}),
                updatedAt: now
            });
        } catch (error) {
            console.error('Error updating shop registration:', error);
            throw error;
        }
    }
    // Save the structured company block (self-service IČO fill-in from the
    // client zone). Optionally mirrors legalName/address into the flat legacy
    // fields — only when they are empty, never overwriting the partner's own
    // wording without consent. Full-map write is safe here: the banner only
    // shows when no company.ico exists yet.
    static async updateCompanyData(
        uid: string,
        company: CompanyDetails,
        mirror?: { companyName?: string; companyAddress?: string }
    ): Promise<void> {
        const now = Timestamp.now();
        const clean = cleanCompany(company);

        await updateDoc(doc(db, USERS_COLLECTION, uid), {
            ...(mirror?.companyName ? { companyName: mirror.companyName } : {}),
            ...(mirror?.companyAddress ? { companyAddress: mirror.companyAddress } : {}),
            ...(clean ? { company: clean } : {}),
            updatedAt: now
        });
    }

    // Update user data (for client zone)
    static async updateUserData(
        uid: string,
        data: Partial<ShopRegistrationData>
    ): Promise<void> {
        try {
            const now = Timestamp.now();
            await updateDoc(doc(db, USERS_COLLECTION, uid), {
                ...data,
                updatedAt: now
            });
        } catch (error) {
            console.error('Error updating user data:', error);
            throw error;
        }
    }
}
