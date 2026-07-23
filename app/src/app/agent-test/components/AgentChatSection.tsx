import ChatSection from './ChatSection';

interface AgentChatSectionProps {
  hasAgent: boolean;
  effectiveTokenId: number | undefined;
  agentData?: any;
}

export default function AgentChatSection({
  hasAgent,
  effectiveTokenId,
  agentData
}: AgentChatSectionProps) {
  return (
    <ChatSection
      hasAgent={hasAgent}
      effectiveTokenId={effectiveTokenId}
    />
  );
}
