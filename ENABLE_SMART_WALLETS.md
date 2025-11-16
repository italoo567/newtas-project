# Enable Coinbase Smart Wallets in Privy Dashboard

## Current Status
- ✅ Embedded wallets are working (fallback)
- ❌ Smart wallets not yet enabled in Privy Dashboard
- The app will work but users will see an 8-second timeout

## Quick Setup (5 minutes)

### Step 1: Go to Privy Dashboard
https://dashboard.privy.io/

### Step 2: Select Your App
- Click on your app: `cmgmh4vtm00ysl50d198fvxik`

### Step 3: Enable Smart Wallets
1. Go to: **Settings**
2. Click: **Smart Wallets**
3. Toggle: **Enable Smart Wallets** (for Ethereum)
4. Choose provider: **Coinbase Smart Wallet** (if available)

### Step 4: Configure Paymaster (Optional but Recommended)
If you want gas sponsorship:

1. Still in Smart Wallets settings
2. Find: **Paymaster URL** or **Gas Sponsorship**
3. Enter:
   ```
   https://api.developer.coinbase.com/rpc/v1/base/34ut3gkiuZadCZR3FB4mWd8Gj1B2Jktt
   ```

### Step 5: Save & Test
1. Click **Save**
2. Go back to your app
3. Log in with email
4. Check console for:
   ```
   ✅ Privy smart wallet is ready
   💼 Smart wallet address: 0x...
   ```

## What Happens Now vs After

### Before Smart Wallet Setup ❌
```
User logs in
→ Embedded wallet created (2 seconds)
→ App waits for smart wallet (8 seconds timeout)
→ Falls back to embedded wallet
→ User can still transact
```

### After Smart Wallet Setup ✅
```
User logs in
→ Embedded wallet created
→ Smart wallet created automatically
→ App uses smart wallet
→ Gas sponsored by Coinbase Paymaster (if configured)
→ Instant smooth experience
```

## Verification

After enabling, you should see in browser console:
```
✅ Privy smart wallet is ready
💼 Smart wallet address: 0x0...
✅ Smart account is ready
```

And NOT see:
```
❌ Wallet creation timeout after 8 seconds
```

## Troubleshooting

### "Still seeing timeout errors"
- Wait 30 seconds after saving in Privy Dashboard
- Hard refresh your app (Ctrl+F5 or Cmd+Shift+R)
- Check if smart wallets toggle is actually ON

### "Smart wallets option not visible"
- Contact Privy support: https://privy.io/slack
- May need to be enabled for your app/plan

### "Want to verify paymaster is working?"
Try deploying a coin and check:
1. Browser console should show `💼 Smart wallet address`
2. Transaction should have 0 gas fee (sponsored)
3. Coinbase dashboard shows the transaction

## Support

- **Privy Docs**: https://docs.privy.io/guide/wallets/smart-wallets
- **Privy Support**: https://privy.io/slack
- **Your App ID**: `cmgmh4vtm00ysl50d198fvxik`
- **Paymaster API Key**: `34ut3gkiuZadCZR3FB4mWd8Gj1B2Jktt`
