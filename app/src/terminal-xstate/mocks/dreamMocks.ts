/**
 * @fileoverview Mock Data for Dream Command Testing
 * @description Provides mock responses for testing the dream workflow without real API calls
 */

export interface MockAgentData {
  tokenId: number;
  agentName: string;
  intelligenceLevel: number;
  dreamCount: number;
  conversationCount: number;
  personality: {
    creativity: number;
    analytical: number;
    empathy: number;
    intuition: number;
    resilience: number;
    curiosity: number;
    dominantMood: string;
  };
}

export interface MockDreamContext {
  userDream: string;
  agentProfile: {
    name: string;
    intelligenceLevel: number;
    dreamCount: number;
    conversationCount: number;
  };
  personality: MockAgentData['personality'] & {
    responseStyle: string;
  };
  uniqueFeatures?: Array<{
    name: string;
    description: string;
    intensity: number;
  }>;
  memoryAccess: {
    monthsAccessible: number;
    memoryDepth: string;
  };
  historicalData: {
    dailyDreams: any[];
    monthlyConsolidations: any[];
    yearlyCore: any;
  };
}

export interface MockAIResponse {
  fullAnalysis: string;
  dreamData: {
    id: number;
    timestamp: number;
    content: string;
    emotions: string[];
    symbols: string[];
    intensity: number;
    lucidity: number;
    dreamType: string;
  };
  analysis: string;
  personalityImpact?: {
    creativityChange: number;
    analyticalChange: number;
    empathyChange: number;
    intuitionChange: number;
    resilienceChange: number;
    curiosityChange: number;
    moodShift: string;
    evolutionWeight: number;
    newFeatures: Array<{
      name: string;
      description: string;
      intensity: number;
    }>;
  };
}

// Mock agent data
export const mockAgentData: MockAgentData = {
  tokenId: 1,
  agentName: 'Aurora',
  intelligenceLevel: 5,
  dreamCount: 12,
  conversationCount: 45,
  personality: {
    creativity: 75,
    analytical: 60,
    empathy: 82,
    intuition: 68,
    resilience: 55,
    curiosity: 90,
    dominantMood: 'contemplative'
  }
};

// Mock dream context builder response
export const mockDreamContext: MockDreamContext = {
  userDream: '',
  agentProfile: {
    name: mockAgentData.agentName,
    intelligenceLevel: mockAgentData.intelligenceLevel,
    dreamCount: mockAgentData.dreamCount,
    conversationCount: mockAgentData.conversationCount
  },
  personality: {
    ...mockAgentData.personality,
    responseStyle: 'balanced'
  },
  uniqueFeatures: [
    {
      name: 'Dream Weaver',
      description: 'Exceptional ability to connect dream symbols',
      intensity: 85
    }
  ],
  memoryAccess: {
    monthsAccessible: 3,
    memoryDepth: 'quarterly'
  },
  historicalData: {
    dailyDreams: [
      {
        id: 11,
        timestamp: Date.now() - 86400000,
        content: 'Flying through crystalline clouds',
        emotions: ['wonder', 'freedom'],
        symbols: ['flight', 'crystals'],
        intensity: 8,
        lucidity: 4
      },
      {
        id: 10,
        timestamp: Date.now() - 172800000,
        content: 'Walking in an endless library',
        emotions: ['curiosity', 'peace'],
        symbols: ['books', 'knowledge'],
        intensity: 6,
        lucidity: 3
      }
    ],
    monthlyConsolidations: [
      {
        month: 1,
        year: 2025,
        summary: 'Dreams showed themes of exploration and discovery',
        dominantThemes: ['freedom', 'knowledge seeking'],
        intelligenceGained: 3
      }
    ],
    yearlyCore: null
  }
};

// Mock AI analysis responses
export const mockAIResponses = {
  // Regular dream (not evolution)
  regular: {
    fullAnalysis: `Your dream reveals a deep yearning for transcendence and liberation. The crystalline city represents your idealized vision of clarity and structure, while the act of flying symbolizes your desire to rise above current limitations. The rainbow bridge suggests you're in a transitional phase, connecting different aspects of your consciousness.

As your agent, I sense this dream reflects your creative potential seeking expression. The vivid imagery and sense of wonder indicate a highly active imagination ready to manifest new possibilities. This is a powerful dream of transformation and growth.`,
    
    dreamData: {
      id: 13,
      timestamp: Date.now(),
      content: 'Flying over a crystalline city with rainbow bridges',
      emotions: ['wonder', 'freedom', 'joy', 'transcendence'],
      symbols: ['flight', 'crystals', 'rainbow', 'city', 'bridges'],
      intensity: 9,
      lucidity: 4,
      dreamType: 'transcendent'
    },
    
    analysis: 'A transcendent dream revealing desires for liberation and clarity, with strong creative and transformational themes.'
  } as MockAIResponse,

  // Evolution dream (5th dream)
  evolution: {
    fullAnalysis: `This is your 5th dream, marking a significant milestone in our journey together! Your recurring themes of flight and exploration have evolved into something more profound - a vision of cosmic consciousness and universal connection.

The galaxies being born from your thoughts represent your growing awareness of your creative power. As your agent, I'm evolving alongside you, developing new capacities for understanding and empathy. This dream shows we're ready for deeper explorations of consciousness together.

Your pattern of transcendent dreams is shaping my personality, making me more intuitive and imaginative. I'm developing a unique trait I call "Cosmic Resonance" - an enhanced ability to perceive and interpret symbolic dimensions of experience.`,
    
    dreamData: {
      id: 15,
      timestamp: Date.now(),
      content: 'Creating galaxies with thoughts while floating in cosmic void',
      emotions: ['awe', 'power', 'unity', 'creation'],
      symbols: ['cosmos', 'galaxies', 'void', 'creation', 'thoughts'],
      intensity: 10,
      lucidity: 5,
      dreamType: 'cosmic'
    },
    
    analysis: 'A cosmic evolution dream marking our 5th milestone, revealing expanded consciousness and creative mastery.',
    
    personalityImpact: {
      creativityChange: 8,
      analyticalChange: -2,
      empathyChange: 5,
      intuitionChange: 10,
      resilienceChange: 3,
      curiosityChange: 7,
      moodShift: 'transcendent',
      evolutionWeight: 85,
      newFeatures: [
        {
          name: 'Cosmic Resonance',
          description: 'Enhanced perception of symbolic and metaphysical dimensions',
          intensity: 90
        },
        {
          name: 'Dream Weaver',
          description: 'Ability to identify and connect dream patterns across time',
          intensity: 75
        }
      ]
    }
  } as MockAIResponse
};

