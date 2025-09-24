// src/hooks/useUserStats.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import { useContract } from './useContract';

// 用户统计数据接口
interface UserStats {
  // 钱包相关
  walletBalance: string;           // 钱包ETH余额
  contractBalance: string;         // 合约中的余额（如果有托管功能）
  
  // 红包统计
  totalReceived: string;           // 总共抢到的金额
  totalSent: string;              // 总共发出的金额
  receivedCount: number;          // 抢到红包次数
  sentCount: number;              // 发出红包次数
  
  // 活跃数据
  activeRedpacks: number;         // 当前活跃红包数量
  todayReceived: string;          // 今天抢到的金额
  todaySent: string;             // 今天发出的金额
  
  // 排名数据（可选）
  userRank?: number;             // 用户排名
  totalUsers?: number;           // 总用户数
}

// Hook返回值接口
interface UseUserStatsReturn {
  stats: UserStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  
  // 格式化函数
  formatEth: (value: string) => string;
  formatCount: (value: number) => string;
  
  // 计算函数
  netAmount: string;             // 净收益 (received - sent)
  successRate: number;          // 抢红包成功率 (如果有尝试次数统计)
  avgReceived: string;          // 平均每次抢到金额
  avgSent: string;              // 平均每次发出金额
}

// 缓存键名
const CACHE_KEY = 'userStats';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 默认统计数据
const defaultStats: UserStats = {
  walletBalance: '0',
  contractBalance: '0',
  totalReceived: '0',
  totalSent: '0',
  receivedCount: 0,
  sentCount: 0,
  activeRedpacks: 0,
  todayReceived: '0',
  todaySent: '0',
};

