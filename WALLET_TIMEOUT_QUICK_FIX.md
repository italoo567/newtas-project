# 🔍 Wallet Timeout Troubleshooting Checklist

## Quick Diagnosis

Use this checklist to quickly diagnose wallet creation timeout issues.

### ✅ Privy Configuration
- [ ] Embedded Wallets **enabled** in Privy Dashboard (https://dashboard.privy.io/)
- [ ] `createOnLogin: 'all-users'` in `client/src/lib/privy-provider.tsx`
- [ ] `VITE_PRIVY_APP_ID` set in `.env.local`
- [ ] Using correct Privy App ID (from dashboard)

### ✅ Browser Console Logs
When you sign up with email, you should see (in order):
```
[1] 🔐 PrivyProvider initializing with appId: cmgmh4vtm00ysl50d198fvxik
[2] 🔎 Privy state check (effect): { ready: true, authenticated: true, walletsLength: 1, wallets: [...] }
[3] ✅ Privy wallet is ready
[4] 💼 Found wallet: privy
[5] ✅ Smart account created: 0x...
```

### ⚠️ If You See Timeout Instead
```
[1] 🔐 PrivyProvider initializing...
[2] 🔎 Privy state check (effect): { ready: true, authenticated: true, walletsLength: 0, wallets: [] }
[3] ⏳ Starting wallet readiness watcher...
[4] ❌ Wallet creation timeout after 15 seconds
```

## Root Causes & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `walletsLength: 0` immediately after login | Embedded wallets disabled in Privy | Go to https://dashboard.privy.io/ → Settings → Enable "Embedded Wallets" |
| Wallet appears in linked accounts but not wallets array | Privy sync delay | Wait 2-3 seconds or call `retryWalletCreation()` |
| Always timeouts even after refresh | Invalid Privy App ID | Verify `VITE_PRIVY_APP_ID` matches dashboard |
| Privy not loading at all | Missing environment variable | Add `VITE_PRIVY_APP_ID=xxx` to `.env.local` and restart dev server |

## Debug: Access the Debugging Context

In any component that uses `useSmartAccount()`:

```tsx
import { useSmartAccount } from '@/contexts/SmartAccountContext';

export function MyComponent() {
  const { 
    smartAccountStatus, 
    error,
    walletCreationDebugging 
  } = useSmartAccount();

  console.log('Smart Account State:', {
    status: smartAccountStatus,
    error,
    wallet: walletCreationDebugging,
  });

  return (
    <div>
      {/* Status: {smartAccountStatus} */}
      {/* Wallet Count: {walletCreationDebugging.walletsCount} */}
      {/* Has Embedded: {walletCreationDebugging.hasEmbeddedWallet ? '✅' : '❌'} */}
    </div>
  );
}
```

## Quick Tests

### Test 1: Fresh Login
```bash
1. Clear browser cookies for localhost
2. Run: npm run dev
3. Go to http://localhost:5173
4. Sign up with new email
5. Check console for wallet creation logs
```

### Test 2: Check Privy Dashboard
```bash
1. Go to https://dashboard.privy.io/
2. Find your app
3. Click "Settings" 
4. Look for "Embedded Wallets" toggle
5. It should be ON (green)
```

### Test 3: Verify Environment
```bash
grep VITE_PRIVY_APP_ID .env.local
# Should output: VITE_PRIVY_APP_ID=cmgmh4vtm00ysl50d198fvxik
# (or whatever your actual ID is)
```

## When All Else Fails

### Full Reset
```bash
1. Stop dev server (Ctrl+C)
2. Clear node_modules: rm -rf node_modules
3. Reinstall: npm install
4. Clear browser cache: DevTools → Settings → Clear Site Data
5. npm run dev
6. Try signup again
```

### Check Logs in Browser DevTools
1. Open DevTools (F12)
2. Go to Console tab
3. Look for any red errors from `@privy-io`
4. Check Network tab for failed requests to `api.privy.io`

### Manual Testing
```tsx
// In browser console (after login)
import { usePrivy, useWallets } from '@privy-io/react-auth';

// Copy this into React DevTools Console
window.__privy = { usePrivy, useWallets };

// Then use to check state
const { authenticated, ready } = usePrivy();
const { wallets } = useWallets();
console.log({ authenticated, ready, wallets });
```

## File References
- Context implementation: `client/src/contexts/SmartAccountContext.tsx`
- Privy config: `client/src/lib/privy-provider.tsx`
- Detailed guide: `WALLET_CREATION_TIMEOUT_FIX.md`

---

**Last Updated**: November 15, 2025
**Timeout Duration**: 15 seconds (was 60 seconds)
**Status**: ✅ Fixed and tested
