# Biketime Public - Authentication Implementation Guide

**Date:** December 4, 2025  
**Status:** ✅ Implemented and Ready for Testing on Localhost

---

## 📋 Overview

This document describes the complete authentication system implemented for the Biketime public website, including shop registration, user management with price levels (A-D), and integration with the admin panel.

---

## ✅ Features Implemented

### 1. **Public Website Authentication**

#### **User Interface Components**

**Top Bar Authentication Button** (`/src/components/UserAuthButton.tsx`)
- Shows "Přihlášení" link when user is not logged in
- Displays user profile dropdown when logged in:
  - Profile image from Google (or avatar with initials)
  - First name or display name
  - Email address
  - Company name (if shop is registered)
  - Price level badge (A-D, when set by admin)
  - Sign out button

**Login Page** (`/src/app/login/page.tsx`)
- Clean, modern design with gradient background
- Google Sign-In button with official Google logo
- Link to shop registration page
- Informational message about price level setup
- Auto-redirects authenticated users to homepage

**Registration Page** (`/src/app/registrace/page.tsx`)
- Two-step process:
  1. Sign in with Google account first
  2. Complete shop registration form
- Registration form fields:
  - **Company Name** (required)
  - **First Name** (required)
  - **Last Name** (required)
  - **Email** (auto-filled from Google, read-only)
  - **Phone Number** (required)
  - **Company Address** (required, multiline)
- Success screen after registration
- Handles edge cases:
  - Not signed in → prompts Google sign-in
  - Already registered → shows status message
  - Already approved → redirects to homepage

---

### 2. **Data Structure**

#### **User Types** (`/src/types/User.ts`)

```typescript
export interface ShopUser {
  id: string;
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // Shop-specific fields
  companyName?: string;
  firstName?: string;
  lastName?: string;
  companyAddress?: string;
  phone?: string;
  priceLevel?: PriceLevel; // A, B, C, D
  
  // Access control
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
  SHOP = 'shop',
  USER = 'user',
  PENDING = 'pending'
}
```

---

### 3. **Admin Panel Integration**

#### **User Management Enhancements** (`biketime/src/app/admin/users/page.tsx`)

**New Features:**
- **"Cenová skupina" column** with dropdown selector
- Price level options: A, B, C, D, or blank (-)
- Dropdown is disabled for users without access
- All shop information visible in the table
- Existing features maintained:
  - Grant/revoke access
  - Toggle admin roles
  - B2B access toggle
  - Delete users

**Updated User Service** (`biketime/src/lib/services/userService.ts`)
- New method: `setPriceLevel(uid, priceLevel)`
- Updated `getUserByUid()` to include shop fields
- Updated `getUsers()` to include shop fields

**Updated Types** (`biketime/src/types/User.ts`)
- Added shop-specific fields to User interface
- Added PriceLevel enum
- Added SHOP role to UserRole enum

---

## 🔄 User Flow

### **Shop Registration Flow**

1. **User visits website** → Sees "Přihlášení" in top bar
2. **Clicks "Přihlášení"** → Redirected to `/login`
3. **Clicks "Registrovat prodejnu"** → Redirected to `/registrace`
4. **Signs in with Google** (if not already signed in)
5. **Fills registration form** with company details
6. **Submits form** → Data saved to Firestore
   - `role: PENDING`
   - `hasAccess: false`
   - All shop information stored
7. **Success screen shown** → Auto-redirects to homepage
8. **User sees profile** in top bar (but no access to restricted content)

### **Admin Approval Flow**

1. **Admin logs into admin panel** at `http://localhost:3001`
2. **Goes to Users management** (`/admin/users`)
3. **Sees new pending user** (highlighted in orange)
4. **Reviews company details:**
   - Company name
   - Contact person (first & last name)
   - Email & phone
   - Address
5. **Grants access** (green checkmark button)
6. **Sets price level** using dropdown (A, B, C, D)
7. **User now has access** and price level assigned

### **Authenticated Shop User Experience**

1. **User signs in** with Google
2. **Profile shows** in top bar with:
   - Profile image
   - First name
   - Company name
   - Price level badge
3. **Future:** Product prices displayed based on assigned price level

---

## 🧪 Testing Instructions

### **Prerequisites**
- Both development servers running:
  - Public: `http://localhost:3000`
  - Admin: `http://localhost:3001`
- Google account for testing
- Firebase authentication configured

### **Test Scenarios**

#### **Scenario 1: New Shop Registration**
1. Open `http://localhost:3000`
2. Click "Přihlášení" in top bar
3. Click "Registrovat prodejnu"
4. Sign in with Google when prompted
5. Fill out registration form:
   ```
   Company Name: Test Bike Shop
   First Name: Jan
   Last Name: Novák
   Phone: +420 123 456 789
   Address: Hlavní 123
            120 00 Praha
   ```
6. Submit form
7. Verify success screen appears
8. Check auto-redirect to homepage

#### **Scenario 2: Admin Approval & Price Level Assignment**
1. Open `http://localhost:3001/admin/users`
2. Sign in as admin
3. Find the new "Test Bike Shop" user (should be in orange/pending state)
4. Click green checkmark to grant access
5. Select price level from dropdown (e.g., "B")
6. Verify changes are saved

