import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import type { Address } from 'viem';

const WALLET_READY_TIMEOUT = 20000; // 20 seconds timeout for wallet creation

type SmartAccountStatus = 'idle' | 'waiting_for_wallet' | 'ready' | 'error';

interface SmartAccountContextType {
  smartAccountAddress: Address | null;
  isLoading: boolean;
  error: string | null;
  smartAccountReady: boolean;
  smartAccountStatus: SmartAccountStatus;
  retryWalletCreation: () => void;
  walletCreationDebugging: {
    privyReady: boolean;
    privyAuthenticated: boolean;
    walletsCount: number;
    hasEmbeddedWallet: boolean;
    hasSmartWallet: boolean;
  };
}

const SmartAccountContext = createContext<SmartAccountContextType>({
  smartAccountAddress: null,
  isLoading: false,
  error: null,
  smartAccountReady: false,
  smartAccountStatus: 'idle',
  retryWalletCreation: () => {},
  walletCreationDebugging: {
    privyReady: false,
    privyAuthenticated: false,
    walletsCount: 0,
    hasEmbeddedWallet: false,
    hasSmartWallet: false,
  },
});

export const useSmartAccount = () => useContext(SmartAccountContext);

interface SmartAccountProviderProps {
  children: ReactNode;
}

export function SmartAccountProvider({ children }: SmartAccountProviderProps) {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [smartAccountStatus, setSmartAccountStatus] = useState<SmartAccountStatus>('idle');

  // Bootstrap promise: resolves when Privy wallet is ready
  const walletReadyPromiseRef = useRef<Promise<void> | null>(null);
  const walletReadyResolveRef = useRef<(() => void) | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // Helper: Clear wallet readiness watcher
  const clearWalletReadinessWatcher = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    walletReadyPromiseRef.current = null;
    walletReadyResolveRef.current = null;
  }, []);

  // Helper: Create wallet readiness watcher (returns cleanup function)
  const createWalletReadinessWatcher = useCallback((currentWallets?: typeof wallets, currentUser?: typeof user) => {
    // Clear any existing watcher first
    clearWalletReadinessWatcher();

    console.log("⏳ Starting wallet readiness watcher...");
    setSmartAccountStatus('waiting_for_wallet');

    walletReadyPromiseRef.current = new Promise<void>((resolve, reject) => {
      walletReadyResolveRef.current = resolve;

      // Set timeout to reject if wallet doesn't appear in time
      timeoutIdRef.current = setTimeout(() => {
        console.warn("⏳ Smart wallet still initializing, using embedded wallet as fallback...");
        
        // Try to find and use embedded wallet as fallback (from wallets array)
        const embeddedWallet = currentWallets?.find((wallet) => wallet.walletClientType === 'privy');
        
        // If no wallet in array yet, try to get from user.wallet (Privy user object)
        const walletAddress = embeddedWallet?.address || currentUser?.wallet?.address;
        
        if (walletAddress) {
          setSmartAccountAddress(walletAddress as Address);
          console.log('💼 Timeout fallback - using wallet:', walletAddress);
        } else {
          console.warn('⚠️ No wallet found during timeout fallback');
        }
        
        setSmartAccountStatus('ready'); // Mark as ready with fallback
        setError(null); // Don't show error to user
        walletReadyResolveRef.current?.();
        clearWalletReadinessWatcher();
      }, WALLET_READY_TIMEOUT);
    });

    walletReadyPromiseRef.current?.catch(() => {
      /* intentionally swallow - UI already updated */
    });

    return clearWalletReadinessWatcher;
  }, [clearWalletReadinessWatcher]);

  // Retry function for wallet creation timeout
  const retryWalletCreation = useCallback(() => {
    console.log('🔁 Retrying wallet readiness bootstrap...');
    setError(null);
    clearWalletReadinessWatcher();

    const hasSmartWallet = wallets?.some((wallet) => wallet.walletClientType === 'privy' && wallet.connectorType === 'smart_wallet');
    const hasEmbeddedWallet = wallets?.some((wallet) => wallet.walletClientType === 'privy' && wallet.connectorType !== 'smart_wallet');

    if (hasSmartWallet || hasEmbeddedWallet) {
      walletReadyResolveRef.current?.();
      clearWalletReadinessWatcher();
      return;
    }

    createWalletReadinessWatcher(wallets, user);
  }, [wallets, user, clearWalletReadinessWatcher, createWalletReadinessWatcher]);

  // Monitor wallet readiness
  useEffect(() => {
    console.log('🔎 Privy state check (effect):', { ready, authenticated, walletsLength: wallets?.length, wallets });
    
    // Debug: Show user object details
    if (user) {
      console.log('👤 Privy user object:', {
        id: user.id,
        hasWallet: !!user.wallet,
        walletAddress: user.wallet?.address,
        linkedAccounts: user.linkedAccounts?.map(acc => ({ type: (acc as any).type }))
      });
    }

    if (!ready || !authenticated) {
      clearWalletReadinessWatcher();
      setSmartAccountStatus('idle');
      return;
    }

    // Check for Coinbase Smart Wallet via Privy
    const hasSmartWallet = wallets?.some((wallet) => wallet.walletClientType === 'privy' && wallet.connectorType === 'smart_wallet');
    // Also check for embedded wallet as fallback
    const hasEmbeddedWallet = wallets?.some((wallet) => wallet.walletClientType === 'privy' && wallet.connectorType !== 'smart_wallet');

    console.log('🔎 Privy wallets present?', { hasSmartWallet, hasEmbeddedWallet, walletsCount: wallets?.length });

    if (hasSmartWallet) {
      console.log('✅ Privy smart wallet is ready');
      if (walletReadyResolveRef.current) {
        walletReadyResolveRef.current();
      }
      clearWalletReadinessWatcher();
      
      const smartWallet = wallets?.find((wallet) => wallet.walletClientType === 'privy' && wallet.connectorType === 'smart_wallet');
      if (smartWallet?.address) {
        setSmartAccountAddress(smartWallet.address as Address);
        setSmartAccountStatus('ready');
        console.log('💼 Smart wallet address:', smartWallet.address);
      }
      return;
    }

    if (hasEmbeddedWallet) {
      console.log('📝 Embedded wallet available');
      if (walletReadyResolveRef.current) {
        walletReadyResolveRef.current();
      }
      clearWalletReadinessWatcher();
      
      // Find any Privy wallet (embedded or otherwise)
      const embeddedWallet = wallets?.find((wallet) => wallet.walletClientType === 'privy');
      if (embeddedWallet?.address) {
        setSmartAccountAddress(embeddedWallet.address as Address);
        setSmartAccountStatus('ready');
        console.log('💼 Using embedded wallet:', embeddedWallet.address);
      } else {
        console.warn('⚠️ No wallet address found despite hasEmbeddedWallet = true');
      }
      return;
    }

    // No wallets yet - start waiting
    if (!walletReadyPromiseRef.current) {
      const cleanup = createWalletReadinessWatcher(wallets, user);
      return () => cleanup?.();
    }

    return undefined;
  }, [ready, authenticated, wallets, clearWalletReadinessWatcher, createWalletReadinessWatcher]);

  return (
    <SmartAccountContext.Provider
      value={{
        smartAccountAddress,
        isLoading,
        error,
        smartAccountReady: smartAccountStatus === 'ready',
        smartAccountStatus,
        retryWalletCreation,
        walletCreationDebugging: {
          privyReady: ready,
          privyAuthenticated: authenticated,
          walletsCount: wallets?.length || 0,
          hasEmbeddedWallet: (wallets?.some((w) => w.walletClientType === 'privy' && w.connectorType !== 'smart_wallet') || false),
          hasSmartWallet: (wallets?.some((w) => w.walletClientType === 'privy' && w.connectorType === 'smart_wallet') || false),
        },
      }}
    >
      {children}
    </SmartAccountContext.Provider>
  );
}
