'use client';

import { useTheme } from '../../../contexts/ThemeContext';
import { GiWallet, GiQuillInk, GiConfirmed, GiSparkles } from 'react-icons/gi';

interface MintStepperProps {
  isConnected: boolean;
  agentName: string;
  nameError: string;
}

export default function MintStepper({
  isConnected,
  agentName,
  nameError,
}: MintStepperProps) {
  const { theme } = useTheme();

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      marginTop: theme.spacing.xxl,
      marginBottom: theme.spacing.xxl,
    }}>
      <div style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: theme.spacing.xs,
        padding: theme.spacing.md,
        backgroundColor: `${theme.bg.card}66`,
        borderRadius: theme.radius.md,
        border: `1px solid ${theme.accent.primary}22`,
      }}>
        {[
          { icon: GiWallet, text: 'Connect wallet', completed: isConnected },
          { icon: GiQuillInk, text: 'Choose name', completed: agentName && !nameError },
          { icon: GiConfirmed, text: 'Confirm', completed: false },
          { icon: GiSparkles, text: 'Ready', completed: false },
        ].map(({ icon: Icon, text, completed }, index) => (
          <div key={text} style={{ display: 'contents' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              flex: 1,
              opacity: completed ? 1 : 0.5,
              transition: theme.effects.transitions.normal,
            }}>
              <Icon
                size={18}
                color={completed ? theme.accent.success : theme.text.secondary}
                style={{ transition: theme.effects.transitions.normal }}
              />
              <span style={{
                fontSize: `clamp(9px, 2vw, ${theme.typography.fontSizes.xs})`,
                color: completed ? theme.text.primary : theme.text.secondary,
                textAlign: 'center',
                transition: theme.effects.transitions.normal,
              }}>
                {text}
              </span>
            </div>
            {index < 3 && (
              <div style={{
                width: '100%',
                maxWidth: '40px',
                height: '2px',
                backgroundColor: completed ? theme.accent.success : `${theme.text.secondary}44`,
                flex: '0 1 auto',
                transition: theme.effects.transitions.normal,
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