export const useUserStats = (): UseUserStatsReturn => {
  const { address, provider, connected } = useWallet();
  const { contract, getRedpackHistory, getActiveRedpacks } = useContract();
  
  // 主要状态
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 缓存管理
  const [lastFetched, setLastFetched] = useState<number>(0);

  // 🔧 工具函数：格式化ETH金额
  const formatEth = useCallback((value: string): string => {
    const num = parseFloat(value);
    if (num === 0) return '0';
    if (num < 0.0001) return '<0.0001';
    if (num < 1) return num.toFixed(4);
    if (num < 10) return num.toFixed(3);
    return num.toFixed(2);
  }, []);

  // 🔧 工具函数：格式化数量
  const formatCount = useCallback((value: number): string => {
    if (value < 1000) return value.toString();
    if (value < 10000) return `${(value / 1000).toFixed(1)}k`;
    if (value < 1000000) return `${(value / 1000).toFixed(0)}k`;
    return `${(value / 1000000).toFixed(1)}M`;
  }, []);

  // 🔧 获取今日开始时间戳
  const getTodayTimestamp = useCallback((): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.floor(today.getTime() / 1000);
  }, []);

  // 🔧 检查缓存是否有效
  const isCacheValid = useCallback((): boolean => {
    if (!address) return false;
    const now = Date.now();
    return now - lastFetched < CACHE_DURATION;
  }, [address, lastFetched]);

  // 🔧 保存缓存
  const saveToCache = useCallback((data: UserStats) => {
    if (!address) return;
    
    const cacheData = {
      stats: data,
      timestamp: Date.now(),
      address
    };
    
    try {
      localStorage.setItem(`${CACHE_KEY}_${address}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('保存缓存失败:', error);
    }
  }, [address]);

  // 🔧 读取缓存
  const loadFromCache = useCallback((): UserStats | null => {
    if (!address) return null;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${address}`);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const now = Date.now();
      
      // 检查缓存是否过期
      if (now - cacheData.timestamp > CACHE_DURATION) {
        localStorage.removeItem(`${CACHE_KEY}_${address}`);
        return null;
      }
      
      // 检查地址是否匹配
      if (cacheData.address !== address) {
        return null;
      }
      
      setLastFetched(cacheData.timestamp);
      return cacheData.stats;
      
    } catch (error) {
      console.warn('读取缓存失败:', error);
      return null;
    }
  }, [address]);

  // 📊 获取钱包余额
  const fetchWalletBalance = useCallback(async (): Promise<string> => {
    if (!provider || !address) return '0';
    
    try {
      const balance = await provider.getBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      console.error('获取钱包余额失败:', error);
      return '0';
    }
  }, [provider, address]);

  // 📊 获取合约余额（如果合约支持用户余额查询）
  const fetchContractBalance = useCallback(async (): Promise<string> => {
    if (!contract || !address) return '0';
    
    try {
      // 假设合约有getUserBalance方法
      const balance = await contract.getUserBalance(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      // 如果合约没有这个方法，返回0
      return '0';
    }
  }, [contract, address]);

  // 📊 获取红包历史统计
  const fetchRedpackStats = useCallback(async (): Promise<{
    totalReceived: string;
    totalSent: string;
    receivedCount: number;
    sentCount: number;
    todayReceived: string;
    todaySent: string;
  }> => {
    if (!address || !getRedpackHistory) {
      return {
        totalReceived: '0',
        totalSent: '0',
        receivedCount: 0,
        sentCount: 0,
        todayReceived: '0',
        todaySent: '0'
      };
    }

    try {
      // 获取用户的红包历史
      const history = await getRedpackHistory(address);
      const todayTimestamp = getTodayTimestamp();

      let totalReceived = 0;
      let totalSent = 0;
      let receivedCount = 0;
      let sentCount = 0;
      let todayReceived = 0;
      let todaySent = 0;

      history.forEach((item) => {
        const amount = parseFloat(item.amount);
        const itemTimestamp = new Date(item.timestamp).getTime() / 1000;
        
        if (item.type === 'received') {
          totalReceived += amount;
          receivedCount += 1;
          
          if (itemTimestamp >= todayTimestamp) {
            todayReceived += amount;
          }
        } else if (item.type === 'sent') {
          totalSent += amount;
          sentCount += 1;
          
          if (itemTimestamp >= todayTimestamp) {
            todaySent += amount;
          }
        }
      });

      return {
        totalReceived: totalReceived.toString(),
        totalSent: totalSent.toString(),
        receivedCount,
        sentCount,
        todayReceived: todayReceived.toString(),
        todaySent: todaySent.toString()
      };
      
    } catch (error) {
      console.error('获取红包统计失败:', error);
      return {
        totalReceived: '0',
        totalSent: '0',
        receivedCount: 0,
        sentCount: 0,
        todayReceived: '0',
        todaySent: '0'
      };
    }
  }, [address, getRedpackHistory, getTodayTimestamp]);

  // 📊 获取活跃红包数量
  const fetchActiveRedpacks = useCallback(async (): Promise<number> => {
    if (!address || !getActiveRedpacks) return 0;
    
    try {
      const activeRedpacks = await getActiveRedpacks(address);
      return activeRedpacks.length;
    } catch (error) {
      console.error('获取活跃红包失败:', error);
      return 0;
    }
  }, [address, getActiveRedpacks]);

  // 📊 获取用户排名（可选功能）
  const fetchUserRank = useCallback(async (): Promise<{
    userRank?: number;
    totalUsers?: number;
  }> => {
    if (!contract || !address) return {};
    
    try {
      // 假设合约有排名功能
      const rankInfo = await contract.getUserRank(address);
      return {
        userRank: rankInfo.rank,
        totalUsers: rankInfo.totalUsers
      };
    } catch (error) {
      // 如果没有排名功能，返回空对象
      return {};
    }
  }, [contract, address]);

  // 🔄 刷新统计数据主函数
  const refreshStats = useCallback(async (): Promise<void> => {
    if (!connected || !address) {
      setStats(defaultStats);
      return;
    }

    // 如果缓存有效，使用缓存数据
    if (isCacheValid()) {
      const cachedStats = loadFromCache();
      if (cachedStats) {
        setStats(cachedStats);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // 并发获取所有统计数据
      const [
        walletBalance,
        contractBalance,
        redpackStats,
        activeRedpacks,
        rankInfo
      ] = await Promise.all([
        fetchWalletBalance(),
        fetchContractBalance(),
        fetchRedpackStats(),
        fetchActiveRedpacks(),
        fetchUserRank()
      ]);

      const newStats: UserStats = {
        walletBalance,
        contractBalance,
        ...redpackStats,
        activeRedpacks,
        ...rankInfo
      };

      setStats(newStats);
      saveToCache(newStats);
      setLastFetched(Date.now());

    } catch (error: any) {
      console.error('刷新统计数据失败:', error);
      setError(error.message || '获取统计数据失败');
    } finally {
      setLoading(false);
    }
  }, [
    connected,
    address,
    isCacheValid,
    loadFromCache,
    fetchWalletBalance,
    fetchContractBalance,
    fetchRedpackStats,
    fetchActiveRedpacks,
    fetchUserRank,
    saveToCache
  ]);

  // 💰 计算净收益
  const netAmount = useMemo((): string => {
    const received = parseFloat(stats.totalReceived);
    const sent = parseFloat(stats.totalSent);
    const net = received - sent;
    return net.toString();
  }, [stats.totalReceived, stats.totalSent]);

  // 📊 计算抢红包成功率（如果有尝试次数统计）
  const successRate = useMemo((): number => {
    // 这里假设有尝试次数统计，实际实现需要根据合约设计
    // 目前返回100%，实际可以根据合约事件计算
    return stats.receivedCount > 0 ? 100 : 0;
  }, [stats.receivedCount]);

  // 📊 计算平均抢到金额
  const avgReceived = useMemo((): string => {
    if (stats.receivedCount === 0) return '0';
    const avg = parseFloat(stats.totalReceived) / stats.receivedCount;
    return avg.toString();
  }, [stats.totalReceived, stats.receivedCount]);

  // 📊 计算平均发出金额
  const avgSent = useMemo((): string => {
    if (stats.sentCount === 0) return '0';
    const avg = parseFloat(stats.totalSent) / stats.sentCount;
    return avg.toString();
  }, [stats.totalSent, stats.sentCount]);

  // 🔄 自动刷新逻辑
  useEffect(() => {
    if (connected && address) {
      // 首次加载尝试使用缓存
      const cachedStats = loadFromCache();
      if (cachedStats) {
        setStats(cachedStats);
      } else {
        // 缓存无效时立即刷新
        refreshStats();
      }
    } else {
      // 未连接时重置统计
      setStats(defaultStats);
    }
  }, [connected, address, loadFromCache, refreshStats]);

  // 🔄 定期自动刷新
  useEffect(() => {
    if (!connected || !address) return;

    // 每2分钟自动刷新一次
    const interval = setInterval(() => {
      if (!isCacheValid()) {
        refreshStats();
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [connected, address, isCacheValid, refreshStats]);

  // 🔄 监听区块链事件自动刷新
  useEffect(() => {
    if (!contract || !address) return;

    // 监听红包相关事件，自动刷新统计
    const handleRedpackEvent = () => {
      // 延迟1秒刷新，等待区块确认
      setTimeout(() => {
        refreshStats();
      }, 1000);
    };

    try {
      // 监听红包创建事件
      contract.on('RedpackCreated', handleRedpackEvent);
      // 监听红包抢夺事件
      contract.on('RedpackClaimed', handleRedpackEvent);

      return () => {
        contract.off('RedpackCreated', handleRedpackEvent);
        contract.off('RedpackClaimed', handleRedpackEvent);
      };
    } catch (error) {
      console.warn('设置事件监听失败:', error);
    }
  }, [contract, address, refreshStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    formatEth,
    formatCount,
    netAmount,
    successRate,
    avgReceived,
    avgSent
  };
};

