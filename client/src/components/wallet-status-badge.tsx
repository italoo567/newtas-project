import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Badge } from '@/components/ui/badge';
import { Zap, Shield, AlertCircle } from 'lucide-react';

/**
 * Displays which type of wallet the user is currently using
 */
export function WalletStatusBadge() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  if (!authenticated || !user) {
    return null;
  }

  // Check for smart wallet
  const smartWallet = wallets?.find(
    (wallet) => wallet.walletClientType === 'privy' && wallet.connectorType === 'smart_wallet'
  );

  // Check for embedded wallet
  const embeddedWallet = wallets?.find(
    (wallet) => wallet.walletClientType === 'privy' && wallet.connectorType !== 'smart_wallet'
  );

  // Determine wallet type
  const isSmartWallet = !!smartWallet;
  const isEmbeddedWallet = !!embeddedWallet && !isSmartWallet;
  const walletAddress = smartWallet?.address || embeddedWallet?.address || user?.wallet?.address;

  if (!walletAddress) {
    return (
      <Badge variant="outline" className="gap-2">
        <AlertCircle className="w-3 h-3" />
        <span className="text-xs">No wallet</span>
      </Badge>
    );
  }

  if (isSmartWallet) {
    return (
      <Badge variant="default" className="gap-2 bg-green-600 hover:bg-green-700">
        <Zap className="w-3 h-3" />
        <span className="text-xs">Smart Wallet (Gasless)</span>
      </Badge>
    );
  }

  if (isEmbeddedWallet) {
    return (
      <Badge variant="secondary" className="gap-2">
        <Shield className="w-3 h-3" />
        <span className="text-xs">Embedded Wallet</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-2">
      <AlertCircle className="w-3 h-3" />
      <span className="text-xs">Unknown wallet</span>
    </Badge>
  );
}

/**
 * Detailed wallet info for debugging (shows in console)
 */
export function logWalletInfo() {
  const { authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  if (!authenticated) return;

  const smartWallet = wallets?.find(
    (wallet) => wallet.walletClientType === 'privy' && wallet.connectorType === 'smart_wallet'
  );
  const embeddedWallet = wallets?.find(
    (wallet) => wallet.walletClientType === 'privy' && wallet.connectorType !== 'smart_wallet'
  );

  console.group('💼 Wallet Status');
  console.log('User ID:', user?.id);
  console.log('Smart Wallet:', {
    available: !!smartWallet,
    address: smartWallet?.address,
    connectorType: smartWallet?.connectorType,
  });
  console.log('Embedded Wallet:', {
    available: !!embeddedWallet,
    address: embeddedWallet?.address,
    connectorType: embeddedWallet?.connectorType,
  });
  console.log('User.wallet:', {
    address: user?.wallet?.address,
  });
  console.log('All wallets:', wallets);
  console.groupEnd();
}
