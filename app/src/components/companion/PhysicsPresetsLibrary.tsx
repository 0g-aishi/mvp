'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { FaSave, FaTrash, FaDownload, FaPlay } from 'react-icons/fa';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'PhysicsPresetsLibrary' });

export interface PhysicsPreset {
  name: string;
  description: string;
  icon: string;
  parameters: Record<string, number>;
  expressions: string[];
  isBuiltIn?: boolean;
}

export interface PhysicsPresetsLibraryProps {
  onApplyPreset: (preset: PhysicsPreset) => void;
  onSaveCustomPreset: (name: string, description: string) => void;
  currentParameters: Map<string, number>;
  currentExpressions: string[];
}

// 9 Built-in Physics Presets based on ultrathink analysis
const BUILT_IN_PRESETS: PhysicsPreset[] = [
  {
    name: 'Neutral',
    description: 'Default state - all parameters at zero',
    icon: '🧘',
    parameters: {},
    expressions: [],
    isBuiltIn: true
  },
  {
    name: 'Happy',
    description: 'Cheerful expression with starry eyes and bouncy energy',
    icon: '😊',
    parameters: {
      'ParamAngleY': 3,
      'ParamMouthForm': 0.8,
      'ParamMouthOpenY': 0.2,
      'ParamBrowLY': 0.3,
      'ParamBrowRY': 0.3,
      'ParamEyeLOpen': 1,
      'ParamEyeROpen': 1,
      'ParamBreath': 0.6,
      'Param21': 5,
      'Param22': 5,
      'Param23': 3,
      'Param45': 8,
      'Param27': 3
    },
    expressions: ['星星眼'],
    isBuiltIn: true
  },
  {
    name: 'Sad',
    description: 'Sorrowful expression with tears and drooping features',
    icon: '😢',
    parameters: {
      'ParamAngleY': -10,
      'ParamMouthForm': -0.6,
      'ParamBrowLY': -0.5,
      'ParamBrowRY': -0.5,
      'ParamEyeLOpen': 0.6,
      'ParamEyeROpen': 0.6,
      'ParamBreath': 0.25,
      'Param21': -2,
      'Param22': -2,
      'Param30': 1,
      'Param32': 1
    },
    expressions: ['哭哭'],
    isBuiltIn: true
  },
  {
    name: 'Angry',
    description: 'Irritated expression with lowered brows and tense posture',
    icon: '😠',
    parameters: {
      'ParamAngleX': 0,
      'ParamAngleY': 0,
      'ParamAngleZ': 0,
      'ParamMouthForm': -0.8,
      'ParamMouthOpenY': 0.1,
      'ParamBrowLY': -0.7,
      'ParamBrowRY': -0.7,
      'ParamBrowLForm': -0.9,
      'ParamBrowRForm': -0.9,
      'ParamBreath': 0.7,
      'Param21': 4,
      'Param23': 5,
      'Param45': 6
    },
    expressions: ['生气'],
    isBuiltIn: true
  },
  {
    name: 'Thinking',
    description: 'Pondering pose with head tilt and blank stare',
    icon: '🤔',
    parameters: {
      'ParamAngleX': -5,
      'ParamAngleY': 5,
      'ParamAngleZ': 3,
      'ParamEyeBallX': 0.5,
      'ParamEyeBallY': 0.3,
      'ParamEyeLOpen': 0.8,
      'ParamEyeROpen': 0.8,
      'ParamBrowLY': 0.1,
      'ParamBrowRY': -0.1,
      'ParamBreath': 0.3,
      'Param21': 1,
      'Param22': 1
    },
    expressions: ['空白眼'],
    isBuiltIn: true
  },
  {
    name: 'Excited',
    description: 'Full energy with love eyes and maximum bouncy movement',
    icon: '😍',
    parameters: {
      'ParamAngleY': 5,
      'ParamBodyAngleX': 2,
      'ParamBodyAngleY': 1,
      'ParamMouthForm': 1,
      'ParamMouthOpenY': 0.3,
      'ParamBrowLY': 0.5,
      'ParamBrowRY': 0.5,
      'ParamBrowLForm': 0.7,
      'ParamBrowRForm': 0.7,
      'ParamEyeLOpen': 1,
      'ParamEyeROpen': 1,
      'ParamBreath': 0.8,
      'Param21': 8,
      'Param22': 8,
      'Param23': 7,
      'Param24': 7,
      'Param45': 10,
      'Param46': 10,
      'Param27': 5,
      'Param33': 30,
      'Param35': 30
    },
    expressions: ['爱心眼', '脸红'],
    isBuiltIn: true
  },
  {
    name: 'Shy',
    description: 'Embarrassed with averted gaze and light blush',
    icon: '😳',
    parameters: {
      'ParamAngleX': 5,
      'ParamAngleY': -10,
      'ParamEyeBallX': 0.3,
      'ParamEyeBallY': -0.3,
      'ParamEyeLOpen': 0.7,
      'ParamEyeROpen': 0.7,
      'ParamMouthForm': 0.4,
      'ParamBrowLY': -0.2,
      'ParamBrowRY': -0.2,
      'ParamBreath': 0.4,
      'Param21': 2,
      'Param22': 2
    },
    expressions: ['脸红'],
    isBuiltIn: true
  },
  {
    name: 'Devil Form',
    description: 'Full devil transformation with horns and dark wings',
    icon: '😈',
    parameters: {
      'ParamAngleX': 0,
      'ParamAngleY': -3,
      'ParamEyeBallY': 0.1,
      'ParamMouthForm': 0.6,
      'ParamBrowLY': -0.3,
      'ParamBrowRY': -0.3,
      'ParamBrowLAngle': 0.4,
      'ParamBrowRAngle': 0.4,
      'Param117': 35,
      'Param118': 35,
      'Param45': 5,
      'Param21': 3,
      'Param23': 3
    },
    expressions: ['恶魔角', '翅膀', '翅膀切换', '换色'],
    isBuiltIn: true
  },
  {
    name: 'Angel Form',
    description: 'Pure angel transformation with halo and white wings',
    icon: '😇',
    parameters: {
      'ParamAngleY': 2,
      'ParamMouthForm': 0.5,
      'ParamBrowLY': 0.2,
      'ParamBrowRY': 0.2,
      'ParamBreath': 0.4,
      'Param117': 25,
      'Param118': 25,
      'Param21': 4,
      'Param22': 4,
      'Param45': 4
    },
    expressions: ['光环', '翅膀'],
    isBuiltIn: true
  }
];

