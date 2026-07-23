/**
 * @fileoverview Live2D Chat Prompt Builder
 * @description Extends terminal chat prompts with Live2D body language control
 */

import { buildChatPrompt } from '@/terminal-xstate/services/chatPromptBuilder';
import type { ChatMessage } from '@/terminal-xstate/machines/chatMachine';
import { buildParameterSpec, CONTROLLABLE_PARAMETERS } from './aiParameterService';
import { logger } from '@/lib/logger';

const log = logger.child({ component: 'Live2DChatPromptBuilder' });

/**
 * Build Live2D-enhanced chat prompt
 * Wraps existing terminal chat prompt with parameter control specification
 */
export function buildLive2DChatPrompt(params: {
  userMessage: string;
  messages: ChatMessage[];
  agentContext: any;
  historicalData: any;
  agentName: string;
  isFirstMessage: boolean;
  currentParameters: Map<string, number>;
}): string {
  log.debug('Building Live2D-enhanced chat prompt', {
    isFirstMessage: params.isFirstMessage,
    messageCount: params.messages.length,
    parameterCount: params.currentParameters.size
  });

  // Build base chat prompt using existing terminal system
  const baseChatPrompt = buildChatPrompt({
    userMessage: params.userMessage,
    messages: params.messages,
    agentContext: params.agentContext,
    historicalData: params.historicalData,
    agentName: params.agentName,
    isFirstMessage: params.isFirstMessage
  });

  // Build Live2D parameter specification
  const parameterContext = buildLive2DParameterContext(params.currentParameters, params.agentName);

  // Find injection point (before "**Your Response:**" marker)
  const responseMarkerIndex = baseChatPrompt.lastIndexOf('**Your Response:**');

  if (responseMarkerIndex === -1) {
    // Fallback: append at end
    log.debug('Response marker not found, appending Live2D context at end');
    return baseChatPrompt + '\n\n' + parameterContext;
  }

  // Inject parameter context before response marker
  const beforeResponse = baseChatPrompt.substring(0, responseMarkerIndex);
  const afterResponse = baseChatPrompt.substring(responseMarkerIndex);

  const enhancedPrompt = beforeResponse + parameterContext + '\n\n' + afterResponse;

  log.debug('Live2D prompt built successfully', {
    originalLength: baseChatPrompt.length,
    enhancedLength: enhancedPrompt.length,
    addedLength: parameterContext.length
  });

  return enhancedPrompt;
}

/**
 * Build Live2D parameter control context for AI
 */
function buildLive2DParameterContext(currentValues: Map<string, number>, agentName: string): string {
  const paramSpec = buildParameterSpec(currentValues);

  const context = `## YOUR LIVE2D EMBODIMENT

You ARE ${agentName}, physically embodied in a Live2D form. The user sees you as a living character. This is YOUR body—move naturally.

**Your Emotional Expressions (Choose ONE):**
- "爱心眼" (love eyes) - When feeling love/adoration
- "星星眼" (starry eyes) - When excited/amazed
- "生气" (angry face) - When irritated/upset
- "哭哭" (crying) - When sad/emotional
- "黑脸" (dark face) - When serious/stern
- "脸红" (blush) - When shy/embarrassed
- "空白眼" (blank eyes) - When confused/processing
- "蚊香眼" (dizzy eyes) - When overwhelmed/dazed

**Your Body Parameters (Current State):**
${paramSpec}

**Response Format (Always include at end):**
\`\`\`json
{
  "parameters": {"HeadY": 5, "LeftBrowY": 0.3},
  "expressions": ["星星眼"]
}
\`\`\`

**Preset Examples:**

Happy: {"parameters": {"HeadY": 5, "LeftBrowY": 0.3, "RightBrowY": 0.3}, "expressions": ["星星眼"]}
Sad: {"parameters": {"HeadY": -10, "LeftBrowY": -0.4, "RightBrowY": -0.4}, "expressions": ["哭哭"]}
Angry: {"parameters": {"HeadY": 0, "LeftBrowY": -0.6, "RightBrowY": -0.6}, "expressions": ["生气"]}
Love: {"parameters": {"HeadY": 3, "CheekPuff": 0.3}, "expressions": ["爱心眼", "脸红"]}
Thinking: {"parameters": {"HeadX": -8, "HeadY": 12, "EyeGazeY": 0.3}, "expressions": ["空白眼"]}
Surprised: {"parameters": {"HeadY": 2, "LeftEyeOpen": 1.6, "RightEyeOpen": 1.6, "LeftBrowY": 0.8, "RightBrowY": 0.8}, "expressions": []}

**Rules:**
1. Respond as if YOU have this body ("my eyes widen" not "setting parameter")
2. Use smooth values (0.3-0.7, avoid extremes like 1.0 unless necessary)
3. Expressions work with parameters (blush + smile params = shy happiness)
4. Empty arrays OK: {"parameters": {}, "expressions": []}
`;

  return context;
}

/**
 * Build simplified parameter context for follow-up messages
 * (Shorter version to save tokens after first message)
 */
export function buildSimplifiedParameterContext(currentValues: Map<string, number>): string {
  const currentState = CONTROLLABLE_PARAMETERS
    .map(p => {
      const value = currentValues.get(p.id) ?? p.default;
      return `${p.name}:${value.toFixed(2)}`;
    })
    .join(', ');

  return `
## BODY STATE
Current: ${currentState}

Return JSON: \`\`\`json{"parameters":{"ParamName":value}}\`\`\`
`;
}
