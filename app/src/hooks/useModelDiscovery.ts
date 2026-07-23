'use client';

import { useState, useEffect, useCallback } from 'react';
import { Model } from '../components/ModelSelector';
import { logger } from '@/lib/logger';

const BACKEND_URL = process.env.NEXT_PUBLIC_COMPUTE_API_URL || 'http://localhost:3001/api';
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export const useModelDiscovery = () => {
  const log = logger.child({ component: 'useModelDiscovery' });
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Load saved model from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aishi-selected-model');
      return saved || 'auto';
    }
    return 'auto';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastDiscoveryTime, setLastDiscoveryTime] = useState<Date | null>(null);

  const discoverModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/models/discover`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to discover models: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success && data.data?.models) {
        setModels(data.data.models);
        setLastDiscoveryTime(new Date());
        
        // If no model is selected and we have models, select the first one or keep auto
        if (selectedModel === '' && data.data.models.length > 0) {
          setSelectedModel('auto');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      log.error('Failed to discover models', { error });
      setError(error instanceof Error ? error.message : 'Failed to discover models');

      // Fallback to Gemini only (fast profile for fallback scenarios)
      const fallbackModels: Model[] = [{
        id: 'gemini-2.5-flash-fast',
        name: 'Gemini 2.5 Flash (Fast)',
        type: 'centralized',
        provider: 'Google Vertex AI',
        available: true,
        badge: 'Fallback'
      }];

      setModels(fallbackModels);

      // If current selection is not available in fallback, switch to gemini-2.5-flash-fast
      if (selectedModel !== 'auto' && !fallbackModels.find(m => m.id === selectedModel)) {
        setSelectedModel('gemini-2.5-flash-fast');
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedModel]);

  // Refresh models manually
  const refreshModels = useCallback(async () => {
    await discoverModels();
  }, [discoverModels]);

  // Initial discovery on mount
  useEffect(() => {
    discoverModels();
  }, []);

  // Smart default selection after models are loaded
  useEffect(() => {
    // Only set smart default if:
    // 1. Models are loaded (not empty)
    // 2. Current selection is 'auto' (user hasn't made explicit choice)
    // 3. Not loading (discovery completed)
    if (models.length > 0 && selectedModel === 'auto' && !isLoading) {
      const has0GModels = models.some(m =>
        m.type === 'decentralized' && m.available
      );

      let smartDefault = 'gemini-2.5-flash-fast'; // Default fallback

      if (has0GModels) {
        // Prefer openai/gpt-oss-120b if available
        const openaiModel = models.find(m =>
          m.id === 'openai/gpt-oss-120b' && m.available
        );

        if (openaiModel) {
          smartDefault = 'openai/gpt-oss-120b';
          log.debug('Smart default: openai/gpt-oss-120b (0G models available)');
        } else {
          // Fallback to first available 0G model
          const first0G = models.find(m => m.type === 'decentralized' && m.available);
          if (first0G) {
            smartDefault = first0G.id;
            log.debug(`Smart default: ${first0G.id} (first available 0G model)`);
          }
        }
      } else {
        log.debug('Smart default: gemini-2.5-flash-fast (0G models unavailable)');
      }

      setSelectedModel(smartDefault);
    }
  }, [models, isLoading]); // Run when models or loading state changes
  // Note: Don't include selectedModel to avoid infinite loop

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      discoverModels();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [discoverModels]);

  // Save selected model to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('aishi-selected-model', selectedModel);
    }
  }, [selectedModel]);

  // Get the currently selected model object
  const getSelectedModel = useCallback(() => {
    if (selectedModel === 'auto') {
      // Auto-select logic: prefer cheapest decentralized, then any decentralized, then Gemini
      const decentralized = models.filter(m => m.type === 'decentralized' && m.available);
      if (decentralized.length > 0) {
        // Sort by price if available
        const sorted = decentralized.sort((a, b) => {
          const priceA = parseInt(a.inputPrice || '0');
          const priceB = parseInt(b.inputPrice || '0');
          return priceA - priceB;
        });
        return sorted[0];
      }
      // Fallback to Gemini
      return models.find(m => m.id === 'gemini-2.5-flash') || models[0];
    }
    
    return models.find(m => m.id === selectedModel);
  }, [selectedModel, models]);

  return {
    models,
    selectedModel,
    setSelectedModel,
    isLoading,
    error,
    refreshModels,
    getSelectedModel,
    lastDiscoveryTime
  };
};

export default useModelDiscovery;