const CUSTOM_PRESETS_STORAGE_KEY = 'companion_custom_presets';

export const PhysicsPresetsLibrary: React.FC<PhysicsPresetsLibraryProps> = ({
  onApplyPreset,
  onSaveCustomPreset,
  currentParameters,
  currentExpressions
}) => {
  const [customPresets, setCustomPresets] = useState<PhysicsPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');

  // Load custom presets from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
    if (saved) {
      try {
        const loaded = JSON.parse(saved);
        setCustomPresets(loaded);
      } catch (error) {
        log.error('Failed to load custom presets', { error });
      }
    }
  }, []);

  // Save custom presets to localStorage
  const saveToLocalStorage = useCallback((presets: PhysicsPreset[]) => {
    localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(presets));
  }, []);

  // Handle apply preset
  const handleApplyPreset = useCallback((preset: PhysicsPreset) => {
    onApplyPreset(preset);
    toast.success(`Applied preset: ${preset.name} ${preset.icon}`);
  }, [onApplyPreset]);

  // Handle save current state as custom preset
  const handleSaveCustomPreset = useCallback(() => {
    if (!newPresetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    const newPreset: PhysicsPreset = {
      name: newPresetName.trim(),
      description: newPresetDescription.trim() || 'Custom user preset',
      icon: '💜',
      parameters: Object.fromEntries(currentParameters),
      expressions: currentExpressions,
      isBuiltIn: false
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    saveToLocalStorage(updated);

    toast.success(`Saved custom preset: ${newPreset.name}`);

    // Reset dialog
    setNewPresetName('');
    setNewPresetDescription('');
    setShowSaveDialog(false);
  }, [newPresetName, newPresetDescription, currentParameters, currentExpressions, customPresets, saveToLocalStorage]);

  // Handle delete custom preset
  const handleDeletePreset = useCallback((index: number) => {
    const presetToDelete = customPresets[index];

    if (confirm(`Delete preset "${presetToDelete.name}"?`)) {
      const updated = customPresets.filter((_, i) => i !== index);
      setCustomPresets(updated);
      saveToLocalStorage(updated);
      toast.success(`Deleted preset: ${presetToDelete.name}`);
    }
  }, [customPresets, saveToLocalStorage]);

  // Handle export preset as JSON file
  const handleExportPreset = useCallback((preset: PhysicsPreset) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `shizuku_preset_${preset.name.toLowerCase().replace(/\s+/g, '_')}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    toast.success(`Exported preset: ${preset.name}`);
  }, []);

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4
          style={{
            color: '#8B5CF6',
            fontSize: '16px',
            fontWeight: 'bold',
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Physics Presets Library
        </h4>

        <button
          onClick={() => setShowSaveDialog(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid #8B5CF6',
            borderRadius: '6px',
            color: '#8B5CF6',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <FaSave size={12} />
          Save Current
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            border: '1px solid #8B5CF6',
            borderRadius: '8px',
            marginBottom: '8px',
          }}
        >
          <h5
            style={{
              color: '#8B5CF6',
              fontSize: '14px',
              marginBottom: '12px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Save Custom Preset
          </h5>

          <input
            type="text"
            placeholder="Preset name..."
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '8px',
              outline: 'none',
            }}
          />

          <textarea
            placeholder="Description (optional)..."
            value={newPresetDescription}
            onChange={(e) => setNewPresetDescription(e.target.value)}
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '12px',
              outline: 'none',
              resize: 'vertical',
            }}
          />

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setNewPresetName('');
                setNewPresetDescription('');
              }}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCustomPreset}
              style={{
                padding: '6px 12px',
                backgroundColor: '#8B5CF6',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              Save Preset
            </button>
          </div>
        </motion.div>
      )}

      {/* Presets Grid */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingRight: '8px',
        }}
        className="custom-scrollbar"
      >
        {/* Built-in Presets Section */}
        <div style={{ marginBottom: '20px' }}>
          <h5
            style={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '12px',
              marginBottom: '12px',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            Built-in Presets ({BUILT_IN_PRESETS.length})
          </h5>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: '12px',
            }}
          >
            {BUILT_IN_PRESETS.map((preset, index) => (
              <PresetCard
                key={`builtin-${index}`}
                preset={preset}
                onApply={() => handleApplyPreset(preset)}
                onDelete={undefined}
                onExport={() => handleExportPreset(preset)}
              />
            ))}
          </div>
        </div>

        {/* Custom Presets Section */}
        {customPresets.length > 0 && (
          <div>
            <h5
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '12px',
                marginBottom: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}
            >
              Custom Presets ({customPresets.length})
            </h5>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              {customPresets.map((preset, index) => (
                <PresetCard
                  key={`custom-${index}`}
                  preset={preset}
                  onApply={() => handleApplyPreset(preset)}
                  onDelete={() => handleDeletePreset(index)}
                  onExport={() => handleExportPreset(preset)}
                />
              ))}
            </div>
          </div>
        )}
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

// Preset Card Component
interface PresetCardProps {
  preset: PhysicsPreset;
  onApply: () => void;
  onDelete?: () => void;
  onExport: () => void;
}

const PresetCard: React.FC<PresetCardProps> = ({ preset, onApply, onDelete, onExport }) => {
  const [isHovered, setIsHovered] = useState(false);

  const paramCount = Object.keys(preset.parameters).length;
  const exprCount = preset.expressions.length;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '16px',
        backgroundColor: isHovered
          ? 'rgba(139, 92, 246, 0.15)'
          : preset.isBuiltIn
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(168, 85, 247, 0.1)',
        border: `2px solid ${
          isHovered
            ? '#8B5CF6'
            : preset.isBuiltIn
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(168, 85, 247, 0.3)'
        }`,
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Main Apply Area */}
      <div onClick={onApply} style={{ cursor: 'pointer' }}>
        {/* Icon */}
        <div
          style={{
            fontSize: '36px',
            textAlign: 'center',
            marginBottom: '8px',
          }}
        >
          {preset.icon}
        </div>

        {/* Name */}
        <div
          style={{
            color: '#fff',
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '4px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          {preset.name}
        </div>

        {/* Description */}
        <div
          style={{
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '10px',
            textAlign: 'center',
            marginBottom: '8px',
            minHeight: '30px',
            lineHeight: '1.3',
          }}
        >
          {preset.description}
        </div>

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>{paramCount} params</span>
          <span>•</span>
          <span>{exprCount} expr</span>
        </div>
      </div>

      {/* Action Buttons (appear on hover) */}
      {isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            display: 'flex',
            gap: '4px',
          }}
        >
          {/* Export button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExport();
            }}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: 'rgba(34, 197, 94, 0.8)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Export as JSON"
          >
            <FaDownload size={10} />
          </button>

          {/* Delete button (only for custom presets) */}
          {onDelete && !preset.isBuiltIn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={{
                width: '24px',
                height: '24px',
                backgroundColor: 'rgba(239, 68, 68, 0.8)',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Delete preset"
            >
              <FaTrash size={10} />
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};
