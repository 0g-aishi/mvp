/**
 * @fileoverview Consolidation Status Hook for Terminal XState
 * @description Fetches month_learn/year_learn status from 0g-compute backend (self-contained, no external deps)
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { logger } from '@/lib/logger';

// Logger instance
const log = logger.child({ component: 'useConsolidationStatus' });

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

/**
 * Hook to check consolidation status from backend
 * Self-contained implementation for terminal-xstate module
 */
export function useConsolidationStatus(): UseConsolidationStatusReturn {
  const [status, setStatus] = useState<ConsolidationStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { address } = useAccount();

  // Check test mode flags
  const isMonthTestMode = process.env.NEXT_PUBLIC_CONSOLIDATION_TEST === 'true';
  const isYearTestMode = process.env.NEXT_PUBLIC_YEAR_LEARN_TEST === 'true';

  const fetchStatus = useCallback(async () => {
    if (!address) {
      setStatus(null);
      setIsLoading(false);
      setError('Wallet not connected');
      log.debug('No wallet address - skipping fetch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const API_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
      const url = `${API_URL}/consolidation/${address}`;

      log.debug('Fetching consolidation status', { url, address });

      const response = await fetch(url);
      const data = await response.json();

      log.debug('Response received', {
        ok: response.ok,
        status: response.status,
        data
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Broker not found - acceptable in test mode
          log.debug('Broker not found (404) - commands will work in test mode');
          setStatus(null);
          setError(null);
        } else {
          throw new Error(data.error || 'Failed to fetch consolidation status');
        }
      } else if (data.success && data.data) {
        const consolidationData: ConsolidationStatus = data.data;
        setStatus(consolidationData);

        log.debug('Consolidation status loaded', {
          month_learn: consolidationData.month_learn,
          year_learn: consolidationData.year_learn,
          consolidation_date: consolidationData.consolidation_date
        });
      } else {
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch consolidation status';
      setError(errorMsg);
      setStatus(null);
      log.debug('Error fetching status', { error: errorMsg });
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  // Auto-fetch on mount and when address changes
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
  // In test mode, commands always available
  // In production, check backend flags
  const canUseMonthLearn = isMonthTestMode || (status?.month_learn === 'need');
  const canUseYearLearn = isYearTestMode || (status?.year_learn === 'need');

  // Determine if we should show UI prompts
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
}
