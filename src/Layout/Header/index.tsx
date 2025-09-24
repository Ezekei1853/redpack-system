import React from "react";
import { Wallet, Gift, Plus, History, Users, Coins, Clock, Zap } from 'lucide-react';
import { WalletState } from '@/types/redPack';

interface HeaderProps {
  walletState: WalletState;
  onWalletConnect: () => void;
}
const Header: React.FC<HeaderProps> = ({ walletState, onWalletConnect }) => {
  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Gift className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
            抢红包系统
          </h1>
        </div>
        
        <button 
          onClick={onWalletConnect}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-medium transition-all duration-300 ${
            walletState.connected
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg'
          }`}
        >
          <Wallet size={20} />
          {walletState.connected ? walletState.address : '连接钱包'}
        </button>
      </div>
    </div>
  );
};

export  default Header;