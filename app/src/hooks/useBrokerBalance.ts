'use client';

import { useState, useEffect } from 'react';
import { useWallet } from './useWallet';

interface BrokerBalance {
  walletAddress: string;
  balance: number;
  lastUpdated: string;
}

interface UseBrokerBalanceReturn {
  balance: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBrokerBalance = (): UseBrokerBalanceReturn => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useWallet();

  const fetchBalance = async () => {
    if (!address) {
      setBalance(0);
      setLoading(false);
      setError('Wallet not connected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/balance/${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance');
      }

      if (data.success && data.data) {
        const balanceData: BrokerBalance = data.data;
        setBalance(balanceData.balance);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch broker balance');
      setBalance(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance
  };
};