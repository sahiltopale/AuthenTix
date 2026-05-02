import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

interface WalletContextType {
  walletAddress: string | null;
  isConnecting: boolean;
  chainName: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({} as WalletContextType);

export const useWallet = () => useContext(WalletContext);

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, handler: (...args: any[]) => void) => void;
      removeListener: (event: string, handler: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const CHAIN_NAMES: Record<string, string> = {
  '0x1': 'Ethereum Mainnet',
  '0xaa36a7': 'Sepolia Testnet',
  '0x89': 'Polygon',
  '0x38': 'BSC',
};

const SEPOLIA_CHAIN_ID = '0xaa36a7';
const SEPOLIA_NETWORK_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: 'Sepolia Testnet',
  nativeCurrency: {
    name: 'SepoliaETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: ['https://rpc.sepolia.org'],
  blockExplorerUrls: ['https://sepolia.etherscan.io'],
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainName, setChainName] = useState<string | null>(null);
  const [manuallyDisconnected, setManuallyDisconnected] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('authentix:wallet-disconnected') === '1';
  });
  const { updateWalletAddress, user, profile } = useAuth();

  const ensureSepoliaNetwork = useCallback(async () => {
    if (!window.ethereum) throw new Error('MetaMask is not installed');

    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChainId === SEPOLIA_CHAIN_ID) return currentChainId;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return SEPOLIA_CHAIN_ID;
    } catch (error: any) {
      if (error?.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [SEPOLIA_NETWORK_PARAMS],
        });
        return SEPOLIA_CHAIN_ID;
      }

      if (error?.code === 4001) {
        throw new Error('Please switch MetaMask to Sepolia to continue.');
      }

      throw error;
    }
  }, []);

  // Restore wallet on load if profile has one
  useEffect(() => {
    if (manuallyDisconnected) return;
    if (profile?.wallet_address && !walletAddress && window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
        if (accounts[0]?.toLowerCase() === profile.wallet_address?.toLowerCase()) {
          setWalletAddress(accounts[0]);
          window.ethereum!.request({ method: 'eth_chainId' }).then((chainId: string) => {
            setChainName(CHAIN_NAMES[chainId] || `Chain ${parseInt(chainId, 16)}`);
          });
        }
      }).catch(() => {});
    }
  }, [profile, walletAddress, manuallyDisconnected]);

  useEffect(() => {
    if (manuallyDisconnected) return;
    if (user && walletAddress && profile?.wallet_address?.toLowerCase() !== walletAddress.toLowerCase()) {
      updateWalletAddress(walletAddress).catch(() => {});
    }
  }, [user, walletAddress, profile?.wallet_address, updateWalletAddress, manuallyDisconnected]);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
        setChainName(null);
      } else {
        if (manuallyDisconnected) return;
        setWalletAddress(accounts[0]);
        if (user) updateWalletAddress(accounts[0]);
      }
    };
    const handleChainChanged = (chainId: string) => {
      setChainName(CHAIN_NAMES[chainId] || `Chain ${parseInt(chainId, 16)}`);
    };
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [user, updateWalletAddress, manuallyDisconnected]);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask browser extension to connect your wallet.',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }
    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const address = accounts[0];
      const chainId = await ensureSepoliaNetwork();

      // Clear manual-disconnect flag since user is reconnecting intentionally
      setManuallyDisconnected(false);
      if (typeof window !== 'undefined') localStorage.removeItem('authentix:wallet-disconnected');

      setWalletAddress(address);
      setChainName(CHAIN_NAMES[chainId] || `Chain ${parseInt(chainId, 16)}`);

      if (user) await updateWalletAddress(address);

      toast({
        title: 'Wallet Connected 🦊',
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
    } catch (err: any) {
      if (err.code === 4001) {
        toast({ title: 'Connection Rejected', description: 'You rejected the wallet connection request.', variant: 'destructive' });
      } else {
        toast({ title: 'Connection Failed', description: err.message || 'Failed to connect wallet.', variant: 'destructive' });
      }
    } finally {
      setIsConnecting(false);
    }
  }, [ensureSepoliaNetwork, user, updateWalletAddress]);

  const disconnectWallet = useCallback(() => {
    setManuallyDisconnected(true);
    if (typeof window !== 'undefined') localStorage.setItem('authentix:wallet-disconnected', '1');
    setWalletAddress(null);
    setChainName(null);
    // Clear stored wallet on profile so it isn't auto-restored
    if (user) updateWalletAddress('').catch(() => {});
    toast({ title: 'Wallet Disconnected', description: 'Your wallet has been disconnected.' });
  }, [user, updateWalletAddress]);

  return (
    <WalletContext.Provider value={{ walletAddress, isConnecting, chainName, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
};
