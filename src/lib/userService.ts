import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { ShopUser, UserRole, PriceLevel, ShopRegistrationData } from '../types/User';

const USERS_COLLECTION = 'users';

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
    }): Promise<ShopUser> {
        try {
            const existingUser = await this.getUserByUid(userInfo.uid);
            const now = Timestamp.now();

            if (existingUser) {
                // Update existing user's last login and profile info
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
                const userData: any = {
                    uid: userInfo.uid,
                    email: userInfo.email,
                    displayName: userInfo.displayName || undefined,
                    photoURL: userInfo.photoURL || undefined,
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
                    lastLoginAt: now.toDate()
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

            const userData = {
                uid,
                email,
                companyName: registrationData.companyName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                companyAddress: registrationData.companyAddress,
                phone: registrationData.phone,
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

            await updateDoc(doc(db, USERS_COLLECTION, uid), {
                companyName: registrationData.companyName,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName,
                companyAddress: registrationData.companyAddress,
                phone: registrationData.phone,
                updatedAt: now
            });
        } catch (error) {
            console.error('Error updating shop registration:', error);
            throw error;
        }
    }
}
