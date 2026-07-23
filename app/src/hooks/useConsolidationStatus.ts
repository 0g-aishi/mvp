'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from './useWallet';

interface ConsolidationStatus {
  consolidation_date: string;
  month_learn: 'need' | 'noneed';
  year_learn: 'need' | 'noneed';
}

interface UseConsolidationStatusReturn {
  status: ConsolidationStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  canUseMonthLearn: boolean;
  canUseYearLearn: boolean;
  shouldShowMonthLearnPrompt: boolean;
  shouldShowYearLearnPrompt: boolean;
}

export const useConsolidationStatus = (): UseConsolidationStatusReturn => {
  const [status, setStatus] = useState<ConsolidationStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useWallet();

  // Check test mode variables
  const isMonthTestMode = process.env.NEXT_PUBLIC_CONSOLIDATION_TEST === 'true';
  const isYearTestMode = process.env.NEXT_PUBLIC_YEAR_LEARN_TEST === 'true';

  const fetchStatus = useCallback(async () => {
    if (!address) {
      setStatus(null);
      setIsLoading(false);
      setError('Wallet not connected');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${API_URL}/consolidation/${address}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          // Broker not found - this is acceptable, commands should still work in test mode
          setStatus(null);
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to fetch consolidation status');
        }
      } else if (data.success && data.data) {
        const consolidationData: ConsolidationStatus = data.data;
        setStatus(consolidationData);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch consolidation status');
      setStatus(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address) {
      fetchStatus();
    } else {
      setStatus(null);
      setIsLoading(false);
      setError('Wallet not connected');
    }
  }, [address, fetchStatus]);

  // Determine if commands can be used
  const canUseMonthLearn = isMonthTestMode || (status?.month_learn === 'need');
  const canUseYearLearn = isYearTestMode || (status?.year_learn === 'need');

  // Determine if we should show prompts
  const shouldShowMonthLearnPrompt = isMonthTestMode || (status?.month_learn === 'need');
  const shouldShowYearLearnPrompt = isYearTestMode || (status?.year_learn === 'need');

  return {
    status,
    isLoading,
    error,
    refetch: fetchStatus,
    canUseMonthLearn,
    canUseYearLearn,
    shouldShowMonthLearnPrompt,
    shouldShowYearLearnPrompt
  };
}; 