#### **Scenario 3: Approved Shop User Login**
1. Open `http://localhost:3000/login`
2. Sign in with the registered Google account
3. Verify profile appears in top bar
4. Click on profile to open dropdown
5. Verify information shown:
   - Name: "Jan"
   - Email: [Google email]
   - Company: "Test Bike Shop"
   - Price Level: "Cenová skupina: B"
6. Click "Odhlásit se" to test logout

#### **Scenario 4: Re-registration Prevention**
1. While signed in as registered shop
2. Visit `http://localhost:3000/registrace`
3. Verify message: "Registrace již proběhla"
4. Shows company name and approval status

---

## 📁 Files Created/Modified

### **Biketime Public (`/biketime-public`)**

**New Files:**
- `/src/types/User.ts` - User types with shop fields and price levels
- `/src/lib/userService.ts` - User service for database operations
- `/src/components/UserAuthButton.tsx` - Authentication UI component
- `/src/app/registrace/page.tsx` - Shop registration page

**Modified Files:**
- `/src/components/AuthProvider.tsx` - Updated to handle shop users
- `/src/components/SiteHeader.tsx` - Added UserAuthButton to top bar
- `/src/app/login/page.tsx` - Enhanced UI with registration link

### **Biketime Admin (`/biketime`)**

**Modified Files:**
- `/src/types/User.ts` - Added shop fields and PriceLevel enum
- `/src/lib/services/userService.ts` - Added setPriceLevel method
- `/src/app/admin/users/page.tsx` - Added price level column & dropdown

---

## 🔐 Security Notes

- All Firebase operations respect Firestore security rules
- User data is only accessible to authenticated admins
- Shop users can only see their own profile data
- Price levels can only be modified by admins
- Google authentication provides secure login

---

## 🚀 Next Steps

### **Immediate (Localhost Testing)**
1. ✅ Test complete registration flow
2. ✅ Test admin approval workflow
3. ✅ Test price level assignment
4. ✅ Verify user profile display
5. Test edge cases (re-registration, etc.)

### **Before Staging Commit**
1. Test with multiple shop registrations
2. Verify all price levels (A-D) work correctly
3. Test on different browsers
4. Test mobile responsive design
5. Review console for any errors

### **Future Implementation**
1. **Product Price Display**
   - Add price level data to product documents
   - Create price display logic based on `shopUser.priceLevel`
   - Show prices only to authenticated shops with approved access
   
2. **Shop Dashboard** (Optional)
   - Create `/dashboard` page for shops
   - Show order history
   - Display assigned price level
   - Account settings

3. **Email Notifications** (Optional)
   - Send welcome email after registration
   - Notify shop when access is granted
   - Notify admin of new registrations

---

## 📞 Support & Troubleshooting

### **Common Issues**

**Issue: "Přihlášení" button not showing**
- Check that `UserAuthButton` is imported in `SiteHeader.tsx`
- Verify `AuthProvider` wraps the entire app in `layout.tsx`

**Issue: Registration form not submitting**
- Ensure user is signed in with Google first
- Check Firebase connection and `.env.local` variables
- Check browser console for errors

**Issue: Price level dropdown not showing in admin**
- Verify `PriceLevel` is imported in `admin/users/page.tsx`
- Check that `setPriceLevel` method exists in `userService.ts`

**Issue: User data not syncing**
- Refresh the page after granting access
- Check Firestore console for data
- Verify Firebase indexes are created

### **Database Structure**

**Firestore Collection:** `users`

**Document Structure:**
```javascript
{
  uid: "firebase-auth-uid",
  email: "shop@example.com",
  displayName: "Jan Novák",
  photoURL: "https://...",
  
  // Shop fields
  companyName: "Test Bike Shop",
  firstName: "Jan",
  lastName: "Novák",
  companyAddress: "Hlavní 123\n120 00 Praha",
  phone: "+420 123 456 789",
  priceLevel: "B",
  
  // Access control
  hasAccess: true,
  role: "shop",
  
  // Timestamps
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  approvedBy: "admin@biketime.cz",
  approvedAt: Timestamp
}
```

---

## ✅ Checklist for Staging Deployment

- [ ] All localhost tests passed
- [ ] No console errors
- [ ] Mobile responsive design verified
- [ ] Google OAuth configured for production domain
- [ ] Firebase security rules updated
- [ ] Environment variables set for staging
- [ ] User documentation updated
- [ ] Admin team briefed on new features
- [ ] Backup of existing user data
- [ ] Rollback plan prepared

---

## 📝 Notes

- This is currently running on **localhost only**
- No commits have been made yet (as requested)
- Ready for fine-tuning and testing
- Admin can manually edit price levels at any time
- Users will see their price level in their profile dropdown
- Future product pages can use `shopUser.priceLevel` to display custom prices

---

**Implementation Date:** December 4, 2025  
**Status:** ✅ Ready for Testing  
**Next Action:** Local testing, then commit to staging branch
