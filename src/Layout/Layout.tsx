import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Navigation from './Navigation/index';
import StatsCards from '@/Layout/RedPack/StatsCards';
import { useWallet } from '@/hooks/useWallet';
import { useUserStats } from '@/hooks/useUserStats';

const Layout: React.FC = () => {
  const { walletState, connectWallet } = useWallet();
  const { stats } = useUserStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-purple-50">
      <Header 
        walletState={walletState} 
        onWalletConnect={connectWallet} 
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <StatsCards stats={stats} />
        <Navigation />
        
        {/* 这里渲染子路由 */}
        <div className="fade-in">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

