'use client';

import React, { useState, useCallback } from 'react';
import { FaUndo, FaInfo } from 'react-icons/fa';
import type { ParameterDefinition } from './ParameterDefinitions';

export interface ParameterSliderProps {
  parameterId: string;
  definition: ParameterDefinition;
  currentValue: number;
  onChange: (value: number) => void;
  onReset: () => void;
  showDetails?: boolean;
}

export const ParameterSlider: React.FC<ParameterSliderProps> = ({
  parameterId,
  definition,
  currentValue,
  onChange,
  onReset,
  showDetails = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const { label, min, max, step, default: defaultValue, description, unit } = definition;

  // Check if parameter is modified from default
  const isModified = Math.abs(currentValue - defaultValue) > 0.001;

  // Calculate percentage for visual fill
  const percentage = ((currentValue - min) / (max - min)) * 100;

  // Handle slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  }, [onChange]);

  // Handle numeric input change
  const handleNumericChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    if (!isNaN(value)) {
      // Clamp to min/max
      const clampedValue = Math.max(min, Math.min(max, value));
      onChange(clampedValue);
    }
  }, [onChange, min, max]);

  return (
    <div
      className="parameter-slider"
      style={{
        padding: '12px 16px',
        backgroundColor: isFocused
          ? 'rgba(139, 92, 246, 0.1)'
          : isModified
          ? 'rgba(139, 92, 246, 0.05)'
          : 'rgba(255, 255, 255, 0.03)',
        borderRadius: '8px',
        marginBottom: '12px',
        border: `1px solid ${
          isFocused
            ? 'rgba(139, 92, 246, 0.5)'
            : isModified
            ? 'rgba(139, 92, 246, 0.2)'
            : 'rgba(255, 255, 255, 0.05)'
        }`,
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <label
            style={{
              color: isModified ? '#8B5CF6' : '#fff',
              fontSize: '13px',
              fontWeight: isModified ? 'bold' : 'normal',
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
            htmlFor={`slider-${parameterId}`}
          >
            {label}
          </label>

          {/* Info icon */}
          {description && (
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <FaInfo size={12} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Parameter ID badge */}
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(255, 255, 255, 0.4)',
              fontFamily: "'JetBrains Mono', monospace",
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          >
            {parameterId}
          </span>

          {/* Reset button */}
          <button
            onClick={onReset}
            disabled={!isModified}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: isModified ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              border: `1px solid ${isModified ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
              borderRadius: '4px',
              color: isModified ? '#8B5CF6' : 'rgba(255, 255, 255, 0.3)',
              cursor: isModified ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              opacity: isModified ? 1 : 0.5,
            }}
            title="Reset to default"
          >
            <FaUndo size={10} />
          </button>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && description && (
        <div
          style={{
            position: 'absolute',
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '6px',
            fontSize: '11px',
            maxWidth: '250px',
            zIndex: 1000,
            border: '1px solid rgba(139, 92, 246, 0.3)',
            marginTop: '-40px',
            marginLeft: '150px',
            pointerEvents: 'none',
          }}
        >
          {description}
        </div>
      )}

      {/* Controls Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '4px',
        }}
      >
        {/* Range Slider */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            id={`slider-${parameterId}`}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={handleSliderChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none',
              background: `linear-gradient(to right,
                #8B5CF6 0%,
                #8B5CF6 ${percentage}%,
                rgba(255, 255, 255, 0.1) ${percentage}%,
                rgba(255, 255, 255, 0.1) 100%)`,
              cursor: 'pointer',
            }}
          />
        </div>

        {/* Numeric Input */}
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={currentValue.toFixed(2)}
          onChange={handleNumericChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={{
            width: '80px',
            padding: '6px 8px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: `1px solid ${isFocused ? '#8B5CF6' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: '4px',
            color: '#fff',
            fontSize: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            textAlign: 'right',
            outline: 'none',
            transition: 'border-color 0.2s ease',
          }}
        />
      </div>

      {/* Value Range Display */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: 'rgba(255, 255, 255, 0.4)',
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <span>
          Min: {min}
          {unit}
        </span>
        <span style={{ color: isModified ? '#8B5CF6' : 'rgba(255, 255, 255, 0.6)' }}>
          Current: {currentValue.toFixed(2)}
          {unit}
        </span>
        <span>
          Max: {max}
          {unit}
        </span>
      </div>

      {/* Extended Details (optional) */}
      {showDetails && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '4px',
            fontSize: '10px',
            color: 'rgba(255, 255, 255, 0.6)',
          }}
        >
          <div>Default: {defaultValue}{unit}</div>
          <div>Step: {step}</div>
          {description && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{description}</div>}
        </div>
      )}

      {/* Custom Slider Styling */}
      <style jsx>{`
        input[type='range']::-webkit-slider-thumb {
          appearance: none;
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
          transition: all 0.2s ease;
        }

        input[type='range']::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.6);
        }

        input[type='range']::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #8b5cf6;
          border: 2px solid #fff;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
          transition: all 0.2s ease;
        }

        input[type='range']::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.6);
        }

        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};
