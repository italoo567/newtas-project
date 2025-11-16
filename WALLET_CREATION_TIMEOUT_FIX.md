# 🔧 Wallet Creation Timeout Fix

## Problem
The SmartAccountContext was timing out after 60 seconds while waiting for a Privy embedded wallet that never appeared:

```
SmartAccountContext.tsx:268 🔎 Privy state check (effect): {ready: true, authenticated: true, walletsLength: 0, wallets: Array(0)}
SmartAccountContext.tsx:81 ❌ Wallet creation timeout after 60 seconds
```

**Root Cause**: The embedded wallet was not being created or added to the `wallets` array, causing the context to timeout waiting for it.

---

## Changes Made

### 1. **Reduced Timeout from 60s to 15s**
   - **File**: `SmartAccountContext.tsx` line 13
   - **Change**: `WALLET_READY_TIMEOUT = 15000` (was 60000)
   - **Reason**: Faster feedback loop for debugging. 15 seconds is reasonable for wallet creation.

### 2. **Improved Wallet Detection Logic**
   - **File**: `SmartAccountContext.tsx` lines 302-325
   - **Added**: New effect to check user's `linkedAccounts` for embedded wallet evidence
   - **Benefit**: Can now detect if wallet exists but hasn't synced to `wallets` array yet
   - **Logs**: Better diagnostics showing account types and sync status

### 3. **Better Error Messages**
   - **File**: `SmartAccountContext.tsx` line 156
   - **Change**: More detailed logging showing available wallets and their types
   - **Benefit**: Easier debugging of wallet configuration issues

### 4. **Improved Auto-initialization Logic**
   - **File**: `SmartAccountContext.tsx` lines 327-349
   - **Change**: More explicit checks before attempting initialization
   - **Benefit**: Clearer console logs showing exactly what's waiting for

### 5. **Added Debugging Context**
   - **File**: `SmartAccountContext.tsx` interface updates
   - **New Property**: `walletCreationDebugging` object containing:
     - `privyReady`: Is Privy ready?
     - `privyAuthenticated`: Is user authenticated?
     - `walletsCount`: How many wallets does user have?
     - `hasEmbeddedWallet`: Is embedded wallet present?
   - **Benefit**: Components can now access this info for UI feedback

---

## How to Debug Wallet Creation Issues

### Step 1: Check Browser Console
Look for these logs in order:

```
🔐 PrivyProvider initializing with appId: [your-app-id]
🔎 Privy state check (effect): { ready, authenticated, walletsLength, wallets }
📝 Embedded wallet found in linkedAccounts...
⏳ Waiting for Privy embedded wallet...
💼 Found wallet: privy
```

### Step 2: Verify Privy Configuration
Check `client/src/lib/privy-provider.tsx`:
```tsx
embeddedWallets: {
  ethereum: {
    createOnLogin: 'all-users',  // ✅ Should be 'all-users'
  },
  showWalletUIs: false,
},
```

### Step 3: Check Privy Dashboard
1. Go to https://dashboard.privy.io/
2. Select your app
3. Settings → Embedded Wallets: **MUST BE ENABLED**
4. The wallet should be created immediately on login

### Step 4: Monitor State Changes
The context now provides debugging info:
```tsx
const { walletCreationDebugging } = useSmartAccount();

// In your component
console.log('Wallet debugging:', {
  privyReady: walletCreationDebugging.privyReady,
  authenticated: walletCreationDebugging.privyAuthenticated,
  walletsCount: walletCreationDebugging.walletsCount,
  hasEmbeddedWallet: walletCreationDebugging.hasEmbeddedWallet,
});
```

### Step 5: Common Issues & Solutions

#### Issue: `walletsLength: 0` in logs
**Likely Causes**:
- Embedded Wallets not enabled in Privy Dashboard
- User hasn't fully authenticated yet
- Privy config missing `createOnLogin: 'all-users'`

**Fix**: 
- Enable Embedded Wallets in Privy Dashboard
- Ensure `createOnLogin` is set to `'all-users'` in config
- Wait for `ready && authenticated` before expecting wallets

#### Issue: Wallet appears in `linkedAccounts` but not `wallets` array
**Likely Cause**: Privy is still syncing the wallet to the `useWallets()` hook

**Fix**: 
- Context now handles this with timeout, then provides retry option
- Call `retryWalletCreation()` to manually trigger initialization

#### Issue: Persistent timeout after 15 seconds
**Likely Causes**:
- Privy configuration is incorrect
- App ID is invalid
- Embedded wallets are disabled

**Fix**:
1. Double-check Privy configuration in dashboard
2. Verify environment variable: `VITE_PRIVY_APP_ID`
3. Check browser network tab for Privy API errors
4. Try logging out and back in

---

## Testing the Fix

### Test 1: Successful Wallet Creation
```
1. Open app
2. Click "Sign Up with Email"
3. Complete email signup
4. Should see in console:
   - ✅ Privy wallet is ready
   - 💼 Found wallet: privy
   - ✅ Smart account created: 0x...
```

### Test 2: Wallet Creation Timeout Recovery
```
1. Disable Privy in dashboard temporarily
2. Refresh page after signup
3. Should see:
   - ⏳ Starting wallet readiness watcher
   - ❌ Wallet creation timeout after 15 seconds
   - 🔁 Retrying wallet readiness bootstrap (manual)
```

---

## Related Files
- `client/src/contexts/SmartAccountContext.tsx` - Main implementation
- `client/src/lib/privy-provider.tsx` - Privy configuration
- `client/src/components/content-preview.tsx` - Uses smart account
- `client/src/pages/profile.tsx` - Uses smart account

## References
- [Privy Embedded Wallets Docs](https://docs.privy.io/guide/concepts/embedded-wallets)
- [Privy React SDK](https://docs.privy.io/guide/react)
