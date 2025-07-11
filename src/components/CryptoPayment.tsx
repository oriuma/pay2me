import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WalletModal } from "./WalletModal";
import { ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

export function CryptoPayment() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleWalletSelect = async (walletType: string) => {
    try {
      // Check if MetaMask is available
      if (typeof window.ethereum === 'undefined') {
        toast({
          title: "Wallet not found",
          description: "Please install MetaMask or another Web3 wallet.",
          variant: "destructive"
        });
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        // Get network info
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        
        // Mock wallet info for demo
        setWalletInfo({
          address: accounts[0],
          balance: "$0.05 USDC",
          network: "Base Sepolia"
        });
        
        setIsConnected(true);
        
        toast({
          title: "Wallet Connected",
          description: "You can now proceed with payment.",
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast({
        title: "Connection failed",
        description: "Unable to connect to wallet. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
      
      // Here you would integrate with actual payment processing
      
    } catch (error) {
      toast({
        title: "Payment failed",
        description: "Unable to process payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-6 shadow-lg">
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">
            Payment Required
          </h1>
          
          <p className="text-muted-foreground leading-relaxed">
            Pay in crypto for premium access to the resource. To access
            this content, please pay $0.05 Base Sepolia USDC.
          </p>
          
          <p className="text-sm">
            <span className="text-muted-foreground">Need Base Sepolia USDC? </span>
            <a 
              href="#" 
              className="text-crypto-blue hover:text-crypto-blue-hover inline-flex items-center gap-1 transition-colors"
            >
              Get some here.
              <ExternalLink size={12} />
            </a>
          </p>
        </div>

        {isConnected && walletInfo && (
          <div className="bg-crypto-connected p-4 rounded-lg space-y-3 animate-slide-down">
            <div className="text-center text-sm font-medium text-crypto-blue mb-2">
              Connected
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Wallet:</span>
                <span className="font-mono">{formatAddress(walletInfo.address)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">{walletInfo.balance}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <span className="font-medium">{walletInfo.network}</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-4">
          {!isConnected ? (
            <Button
              onClick={() => setIsWalletModalOpen(true)}
              className="w-full h-12 text-base font-medium bg-crypto-blue hover:bg-crypto-blue-hover text-white transition-all duration-300 animate-breathe"
              style={{ background: 'var(--gradient-blue)' }}
            >
              Connect wallet
            </Button>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 text-base font-medium bg-crypto-green hover:bg-crypto-green-hover text-white transition-all duration-300 animate-glow"
              style={{ background: 'var(--gradient-green)' }}
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Processing...
                </div>
              ) : (
                "Pay Now"
              )}
            </Button>
          )}
        </div>

        {isConnected && (
          <p className="text-xs text-muted-foreground">
            Wallet connected! You can now proceed with payment.
          </p>
        )}
      </Card>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onWalletSelect={handleWalletSelect}
      />
    </div>
  );
}

// Extend the Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}