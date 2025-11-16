# ✅ Post-Migration Checklist

## Immediate Actions

- [ ] **Test in Development**
  ```bash
  npm run dev
  ```
  Verify the dev server starts without errors

- [ ] **Test User Signup Flow**
  1. Clear browser storage
  2. Sign up with new email
  3. Check browser console for wallet creation logs
  4. Verify `smartAccountAddress` is populated

- [ ] **Test Coin Creation**
  1. Create a test coin as email user
  2. Verify transaction goes through
  3. Check if gas fee is deducted (should be 0 if Coinbase Paymaster configured)

- [ ] **Verify Console Logs**
  Look for these log messages indicating success:
  ```
  ✅ Privy smart wallet is ready
  💼 Smart wallet address: 0x...
  ```

---

## Privy Dashboard Configuration

- [ ] **Go to https://dashboard.privy.io/**

- [ ] **In Your App Settings:**
  - [ ] Smart Wallets: **Enabled**
  - [ ] Provider: **Coinbase Smart Wallet** selected
  - [ ] Create on login: **"all-users"** or **"users-without-wallets"**

- [ ] **Optional - Gas Sponsorship Setup:**
  - [ ] Paymaster URL configured (if you have Coinbase Paymaster API key)
  - [ ] Format: `https://api.developer.coinbase.com/rpc/v1/base/{YOUR_API_KEY}`

---

## Environment Setup

- [ ] **Verify `.env.local` has:**
  ```bash
  VITE_PRIVY_APP_ID=cmgmh4vtm00ysl50d198fvxik
  VITE_COINBASE_PAYMASTER_API_KEY=your_key_if_using_gas_sponsorship
  ```

- [ ] **npm install completed successfully**
  ```bash
  npm install --legacy-peer-deps
  ```

---

## Code Quality Checks

- [ ] **No TypeScript errors**
  ```bash
  npm run check
  ```

- [ ] **Build succeeds**
  ```bash
  npm run build
  ```

- [ ] **Test key components:**
  - [ ] `SmartAccountContext.tsx` - No permissionless imports
  - [ ] `content-preview.tsx` - No smartAccountClient usage
  - [ ] `withdraw-earnings-modal.tsx` - Uses standard Ethereum provider

---

## Testing Scenarios

### Scenario 1: Email User Signup
- [ ] User signs up with email
- [ ] Smart wallet created automatically
- [ ] Create coin transaction succeeds
- [ ] Expected: `hasSmartWallet: true` in console

### Scenario 2: Wallet User Signup
- [ ] User connects wallet (MetaMask, etc.)
- [ ] Verify flow still works
- [ ] Expected: User can still create coins

### Scenario 3: Gas Sponsorship (if configured)
- [ ] Create coin as email user
- [ ] Check wallet balance before/after
- [ ] Expected: No gas fees deducted (or minimal Base Chain fee)

### Scenario 4: Timeout Recovery
- [ ] Simulate slow network (DevTools)
- [ ] User should get timeout error after 15 seconds
- [ ] `retryWalletCreation()` button should work
- [ ] Expected: Can retry and complete action

---

## Documentation

- [ ] **Read migration guide:**
  `PRIVY_NATIVE_MIGRATION.md`

- [ ] **Review SmartAccountContext changes:**
  Check the new simplified implementation

- [ ] **Update internal docs** (if you have them) with:
  - New smart wallet system (Coinbase via Privy)
  - Gas sponsorship configuration method
  - Removed permissionless.js dependency

---

## Deployment Readiness

### Pre-Deployment
- [ ] All tests passing locally
- [ ] Smart wallet creation works
- [ ] Transactions go through
- [ ] No console errors

### Staging Deployment
- [ ] Deploy to staging environment
- [ ] Run full user flow tests
- [ ] Monitor wallet creation success rate
- [ ] Check gas sponsorship (if applicable)

### Production Deployment
- [ ] Prepare rollback plan (keep old branch available)
- [ ] Deploy with monitoring enabled
- [ ] Track wallet creation metrics
- [ ] Monitor error rates
- [ ] Have support team briefed on changes

---

## Monitoring After Deployment

Track these metrics:

1. **Wallet Creation Success Rate**
   - Target: > 95% success rate
   - Alert if < 90% for 30+ minutes

2. **Smart Wallet Detection**
   - Monitor `hasSmartWallet: true` rate
   - Should be 95%+ of new users (email users)

3. **Transaction Success Rate**
   - Create coin transactions
   - Withdrawal transactions
   - Target: > 98% success

4. **Error Tracking**
   - Monitor `Wallet creation timeout` errors
   - Monitor Privy API errors
   - Set up alerts for spikes

---

## Rollback Plan

If issues arise:

1. **Quick Rollback Option 1: Revert commit**
   ```bash
   git revert <commit_hash>
   npm install
   npm run build
   npm run start
   ```

2. **Quick Rollback Option 2: Restore from backup**
   - Previous build artifacts available
   - Previous `package.json` has old dependencies

3. **Gradual Rollback**
   - Deploy old version to canary (10% traffic)
   - Monitor metrics
   - Roll forward or back based on results

---

## Support & Resources

- **Privy Documentation**: https://docs.privy.io/
- **Privy Smart Wallets**: https://docs.privy.io/wallets/using-wallets/evm-smart-wallets
- **Coinbase Smart Wallet**: https://docs.coinbase.com/wallet-sdk/

---

## Questions During Testing?

Check these resources in order:
1. `PRIVY_NATIVE_MIGRATION.md` - Technical details
2. `WALLET_TIMEOUT_QUICK_FIX.md` - Common issues
3. Browser console logs - Usually shows exact issue
4. Privy Dashboard - Verify configuration
5. Privy Support - https://privy.io/slack

---

**Checklist created**: November 15, 2025
**Migration status**: ✅ Complete
**Ready for testing**: Yes
