import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronRight } from "lucide-react";

interface WalletOption {
  name: string;
  icon: string;
  connector: string;
}

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletSelect: (wallet: string) => void;
}

const walletOptions: WalletOption[] = [
  {
    name: "MetaMask",
    icon: "🦊",
    connector: "metamask"
  },
  {
    name: "RB Wallet",
    icon: "🚀",
    connector: "rbwallet"
  },
  {
    name: "Coinbase Wallet",
    icon: "🔵",
    connector: "coinbase"
  },
  {
    name: "WalletConnect",
    icon: "🔗",
    connector: "walletconnect"
  }
];

export function WalletModal({ isOpen, onClose, onWalletSelect }: WalletModalProps) {
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const handleWalletClick = async (wallet: WalletOption) => {
    setIsConnecting(wallet.connector);
    
    // Simulate connection delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onWalletSelect(wallet.connector);
    setIsConnecting(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <Wallet size={20} />
            Connect Wallet
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 mt-4">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.connector}
              variant="outline"
              className="w-full h-14 justify-between text-left hover:bg-accent/50 transition-all duration-300 animate-breathe"
              style={{ animationDelay: `${walletOptions.indexOf(wallet) * 0.1}s` }}
              onClick={() => handleWalletClick(wallet)}
              disabled={isConnecting !== null}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wallet.icon}</span>
                <span className="font-medium">{wallet.name}</span>
              </div>
              
              {isConnecting === wallet.connector ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
              ) : (
                <ChevronRight size={16} className="text-muted-foreground" />
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}