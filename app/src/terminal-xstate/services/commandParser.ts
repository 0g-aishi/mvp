/**
 * @fileoverview Command Parser for XState Terminal
 * @description Parses and validates terminal commands for the aishiOS system
 */

export interface ParsedCommand {
  command: string;
  args: string[];
  rawInput: string;
  isValid: boolean;
  error?: string;
}

export type CommandType =
  | 'dream'
  | 'info'
  | 'stats'
  | 'mint'
  | 'memory'
  | 'personality'
  | 'unique-features'
  | 'chat'
  | 'help'
  | 'clear'
  | 'status'
  | 'broker'
  | 'model'
  | 'month-learn'
  | 'memory-core'
  | 'unknown';

// Available commands with descriptions
export const AVAILABLE_COMMANDS: Record<CommandType, string> = {
  dream: 'Process and analyze a dream with your agent',
  info: 'Display agent information and traits',
  stats: 'Show agent statistics and progress',
  mint: 'Create a new AI agent NFT',
  memory: 'Access agent memory and consolidation tools',
  personality: 'View agent personality traits and mood',
  'unique-features': 'Display agent unique features and abilities',
  chat: 'Start a conversation with your agent',
  help: 'Show available commands',
  clear: 'Clear terminal screen',
  status: 'Show system and agent status',
  broker: 'Manage broker operations',
  model: 'Select AI model for processing',
  'month-learn': 'Consolidate monthly memories and earn INT rewards',
  'memory-core': 'Create yearly memory core and evolve consciousness',
  unknown: 'Unknown command'
};

// Command tooltips for interactive help
export const COMMAND_TOOLTIPS: Record<string, string> = {
  dream: `Analyze dreams to evolve personality
• Cooldown: 24h (disabled in test)
• Every 3 dreams: +1 intelligence
• Every 5 dreams: Personality evolution
• Traits change: -10 to +10 points`,
  
  chat: `Converse with your agent
• Every 10 chats: +1 intelligence
• Builds conversation context
• Shapes agent's worldview`,
  
  personality: `View personality traits
• Six core traits [0-100]
• Dominant mood
• Response style
• Visual progress bars`,
  
  'unique-features': `Display agent unique abilities
• Features emerge through dream evolution
• Each feature has intensity [0-100]
• Powerful features marked as powerful
• Up to 5 features maximum`,
  
  stats: `Show agent statistics and progress
• Intelligence level and growth
• Dreams and conversations count
• Evolution milestones achieved
• Progress to next rewards`,
  
  clear: `Clear terminal screen
• Removes all previous output
• Keeps command history
• Fresh start for new commands`,
  
  memory: `Hierarchical memory system
• Daily: Individual experiences
• Monthly: AI-consolidated summaries
• Yearly: Deep reflection & core
• Consolidation rewards for streaks`,

  'month-learn': `Monthly memory consolidation
• Available after month change
• Consolidates daily dreams + conversations
• Rewards: +2 INT + streak bonus
• Clears daily memory hashes
• Required for living memory system`,

  'memory-core': `Yearly consciousness crystallization
• Available after December consolidation
• Analyzes 12 monthly consolidations
• Creates soul/wisdom core
• Rewards: +5 INT bonus
• Represents agent's evolved essence`
};

// Command aliases for user convenience
const COMMAND_ALIASES: Record<string, CommandType> = {
  'd': 'dream',
  'i': 'info',
  's': 'stats',
  'm': 'mint',
  'mem': 'memory',
  'p': 'personality',
  'uf': 'unique-features',
  'features': 'unique-features',
  'c': 'chat',
  'h': 'help',
  'cls': 'clear',
  '?': 'help'
};

/**
 * Parses raw input into a structured command
 */
export function parseCommand(input: string): ParsedCommand {
  const trimmedInput = input.trim();
  
  // Empty input
  if (!trimmedInput) {
    return {
      command: '',
      args: [],
      rawInput: input,
      isValid: false,
      error: 'Empty command'
    };
  }

  // Split into command and arguments
  const parts = trimmedInput.split(/\s+/);
  const commandStr = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Check if it's a direct command or alias
  let commandType: CommandType = 'unknown';
  
  if (commandStr in AVAILABLE_COMMANDS) {
    commandType = commandStr as CommandType;
  } else if (commandStr in COMMAND_ALIASES) {
    commandType = COMMAND_ALIASES[commandStr];
  }

  // Validate command
  const isValid = commandType !== 'unknown';

  return {
    command: commandType,
    args,
    rawInput: input,
    isValid,
    error: isValid ? undefined : `Unknown command: ${commandStr}. Type 'help' for available commands.`
  };
}

/**
 * Validates command arguments based on command type
 */
