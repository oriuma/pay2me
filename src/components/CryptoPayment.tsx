import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { WalletModal } from "./WalletModal";
import { AnimatedNumber } from "./AnimatedNumber";
import { ExternalLink, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";

interface WalletInfo {
  address: string;
  balance: string;
  network: string;
}

// Base Sepolia network configuration
const BASE_SEPOLIA_CHAIN_ID = "0x14a34"; // 84532 in hex
const BASE_SEPOLIA_CONFIG = {
  chainId: BASE_SEPOLIA_CHAIN_ID,
  chainName: "Base Sepolia",
  nativeCurrency: {
    name: "ETH",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia-explorer.base.org"]
};

// USDC Contract address on Base Sepolia
const USDC_CONTRACT_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const RECIPIENT_ADDRESS = "0x75bB73a75EeCc43ffeAa3B48733292437C405f25";

// USDC has 6 decimals
const USDC_DECIMALS = 6;

// ERC-20 ABI for transfer function
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) public returns (bool)",
  "function balanceOf(address account) public view returns (uint256)",
  "function decimals() public view returns (uint8)"
];

export function CryptoPayment() {
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(5.00); // Default $5.00
  const [wrongNetwork, setWrongNetwork] = useState(false);
  const { toast } = useToast();

  // Check network and switch if needed
  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return false;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (chainId !== BASE_SEPOLIA_CHAIN_ID) {
        setWrongNetwork(true);
        
        try {
          // Try to switch to Base Sepolia
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_SEPOLIA_CHAIN_ID }],
          });
        } catch (switchError: any) {
          // If network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [BASE_SEPOLIA_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
        setWrongNetwork(false);
      }
      return true;
    } catch (error) {
      console.error('Network switch error:', error);
      toast({
        title: "Network Switch Failed",
        description: "Please manually switch to Base Sepolia network.",
        variant: "destructive"
      });
      return false;
    }
  };

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
        // Check and switch network
        const networkOk = await checkAndSwitchNetwork();
        if (!networkOk) return;
        
        // Get USDC balance
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, provider);
          const balance = await usdcContract.balanceOf(accounts[0]);
          const balanceFormatted = ethers.formatUnits(balance, USDC_DECIMALS);
          
          setWalletInfo({
            address: accounts[0],
            balance: `$${parseFloat(balanceFormatted).toFixed(2)} USDC`,
            network: "Base Sepolia"
          });
        } catch (error) {
          console.error('Error fetching balance:', error);
          setWalletInfo({
            address: accounts[0],
            balance: "Unable to fetch",
            network: "Base Sepolia"
          });
        }
        
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
    if (!walletInfo || !window.ethereum) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Convert payment amount to USDC format (6 decimals)
      const amountInWei = ethers.parseUnits(paymentAmount.toString(), USDC_DECIMALS);
      
      // Create contract instance
      const usdcContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20_ABI, signer);
      
      // Check if user has enough USDC balance
      const balance = await usdcContract.balanceOf(walletInfo.address);
      
      if (balance < amountInWei) {
        toast({
          title: "Insufficient balance",
          description: `You need at least $${paymentAmount} USDC to make this payment.`,
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Execute the transfer
      const tx = await usdcContract.transfer(RECIPIENT_ADDRESS, amountInWei);
      
      toast({
        title: "Transaction submitted",
        description: "Your payment is being processed...",
      });
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        toast({
          title: "Payment Successful",
          description: `Successfully sent $${paymentAmount} USDC! Transaction: ${receipt.hash}`,
        });
      } else {
        throw new Error("Transaction failed");
      }
      
    } catch (error: any) {
      console.error('Payment error:', error);
      
      let errorMessage = "Unable to process payment. Please try again.";
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = "Transaction was rejected by user.";
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = "Insufficient funds for gas fees.";
      } else if (error.message.includes('user rejected')) {
        errorMessage = "Transaction was rejected by user.";
      }
      
      toast({
        title: "Payment failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const increaseAmount = () => {
    setPaymentAmount(prev => Math.min(Number((prev + 0.25).toFixed(2)), 1000)); // Increment by $0.25
  };

  const decreaseAmount = () => {
    setPaymentAmount(prev => Math.max(Number((prev - 0.25).toFixed(2)), 0.25)); // Min $0.25
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0.25;
    setPaymentAmount(Math.min(Math.max(Number(value.toFixed(2)), 0.25), 1000));
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
            Pay in crypto for premium access to the resource. Select your payment amount below.
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

        {isConnected && (
          <div className="space-y-4 animate-slide-down">
            <div className="text-center">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Payment Amount</h3>
              
              <div className="flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={decreaseAmount}
                  disabled={paymentAmount <= 0.25}
                  className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <Minus size={12} />
                </Button>
                
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-4 py-2">
                  <span className="text-lg font-bold">$</span>
                  <AnimatedNumber 
                    value={paymentAmount} 
                    className="text-2xl font-bold text-primary min-w-[4rem] text-center"
                  />
                  <span className="text-sm text-muted-foreground font-medium">USDC</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={increaseAmount}
                  disabled={paymentAmount >= 1000}
                  className="h-8 w-8 p-0 rounded-full transition-all duration-200 hover:scale-105"
                >
                  <Plus size={12} />
                </Button>
              </div>
              
              <div className="space-y-3 mt-4">
                <div className="flex justify-center gap-2">
                  {[0.25, 1, 2.50, 5].map((amount) => (
                    <Button
                      key={amount}
                      variant={paymentAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentAmount(amount)}
                      className="text-xs px-3 h-7 transition-all duration-200 hover:scale-105"
                    >
                      ${amount.toFixed(2)}
                    </Button>
                  ))}
                </div>
                
                <div className="flex justify-center gap-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <Button
                      key={amount}
                      variant={paymentAmount === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPaymentAmount(amount)}
                      className="text-xs px-3 h-7 transition-all duration-200 hover:scale-105"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                
                <div className="mt-3">
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={handleAmountChange}
                    min="0.25"
                    max="1000"
                    step="0.01"
                    placeholder="Custom amount"
                    className="w-full text-center text-sm"
                  />
                </div>
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
                `Pay $${paymentAmount} USDC`
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