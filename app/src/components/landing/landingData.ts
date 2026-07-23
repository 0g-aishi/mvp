import { IconType } from 'react-icons';
import {
  GiPadlock,
  GiBrain,
  GiCrystalBall,
  GiMagicSwirl,
  GiProcessor,
  GiServerRack,
  GiDatabase,
  GiCube
} from 'react-icons/gi';

export interface ValueProp {
  icon: IconType;
  title: string;
  description: string;
}

export interface Step {
  title: string;
  desc: string;
}

export interface StackComponent {
  icon: IconType;
  title: string;
  description: string;
}

export const valueProps: ValueProp[] = [
  {
    icon: GiPadlock,
    title: 'Private by design',
    description: 'Your data lives under your control. We can\'t see your dreams or chats.'
  },
  {
    icon: GiBrain,
    title: 'Memory that actually lasts',
    description: 'Auto month-learn + memory-core preserve long-term context without bloat.'
  },
  {
    icon: GiCrystalBall,
    title: 'A companion that evolves',
    description: 'Traits, intelligence, and response style grow with you — an iNFT that\'s truly yours.'
  },
  {
    icon: GiMagicSwirl,
    title: 'Patterns you can act on',
    description: 'Uncovers triggers, loops, and themes across weeks and years — with clear next steps.'
  }
];

export const steps: Step[] = [
  { title: 'Connect & mint', desc: 'Name your Aishi iNFT.' },
  { title: 'Share a dream or chat', desc: 'Instant analysis.' },
  { title: 'You approve memory', desc: 'You choose what\'s saved.' },
  { title: 'Auto-consolidation', desc: 'Month-learn + memory-core keep long-term context.' }
];

export const traits: string[] = [
  'Intelligence', 
  'Creativity', 
  'Empathy', 
  'Intuition', 
  'Resilience', 
  'Curiosity'
];

export const stackComponents: StackComponent[] = [
  {
    icon: GiProcessor,
    title: '0G Compute',
    description: 'Decentralized AI inference for dream/chat analysis'
  },
  {
    icon: GiServerRack,
    title: '0G Storage',
    description: 'Encrypted, append-only archive under your control'
  },
  {
    icon: GiDatabase,
    title: '0G DA',
    description: "Verifiable availability for your agent's memory"
  },
  {
    icon: GiCube,
    title: '0G Chain',
    description: 'On-chain iNFT identity and memory pointers'
  }
];

export const badges: string[] = [
  '0G-native',
  'Ownable iNFT',
  'Private by design',
  'Live2D Companion',
  'Memory that lasts'
];

// Removed unused data: dreamInspirations, howAishiMakesItReal, disclaimer, agentProblems, aishiSolutions
// These sections have been eliminated from the home page to reduce duplication and improve clarity

export interface HowItWorksStep {
  step: number;
  description: string;
}

export const howAishiWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    description: 'Share a dream or chat → analysis on 0G Compute.'
  },
  {
    step: 2,
    description: 'You decide what to remember → encrypted write to 0G Storage.'
  },
  {
    step: 3,
    description: 'Backend auto-consolidates with month-learn and memory-core → compact long-term memory that most agents can\'t afford to keep.'
  },
  {
    step: 4,
    description: 'Over time Aishi spots hidden patterns and recommends next steps; milestones and INT rewards track progress.'
  }
];

export const techDetails = {
  command: '$ aishi --info',
  sections: [
    {
      title: '# Agent Architecture',
      items: [
        '• Single agent per wallet',
        '• Unique name registration',
        '• Mint fee: 0.1 0G'
      ]
    },
    {
      title: '# Memory Hierarchy',
      items: [
        '• Daily hashes → Monthly files → Yearly core',
        '• Auto consolidation by backend service',
        '• On-chain events for audit trail'
      ]
    },
    {
      title: '# Growth Mechanics',
      items: [
        '• Streaks: consecutive consolidations',
        '• Rewards: intelligence points (+ early-bird bonus)',
        '• Milestones: unlocks at levels & streaks'
      ]
    }
  ]
};