export function validateCommandArgs(command: CommandType, args: string[]): { valid: boolean; error?: string } {
  switch (command) {
    case 'mint':
      if (args.length === 0) {
        return { valid: false, error: 'Agent name required. Usage: mint <name>' };
      }
      if (args[0].length > 32) {
        return { valid: false, error: 'Agent name too long (max 32 characters)' };
      }
      return { valid: true };

    case 'info':
    case 'stats':
    case 'memory':
    case 'personality':
    case 'unique-features':
    case 'status':
      // Optional agent ID argument
      if (args.length > 1) {
        return { valid: false, error: 'Too many arguments. Usage: ' + command + ' [agentId]' };
      }
      return { valid: true };

    case 'dream':
      // No arguments needed - will wait for dream input
      if (args.length > 0) {
        return { valid: false, error: 'Dream command takes no arguments. Just type "dream" and press Enter.' };
      }
      return { valid: true };

    case 'chat':
      // Optional message to start chat
      return { valid: true };

    case 'model':
      // Model selection argument
      if (args.length === 0) {
        return { valid: false, error: 'Model ID required. Usage: model <modelId>' };
      }
      return { valid: true };

    case 'broker':
      // Broker subcommands
      if (args.length === 0) {
        return { valid: false, error: 'Broker action required. Usage: broker <fund|status|withdraw>' };
      }
      const brokerActions = ['fund', 'status', 'withdraw'];
      if (!brokerActions.includes(args[0])) {
        return { valid: false, error: `Invalid broker action. Available: ${brokerActions.join(', ')}` };
      }
      return { valid: true };

    case 'help':
      // Optional command argument
      if (args.length > 1) {
        return { valid: false, error: 'Too many arguments. Usage: help [command]' };
      }
      return { valid: true };
      
    case 'clear':
      // No arguments needed
      if (args.length > 0) {
        return { valid: false, error: `Command '${command}' takes no arguments` };
      }
      return { valid: true };

    case 'month-learn':
    case 'memory-core':
      // No arguments needed
      if (args.length > 0) {
        return { valid: false, error: `Command '${command}' takes no arguments` };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Gets help text for a specific command
 */
export function getCommandHelp(command: CommandType): string {
  const description = AVAILABLE_COMMANDS[command];
  
  switch (command) {
    case 'mint':
      return `${description}\nUsage: mint <name>\nExample: mint Aurora`;
    case 'info':
      return `${description}\nUsage: info [agentId]\nExample: info or info 123`;
    case 'dream':
      return `${description}\nUsage: dream\nThen describe your dream when prompted`;
    case 'chat':
      return `${description}\nUsage: chat [initial message]\nExample: chat Hello!`;
    case 'broker':
      return `${description}\nUsage: broker <fund|status|withdraw>\nExample: broker fund`;
    case 'model':
      return `${description}\nUsage: model <modelId>\nExample: model gpt-4`;
    default:
      return description;
  }
}

/**
 * Formats help output for all commands
 */
export function formatHelpOutput(): string[] {
  const lines: string[] = [
    '╔════════════════════════════════════════════════════╗',
    '║             aishiOS Terminal Commands              ║',
    '╚════════════════════════════════════════════════════╝',
    '',
    'Available commands:',
    ''
  ];

  // Group commands by category
  const categories = {
    'Agent Operations': ['personality', 'unique-features', 'stats', 'memory'],
    'Interactions': ['dream', 'chat'],
    'System': ['broker', 'model', 'status'],
    'Terminal': ['help', 'clear']
  };

  for (const [category, commands] of Object.entries(categories)) {
    lines.push(`[${category}]`);
    for (const cmd of commands) {
      const description = AVAILABLE_COMMANDS[cmd as CommandType];
      const aliases = Object.entries(COMMAND_ALIASES)
        .filter(([_, value]) => value === cmd)
        .map(([key]) => key);
      
      const aliasText = aliases.length > 0 ? ` (${aliases.join(', ')})` : '';
      lines.push(`  ${cmd}${aliasText} - ${description}`);
    }
    lines.push('');
  }

  lines.push('Type "<command> -h" for detailed help on a specific command');
  
  return lines;
}

/**
 * Checks if input is requesting help for a command
 */
export function isHelpRequest(input: string): { isHelp: boolean; command?: CommandType } {
  const parts = input.trim().split(/\s+/);
  
  if (parts.length === 2 && (parts[1] === '-h' || parts[1] === '--help')) {
    const cmd = parseCommand(parts[0]);
    if (cmd.isValid) {
      return { isHelp: true, command: cmd.command as CommandType };
    }
  }
  
  return { isHelp: false };
}

/**
 * Gets main help with interactive elements
 */
export function getInteractiveHelp(): string[] {
  return [
    '',
    'Commands:',
    `  dream            Process and analyze your dreams     ⓘ`,
    `  personality      View agent personality traits       ⓘ`,
    `  unique-features  Display agent unique abilities      ⓘ`,
    `  stats            Show agent statistics and progress  ⓘ`,
    `  chat             Have a conversation with your agent  ⓘ`,
    `  memory           View and manage agent memory         ⓘ`,
    `  clear            Clear terminal screen               ⓘ`,
    '',
    `[Click ⓘ for details or type 'help <command>']`,
    ''
  ];
}

/**
 * Gets detailed help for dream command
 */
export function getDreamDetailedHelp(): string[] {
  return [
    '',
    'DREAM - Analyze dreams for personality evolution',
    '',
    'DESCRIPTION:',
    '  Share your dreams with your agent to discover subconscious patterns',
    '  and evolve its personality based on emotional and thematic analysis.',
    '',
    'MECHANICS:',
    '  • Cooldown: 24 hours between dreams (disabled in test mode)',
    '  • Every 3 dreams: +1 intelligence level',
    '  • Every 5 dreams: Personality evolution',
    '    - Traits change by -10 to +10 points',
    '    - Dominant mood updates',
    '    - Up to 2 unique features per evolution (max 5 total)',
    '',
    'PERSONALITY TRAITS:',
    '  Creativity   [0-100]  Innovation and artistic thinking',
    '  Analytical   [0-100]  Logic and systematic reasoning',
    '  Empathy      [0-100]  Emotional understanding',
    '  Intuition    [0-100]  Pattern recognition',
    '  Resilience   [0-100]  Adaptability under stress',
    '  Curiosity    [0-100]  Drive to explore and learn',
    '',
    'MILESTONES:',
    '  85+ Empathy     → "Empathy Master"',
    '  90+ Creativity  → "Creative Genius"',
    '  90+ Analytical  → "Logic Lord"',
    '  90+ Intuition   → "Spiritual Guide"',
    '  60+ All traits  → "Balanced Soul"',
    '',
    'USAGE:',
    '  1. Type \'dream\' and press Enter',
    '  2. Describe your dream when prompted (~)',
    '  3. Review AI analysis of patterns and impacts',
    '  4. Confirm with \'y\' to save and evolve personality',
    '',
    'STORAGE:',
    '  • Dreams saved to daily memory files (append-only)',
    '  • Uploaded to 0G decentralized storage',
    '  • Hash recorded on blockchain for verification',
    ''
  ];
}

/**
 * Gets detailed help for any command
 */
export function getDetailedCommandHelp(command: string): string[] {
  switch(command) {
    case 'dream':
      return getDreamDetailedHelp();
    case 'chat':
      return [
        '',
        'CHAT - Converse with your agent',
        '',
        'Coming soon...',
        '',
        'Build meaningful conversations that shape your agent\'s understanding.',
        '• Every 10 conversations: +1 intelligence',
        '• Context types: casual, deep, philosophical',
        '• Conversations saved to daily memory',
        '',
        'This feature is currently in development.',
        ''
      ];
    case 'info':
      return [
        '',
        'INFO - View agent statistics',
        '',
        'Display comprehensive agent data:',
        '• Personality traits and levels',
        '• Intelligence and evolution stats',
        '• Dream and conversation counts',
        '• Response style based on traits',
        ''
      ];
    case 'memory':
      return [
        '',
        'MEMORY - Hierarchical memory system',
        '',
        'Coming soon...',
        '',
        'Three-tier memory architecture:',
        '• Daily: Raw dreams and conversations',
        '• Monthly: AI-consolidated summaries',
        '• Yearly: Deep reflection and core memories',
        '',
        'Consolidation rewards:',
        '• Monthly consolidation: +2 intelligence',
        '• Streak bonuses for consistent activity',
        '• Early bird bonus for timely consolidations',
        '',
        'This feature is currently in development.',
        ''
      ];
    default:
      return [`Unknown command: ${command}`, '', 'Type \'help\' for available commands', ''];
  }
}

/**
 * Suggests commands based on partial input (for autocomplete)
 */
export function suggestCommands(partialInput: string): CommandType[] {
  if (!partialInput) return [];
  
  const lower = partialInput.toLowerCase();
  const suggestions: CommandType[] = [];
  
  // Check direct commands
  for (const cmd of Object.keys(AVAILABLE_COMMANDS)) {
    if (cmd !== 'unknown' && cmd.startsWith(lower)) {
      suggestions.push(cmd as CommandType);
    }
  }
  
  // Check aliases
  for (const [alias, cmd] of Object.entries(COMMAND_ALIASES)) {
    if (alias.startsWith(lower) && !suggestions.includes(cmd)) {
      suggestions.push(cmd);
    }
  }
  
  return suggestions;
}