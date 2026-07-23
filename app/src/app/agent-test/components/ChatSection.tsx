'use client';

import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAgentChat } from '../../../hooks/agentHooks/useAgentChat';
import { useAgentRead } from '../../../hooks/agentHooks/useAgentRead';
import { logger } from '@/lib/logger';
import { MessageCircle, Send, Loader2, AlertCircle, Database, Users, Sparkles, Bot, User, Save } from 'lucide-react';
import { ChatMessage } from '../../../hooks/agentHooks/services/conversationContextBuilder';

interface ChatSectionProps {
  hasAgent: boolean;
  effectiveTokenId: number | undefined;
}

export default function ChatSection({
  hasAgent,
  effectiveTokenId
}: ChatSectionProps) {
  const { theme } = useTheme();
  const [input, setInput] = useState('');
  const [showIntroduction, setShowIntroduction] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Agent data from useAgentRead
  const { 
    agentData, 
    isLoading: isLoadingAgent 
  } = useAgentRead(effectiveTokenId);

  // Chat functionality
  const {
    session,
    isInitializing,
    initializeSession,
    resetSession,
    messages,
    sendMessage,
    isTyping,
    saveConversation,
    isSaving,
    saveStatus,
    isProcessingContract,
    contractStatus,
    error,
    clearError,
    lastPrompt
  } = useAgentChat(effectiveTokenId);

const log = logger.child({ component: 'ChatSection' });

const debugLog = (message: string, data?: any) => {
    log.debug(message, data || {});
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Early return if no agent
  if (!hasAgent) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <AlertCircle size={48} style={{ color: theme.text.secondary, marginBottom: '20px' }} />
        <h3 style={{ color: theme.text.primary, marginBottom: '10px' }}>
          No Agent Found
        </h3>
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          You need to mint an agent first to start chatting.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoadingAgent) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '40px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <Loader2 size={32} style={{ 
          color: theme.accent.primary, 
          marginBottom: '15px',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: theme.text.secondary, fontSize: '14px' }}>
          Loading agent data...
        </p>
      </div>
    );
  }

  const handleStartChat = async () => {
    debugLog('Starting chat session', { effectiveTokenId, hasAgentData: !!agentData });
    setShowIntroduction(false);
    await initializeSession(agentData);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;
    
    const messageToSend = input.trim();
    setInput('');
    debugLog('Sending message', { messageLength: messageToSend.length });
    
    await sendMessage(messageToSend);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSaveConversation = async () => {
    debugLog('Saving conversation', { messageCount: messages.length });
    await saveConversation();
  };

  const handleResetChat = () => {
    debugLog('Resetting chat session');
    resetSession();
    setShowIntroduction(true);
    setInput('');
    setShowPrompt(false);
  };

  // Introduction screen
  if (showIntroduction) {
    return (
      <div style={{
        backgroundColor: theme.bg.card,
        border: `1px solid ${theme.border}`,
        borderRadius: '12px',
        padding: '30px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <MessageCircle size={32} style={{ color: theme.accent.primary }} />
          <div>
            <h3 style={{ color: theme.text.primary, margin: 0, marginBottom: '5px' }}>
              Agent Chat
            </h3>
            <p style={{ color: theme.text.secondary, fontSize: '14px', margin: 0 }}>
              Have a conversation with your AI agent
            </p>
          </div>
        </div>

        {agentData && (
          <div style={{
            backgroundColor: theme.bg.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px'
            }}>
              <Bot size={20} style={{ color: theme.accent.primary }} />
              <h4 style={{ color: theme.text.primary, margin: 0 }}>
                {agentData.agentName}
              </h4>
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: theme.text.secondary, marginBottom: '5px' }}>Intelligence Level</div>
                <div style={{ color: theme.text.primary, fontWeight: '600' }}>{agentData.intelligenceLevel}</div>
              </div>
              <div>
                <div style={{ color: theme.text.secondary, marginBottom: '5px' }}>Conversations</div>
                <div style={{ color: theme.text.primary, fontWeight: '600' }}>{agentData.conversationCount}</div>
              </div>
              <div>
                <div style={{ color: theme.text.secondary, marginBottom: '5px' }}>Dreams Analyzed</div>
                <div style={{ color: theme.text.primary, fontWeight: '600' }}>{agentData.dreamCount}</div>
              </div>
            </div>
            
            {agentData.personality && (
              <div style={{ marginTop: '15px' }}>
                <div style={{ color: theme.text.secondary, marginBottom: '10px', fontSize: '14px' }}>Personality Traits</div>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  {[
                    { name: 'Creativity', value: agentData.personality.creativity },
                    { name: 'Empathy', value: agentData.personality.empathy },
                    { name: 'Curiosity', value: agentData.personality.curiosity },
                    { name: 'Intuition', value: agentData.personality.intuition }
                  ].map(trait => (
                    <div key={trait.name} style={{
                      backgroundColor: theme.bg.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      color: theme.text.primary
                    }}>
                      {trait.name}: {trait.value}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{
          backgroundColor: theme.bg.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '14px',
          color: theme.text.secondary
        }}>
          💬 Start a conversation with your AI agent. They will embody their personality traits and remember your interactions. You can save meaningful conversations to their memory.
        </div>

        <button
          onClick={handleStartChat}
          disabled={isInitializing}
          style={{
            backgroundColor: isInitializing ? theme.bg.card : theme.accent.primary,
            color: isInitializing ? theme.text.secondary : 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: isInitializing ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            margin: '0 auto'
          }}
        >
          {isInitializing ? (
            <>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              Initializing...
            </>
          ) : (
            <>
              <MessageCircle size={16} />
              Start Chat
            </>
          )}
        </button>
      </div>
    );
  }

  // Chat interface
  return (
    <div style={{
      backgroundColor: theme.bg.card,
      border: `1px solid ${theme.border}`,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
        paddingBottom: '15px',
        borderBottom: `1px solid ${theme.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <MessageCircle size={24} style={{ color: theme.accent.primary }} />
          <div>
            <h3 style={{ color: theme.text.primary, margin: 0, fontSize: '16px' }}>
              Chat with {agentData?.agentName || 'Agent'}
            </h3>
            <p style={{ color: theme.text.secondary, fontSize: '12px', margin: 0 }}>
              {session?.sessionId.split('_')[2] ? 
                `Session: ${new Date(Number(session.sessionId.split('_')[2])).toLocaleTimeString()}` : 
                'Active conversation'
              }
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {lastPrompt && (
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              style={{
                backgroundColor: showPrompt ? theme.accent.primary : theme.bg.panel,
                color: showPrompt ? 'white' : theme.text.secondary,
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showPrompt ? 'Hide Prompt' : 'Show Prompt'}
            </button>
          )}
          <button
            onClick={handleResetChat}
            style={{
              backgroundColor: theme.bg.panel,
              color: theme.text.secondary,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            New Chat
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px',
          borderRadius: '6px',
          marginBottom: '15px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={16} />
          {error}
          <button
            onClick={clearError}
            style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: 'none',
              marginLeft: 'auto',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Prompt Display */}
      {showPrompt && lastPrompt && (
        <div style={{
          backgroundColor: theme.bg.panel,
          border: `1px solid ${theme.border}`,
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            color: theme.text.primary,
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '10px'
          }}>
            Last Conversation Prompt:
          </div>
          <textarea
            value={lastPrompt}
            readOnly
            style={{
              width: '100%',
              height: '200px',
              backgroundColor: theme.bg.card,
              color: theme.text.primary,
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              padding: '10px',
              fontSize: '12px',
              fontFamily: 'monospace',
              resize: 'vertical'
            }}
          />
        </div>
      )}

      {/* Messages */}
      <div style={{
        height: '400px',
        overflowY: 'auto',
        marginBottom: '20px',
        border: `1px solid ${theme.border}`,
        borderRadius: '8px',
        padding: '15px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.text.secondary,
            fontSize: '14px',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <Sparkles size={24} />
            <p>Start a conversation with your agent...</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} theme={theme} />
            ))}
            {isTyping && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px',
                marginTop: '10px'
              }}>
                <Bot size={16} style={{ color: theme.accent.primary }} />
                <div style={{ color: theme.text.secondary, fontSize: '14px' }}>
                  {agentData?.agentName || 'Agent'} is typing...
                </div>
                <Loader2 size={16} style={{ 
                  color: theme.accent.primary, 
                  animation: 'spin 1s linear infinite' 
                }} />
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'flex-end'
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isTyping}
          style={{
            flex: 1,
            backgroundColor: theme.bg.panel,
            color: theme.text.primary,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px',
            minHeight: '44px',
            maxHeight: '100px',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isTyping}
          style={{
            backgroundColor: (!input.trim() || isTyping) ? theme.bg.panel : theme.accent.primary,
            color: (!input.trim() || isTyping) ? theme.text.secondary : 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            cursor: (!input.trim() || isTyping) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}
        >
          <Send size={16} />
        </button>
      </div>

      {/* Save Conversation */}
      {messages.length > 0 && (
        <div style={{
          marginTop: '20px',
          paddingTop: '15px',
          borderTop: `1px solid ${theme.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <button
            onClick={handleSaveConversation}
            disabled={isSaving || isProcessingContract}
            style={{
              backgroundColor: (isSaving || isProcessingContract) ? theme.bg.panel : theme.accent.secondary,
              color: (isSaving || isProcessingContract) ? theme.text.secondary : 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: (isSaving || isProcessingContract) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {(isSaving || isProcessingContract) ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Conversation
              </>
            )}
          </button>
          
          {/* Status Messages */}
          {(saveStatus || contractStatus) && (
            <div style={{
              fontSize: '12px',
              color: (saveStatus?.includes('successfully') || contractStatus?.includes('successfully')) ? 
                '#44ff44' : theme.text.secondary,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {(isSaving || isProcessingContract) ? (
                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (saveStatus?.includes('successfully') || contractStatus?.includes('successfully')) ? (
                <Database size={12} style={{ color: '#44ff44' }} />
              ) : (
                <Database size={12} />
              )}
              {saveStatus || contractStatus}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  theme: any;
}

function MessageBubble({ message, theme }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const timeAgo = getTimeAgo(message.timestamp);
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      marginBottom: '15px',
      flexDirection: isUser ? 'row-reverse' : 'row'
    }}>
      {/* Avatar */}
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: isUser ? theme.accent.primary : theme.accent.secondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {isUser ? (
          <User size={16} style={{ color: 'white' }} />
        ) : (
          <Bot size={16} style={{ color: 'white' }} />
        )}
      </div>
      
      {/* Message */}
      <div style={{
        maxWidth: '70%',
        backgroundColor: isUser ? theme.accent.primary : theme.bg.panel,
        color: isUser ? 'white' : theme.text.primary,
        padding: '12px 16px',
        borderRadius: '16px',
        fontSize: '14px',
        lineHeight: '1.4',
        wordBreak: 'break-word'
      }}>
        <div style={{ marginBottom: '4px' }}>
          {message.content}
        </div>
        <div style={{
          fontSize: '11px',
          opacity: 0.7,
          marginTop: '6px'
        }}>
          {timeAgo}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'now';
} 