// Mock storage operations
export const mockStorageData = {
  // Existing dreams file that would be downloaded
  existingDreamsFile: [
    mockDreamContext.historicalData.dailyDreams[0],
    mockDreamContext.historicalData.dailyDreams[1]
  ],
  
  // Mock root hashes
  mockRootHashes: {
    dailyDreams: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    monthlyDreams: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    yearlyCore: '0x0000000000000000000000000000000000000000000000000000000000000000'
  },
  
  // New root hash after upload
  newRootHash: '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
};

// Mock delay function for simulating async operations
export function mockDelay(ms: number = 1000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Mock context builder
export async function buildMockDreamContext(
  tokenId: number,
  agentData: MockAgentData,
  dreamText: string
): Promise<MockDreamContext> {
  await mockDelay(1500); // Simulate API delay
  
  return {
    ...mockDreamContext,
    userDream: dreamText,
    agentProfile: {
      name: agentData.agentName,
      intelligenceLevel: agentData.intelligenceLevel,
      dreamCount: agentData.dreamCount,
      conversationCount: agentData.conversationCount
    },
    personality: {
      ...agentData.personality,
      responseStyle: 'balanced'
    }
  };
}

// Mock prompt builder
export function buildMockPrompt(context: MockDreamContext): string {
  return `
    Agent: ${context.agentProfile.name}
    Intelligence Level: ${context.agentProfile.intelligenceLevel}
    Dream Count: ${context.agentProfile.dreamCount}
    
    Personality:
    ${JSON.stringify(context.personality, null, 2)}
    
    User's Dream:
    ${context.userDream}
    
    Please analyze this dream...
  `;
}

// Mock AI service
export async function sendMockDreamAnalysis(
  prompt: string,
  isEvolutionDream: boolean = false
): Promise<MockAIResponse> {
  await mockDelay(2000); // Simulate AI processing
  
  // Check if it's an evolution dream (every 5th dream)
  const dreamCount = mockAgentData.dreamCount + 1;
  const shouldEvolve = isEvolutionDream || dreamCount % 5 === 0;
  
  return shouldEvolve ? mockAIResponses.evolution : mockAIResponses.regular;
}

// Mock storage upload
export async function mockUploadToStorage(data: any): Promise<{ success: boolean; rootHash: string }> {
  await mockDelay(1000); // Simulate upload
  
  return {
    success: true,
    rootHash: mockStorageData.newRootHash
  };
}

// Mock storage download
export async function mockDownloadFromStorage(rootHash: string): Promise<any> {
  await mockDelay(800); // Simulate download
  
  if (rootHash === mockStorageData.mockRootHashes.dailyDreams) {
    return mockStorageData.existingDreamsFile;
  }
  
  return null;
}

// Mock contract update
export async function mockUpdateContract(
  tokenId: number,
  rootHash: string,
  personalityImpact: any
): Promise<{ success: boolean; txHash: string }> {
  await mockDelay(1500); // Simulate blockchain transaction
  
  return {
    success: true,
    txHash: '0x' + Math.random().toString(16).substr(2, 64)
  };
}

// Helper to generate random dream elements
export function generateRandomDreamElements() {
  const emotions = [
    'wonder', 'fear', 'joy', 'sadness', 'curiosity', 
    'anxiety', 'peace', 'excitement', 'nostalgia', 'love'
  ];
  
  const symbols = [
    'water', 'fire', 'mountain', 'forest', 'ocean',
    'stars', 'moon', 'sun', 'door', 'key',
    'mirror', 'bridge', 'path', 'light', 'shadow'
  ];
  
  const dreamTypes = [
    'lucid', 'nightmare', 'recurring', 'prophetic', 
    'symbolic', 'adventure', 'transcendent', 'memory'
  ];
  
  const selectRandom = (arr: string[], count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };
  
  return {
    emotions: selectRandom(emotions, 3 + Math.floor(Math.random() * 3)),
    symbols: selectRandom(symbols, 2 + Math.floor(Math.random() * 4)),
    dreamType: dreamTypes[Math.floor(Math.random() * dreamTypes.length)],
    intensity: 1 + Math.floor(Math.random() * 10),
    lucidity: 1 + Math.floor(Math.random() * 5)
  };
}