import { PrivyProvider, usePrivy } from '@privy-io/react-auth';
import { base, baseSepolia } from 'viem/chains';
import { SmartAccountProvider } from '@/contexts/SmartAccountContext';
import { useEffect, useRef } from 'react';

function AuthHandler({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const hasHandledLogin = useRef(false);

  useEffect(() => {
    if (!ready || !authenticated || !user || hasHandledLogin.current) {
      return;
    }

    const handleLogin = async () => {
      try {
        console.log('🔐 [Privy AuthHandler] User logged in:', { userId: user.id, hasLinkedWallet: !!user.wallet, email: user.email?.address });
        
        // For email users, check if an embedded wallet exists; if not, they may need to link one
        const hasEmbeddedWallet = user.linkedAccounts?.some((acc: any) => acc.type === 'embedded_wallet');
        console.log('🔐 [Privy AuthHandler] Embedded wallet linked:', hasEmbeddedWallet);

        // Get Privy user ID (primary identifier)
        const privyId = user?.id;
        // Get wallet address if available (wallet login or embedded wallet)
        const address = user?.wallet?.address || null;
        // Get email if available (email login)
        const email = user?.email?.address || null;

        if (!privyId) {
          console.error('No Privy ID found for user');
          return;
        }

        console.log('User logged in:', { privyId, address, email });

        // Create or update creator profile - wait for this to complete
        const creatorResponse = await fetch('/api/creators/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            privyId, 
            address: address || null,
            email: email || null 
          }),
          credentials: 'include',
        });

        if (!creatorResponse.ok) {
          const errorData = await creatorResponse.json();
          console.error('❌ Failed to sync creator profile:', errorData);
          return;
        }

        const creatorData = await creatorResponse.json();
        console.log('✅ Creator profile synced:', creatorData.id);

        // Trigger daily login to award welcome bonus (works for both email and wallet users)
        if (privyId) {
          try {
            const response = await fetch('/api/login-streak/check-in', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                privyId, 
                address: address || null // address can be null for email users
              }),
              credentials: 'include',
            });

            if (response.ok) {
              const data = await response.json();
              if (data.isFirstLogin) {
                console.log('✅ Welcome bonus awarded!', data);
                // Show success notification to user
                const event = new CustomEvent('e1xp-claimed', { 
                  detail: { 
                    points: data.pointsEarned || 10,
                    message: 'Welcome to CoinIT! 🎉'
                  }
                });
                window.dispatchEvent(event);
              } else if (data.pointsEarned > 0) {
                console.log('✅ Daily login bonus!', data);
              }
            } else {
              console.warn('⚠️ Login streak check-in returned status:', response.status);
              // Don't block login if this fails - it's non-critical
            }
          } catch (streakError) {
            console.warn('⚠️ Login streak error (non-blocking):', streakError);
            // Continue anyway - streak bonus is nice-to-have, not critical
          }
        }

        hasHandledLogin.current = true;
      } catch (error) {
        console.error('Failed to handle login:', error);
      }
    };

    handleLogin();
  }, [ready, authenticated, user]);

  return <>{children}</>;
}

export function AppPrivyProvider({ children }: { children: React.ReactNode }) {
  console.log('🔐 PrivyProvider initializing with appId:', import.meta.env.VITE_PRIVY_APP_ID);

  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID || ''}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#22c55e',
          logo: 'https://i.ibb.co/JRQCPsZK/ev122logo-1-1.png',
          landingHeader: 'Welcome to Every1.fun',
          showWalletLoginFirst: false,
        },
        defaultChain: base,
        supportedChains: [base, baseSepolia],
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'all-users',
          },
          showWalletUIs: false,
        },
      }}
    >
      <AuthHandler>
        <SmartAccountProvider>
          {children}
        </SmartAccountProvider>
      </AuthHandler>
    </PrivyProvider>
  );
}