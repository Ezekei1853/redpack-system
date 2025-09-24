import { useState, useEffect, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Await } from 'react-router-dom';

interface WalletState{
     address: string | null;
     connected:boolean;
     balance: string | null;
     chainId: number | null;
     provider: ethers.providers.Web3Provider | null;
     signer: ethers.Signer | null;
}
const TARGET_NETWORK_ID = 11155111; // Sepolia测试网

export const  useWallet= ()=>{
 
  
  const isConnected = useRef(false)
  const [error,setError] = useState<string|null>(null)
   
  const [loading,setLoading] = useState(false)
   const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    connected: false,
    balance: '0',
    chainId: null,
    provider: null,
    signer: null
  })
  const isCorrectNetwork = walletState.chainId === TARGET_NETWORK_ID;
    const isMetaMaskInstalled = (): boolean => {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' &&
           (window as any).ethereum.isMetaMask;
  };

  const connect = useCallback(async() =>{
       if(isConnected.current){
         return ;
       }
       isConnected.current = true;
       try{
         if(!isMetaMaskInstalled()){
        throw new Error('Please install MetaMask');
         return;
       }
       const ethereum = (window as any).ethereum;
       const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
       
       const provider = new ethers.providers.Web3Provider(ethereum);
       const signer = provider.getSigner();
       const network = await provider.getNetwork();
      
       const chainId =  network.chainId;
         const address = accounts[0];
         let balance = await provider.getBalance(address);
         const balanceInEth = ethers.utils.formatEther(balance);
         balance = parseFloat(balanceInEth).toFixed(4);
         
      
       setWalletState({
        address,
        signer,
        chainId,
        balance,
        connected:true,
        provider,

       })
       localStorage.setItem('walletConnected', 'true');
      localStorage.setItem('walletAddress', address);
       }catch(error:any){
           let errorMessage = '连接钱包失败';
      
      // 处理不同类型的错误
      if (error.code === 4001) {
        errorMessage = '用户拒绝连接钱包';
      } else if (error.code === -32002) {
        errorMessage = '连接请求待处理，请检查MetaMask';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrorState(errorMessage);
       }
      
       

  },[walletState.connected])
     const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
    setLoading(false);
    console.error('钱包错误:', errorMessage);
  }; 
  const autoConnect = useCallback(( async() =>{
       
       const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const savedAddress = localStorage.getItem('walletAddress');
    if(isMetaMaskInstalled()&&wasConnected&&savedAddress){
       try{
          const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        if(accounts.includes(savedAddress)){
             await connect();
        }else{
            localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAddress');
        }
       }catch(error){
        localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAddress');
           console.log(error)
       }
    }else{
      throw new Error('Please install MetaMask or connect to MetaMask')
    }
   
  }),[connect])
  const disconnect = () =>{
     setWalletState({
      address: null,
      connected: false,
      balance: '0',
      chainId: null,
      provider: null,
      signer: null
    })
  }
   const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      // 用户断开了连接
      disconnect();
    } else if (accounts[0] !== walletState.address) {
      // 用户切换了账户，重新连接
      connect();
    }
  }, [walletState.address, disconnect, connect]);
   const switchNetwork = useCallback(async (targetChainId: number): Promise<void> => {
    if (!walletState.provider) {
      throw new Error('未连接钱包');
    }

    setLoading(true);
    setError(null);

    try {
      const ethereum = (window as any).ethereum;
      const chainIdHex = `0x${targetChainId.toString(16)}`;
      
      // 尝试切换到目标网络
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

    } catch (error: any) {
      // 如果网络不存在，尝试添加网络
      if (error.code === 4902) {
        const networkConfig = SUPPORTED_NETWORKS[targetChainId];
        if (networkConfig) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: networkConfig.name,
                rpcUrls: [networkConfig.rpcUrl],
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                }
              }]
            });
          } catch (addError) {
            throw new Error('添加网络失败');
          }
        } else {
          throw new Error('不支持的网络');
        }
      } else {
        throw new Error('切换网络失败');
      }
    } finally {
      setLoading(false);
    }
  }, [walletState.provider]);
  

    const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);
      useEffect(()=>{
      autoConnect()
  },[autoConnect,handleDisconnect,handleAccountsChanged]);
   return {
    ...walletState,
    connect,
    disconnect,
    switchNetwork,
    loading,
    error,
    isCorrectNetwork
  };
}
