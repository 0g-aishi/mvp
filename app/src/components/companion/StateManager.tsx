'use client';

import React, { useCallback, useState } from 'react';
import { FaDownload, FaUpload, FaCopy, FaSave, FaTrash, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { getModifiedParameterCount, PARAMETER_DEFINITIONS } from './ParameterDefinitions';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'StateManager' });

export interface CompanionState {
  version: string;
  timestamp: number;
  parameters: Record<string, number>;
  expressions: string[];
  metadata: {
    modelPath: string;
    totalModifications: number;
    modifiedParameters: string[];
  };
}

export interface StateManagerProps {
  currentParameters: Map<string, number>;
  currentExpressions: string[];
  onImportState: (state: CompanionState) => void;
  onResetAll: () => void;
  modelPath: string;
}

const STATE_VERSION = '1.0';
const AUTOSAVE_KEY = 'companion_autosave';
const SAVED_SLOTS_KEY = 'companion_saved_slots';
const MAX_SAVED_SLOTS = 5;

export const StateManager: React.FC<StateManagerProps> = ({
  currentParameters,
  currentExpressions,
  onImportState,
  onResetAll,
  modelPath
}) => {
  const [savedSlots, setSavedSlots] = useState<Array<{ name: string; state: CompanionState }>>(() => {
    const saved = localStorage.getItem(SAVED_SLOTS_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  // Build current state object
  const getCurrentState = useCallback((): CompanionState => {
    const parameters = Object.fromEntries(currentParameters);
    const modifiedCount = getModifiedParameterCount(currentParameters);
    const modifiedParams = Array.from(currentParameters.entries())
      .filter(([id, value]) => {
        const def = PARAMETER_DEFINITIONS[id];
        return def && Math.abs(value - def.default) > 0.001;
      })
      .map(([id]) => id);

    return {
      version: STATE_VERSION,
      timestamp: Date.now(),
      parameters,
      expressions: currentExpressions,
      metadata: {
        modelPath,
        totalModifications: modifiedCount,
        modifiedParameters: modifiedParams
      }
    };
  }, [currentParameters, currentExpressions, modelPath]);

  // Export current state as JSON file
  const handleExportJSON = useCallback(() => {
    const state = getCurrentState();
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportFileName = `shizuku_state_${timestamp}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();

    toast.success('State exported successfully!');
  }, [getCurrentState]);

  // Copy current state JSON to clipboard
  const handleCopyToClipboard = useCallback(async () => {
    const state = getCurrentState();
    const jsonStr = JSON.stringify(state, null, 2);

    try {
      await navigator.clipboard.writeText(jsonStr);
      toast.success('State copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
      log.error('Clipboard error', { error });
    }
  }, [getCurrentState]);

  // Import state from JSON file
  const handleImportJSON = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const state: CompanionState = JSON.parse(content);

          // Validate state structure
          if (!state.version || !state.parameters || !state.expressions) {
            throw new Error('Invalid state file structure');
          }

          if (state.version !== STATE_VERSION) {
            toast.error(`Incompatible state version: ${state.version} (expected ${STATE_VERSION})`);
            return;
          }

          onImportState(state);
          toast.success('State imported successfully!');
        } catch (error) {
          toast.error('Failed to import state file');
          log.error('Import error', { error });
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }, [onImportState]);

  // Save current state to localStorage slot
  const handleSaveToSlot = useCallback(() => {
    const slotName = prompt('Enter a name for this saved state:');
    if (!slotName) return;

    const state = getCurrentState();

    if (savedSlots.length >= MAX_SAVED_SLOTS) {
      if (!confirm(`You have ${MAX_SAVED_SLOTS} saved slots. Delete oldest to make room?`)) {
        return;
      }
      // Remove oldest slot
      savedSlots.shift();
    }

    const newSlots = [...savedSlots, { name: slotName.trim(), state }];
    setSavedSlots(newSlots);
    localStorage.setItem(SAVED_SLOTS_KEY, JSON.stringify(newSlots));

    toast.success(`Saved to slot: ${slotName}`);
  }, [getCurrentState, savedSlots]);

  // Load state from saved slot
  const handleLoadSlot = useCallback((index: number) => {
    const slot = savedSlots[index];
    if (!slot) return;

    onImportState(slot.state);
    toast.success(`Loaded: ${slot.name}`);
  }, [savedSlots, onImportState]);

  // Delete saved slot
  const handleDeleteSlot = useCallback((index: number) => {
    const slot = savedSlots[index];
    if (!confirm(`Delete saved state "${slot.name}"?`)) return;

    const newSlots = savedSlots.filter((_, i) => i !== index);
    setSavedSlots(newSlots);
    localStorage.setItem(SAVED_SLOTS_KEY, JSON.stringify(newSlots));

    toast.success(`Deleted: ${slot.name}`);
  }, [savedSlots]);

  const currentState = getCurrentState();
  const stateSize = (JSON.stringify(currentState).length / 1024).toFixed(1);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      {/* Current State Summary */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(139, 92, 246, 0.1)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '8px',
        }}
      >
        <h4
          style={{
            color: '#8B5CF6',
            fontSize: '14px',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Current State
        </h4>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '8px',
            fontSize: '12px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <div>Active Expressions:</div>
          <div style={{ textAlign: 'right', color: '#8B5CF6' }}>{currentState.expressions.length}</div>

          <div>Modified Parameters:</div>
          <div style={{ textAlign: 'right', color: '#8B5CF6' }}>{currentState.metadata.totalModifications}</div>

          <div>State Size:</div>
          <div style={{ textAlign: 'right', color: '#8B5CF6' }}>{stateSize} KB</div>

          <div>Last Updated:</div>
          <div style={{ textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)' }}>
            {new Date(currentState.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Export/Import Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h5
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
            marginBottom: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}
        >
          Export / Import
        </h5>

        <button
          onClick={handleExportJSON}
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            border: '1px solid #22C55E',
            borderRadius: '8px',
            color: '#22C55E',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FaDownload size={14} />
          Export as JSON File
        </button>

        <button
          onClick={handleCopyToClipboard}
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid #3B82F6',
            borderRadius: '8px',
            color: '#3B82F6',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FaCopy size={14} />
          Copy JSON to Clipboard
        </button>

        <button
          onClick={handleImportJSON}
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid #A855F7',
            borderRadius: '8px',
            color: '#A855F7',
            cursor: 'pointer',
            fontSize: '13px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FaUpload size={14} />
          Import from JSON File
        </button>
      </div>

      {/* LocalStorage Slots */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h5
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              margin: 0,
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}
          >
            Saved Slots ({savedSlots.length}/{MAX_SAVED_SLOTS})
          </h5>

          <button
            onClick={handleSaveToSlot}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(139, 92, 246, 0.2)',
              border: '1px solid #8B5CF6',
              borderRadius: '4px',
              color: '#8B5CF6',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <FaSave size={10} />
            Save to Slot
          </button>
        </div>

        {/* Saved Slots List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          className="custom-scrollbar"
        >
          {savedSlots.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.4)',
                fontSize: '12px',
                fontStyle: 'italic',
              }}
            >
              No saved states yet. Save your current state to quick-access it later!
            </div>
          ) : (
            savedSlots.map((slot, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: '#fff',
                        fontSize: '13px',
                        fontWeight: 'bold',
                        marginBottom: '4px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {slot.name}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '10px',
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {new Date(slot.state.timestamp).toLocaleString()}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        fontSize: '10px',
                        marginTop: '4px',
                      }}
                    >
                      {slot.state.metadata.totalModifications} params • {slot.state.expressions.length} expr
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteSlot(index)}
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid #EF4444',
                      borderRadius: '4px',
                      color: '#EF4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title="Delete slot"
                  >
                    <FaTrash size={10} />
                  </button>
                </div>

                <button
                  onClick={() => handleLoadSlot(index)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid #8B5CF6',
                    borderRadius: '6px',
                    color: '#8B5CF6',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <FaPlay size={10} />
                  Load State
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
        }}
      >
        <h5
          style={{
            color: '#EF4444',
            fontSize: '12px',
            marginBottom: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            textTransform: 'uppercase',
          }}
        >
          ⚠️ Danger Zone
        </h5>

        <button
          onClick={() => {
            if (confirm('Reset ALL parameters to defaults and clear ALL expressions? This cannot be undone.')) {
              onResetAll();
              toast.success('All parameters and expressions reset!');
            }
          }}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '2px solid #EF4444',
            borderRadius: '8px',
            color: '#EF4444',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 'bold',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
          }}
        >
          <FaRedo size={14} />
          Reset All to Defaults
        </button>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};
