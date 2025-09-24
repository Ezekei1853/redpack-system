export interface RedPack {
  id: number;
  creator: string;
  total: string;
  remaining: string;
  count: number;
  claimed: number;
  type: 'random' | 'equal';
}

export interface WalletState {
  address: string | null;
  connected: boolean;
  balance: string;
}

export interface UserStats {
  balance: string;
  totalReceived: string;
  totalSent: string;
  activeCount: number;
}