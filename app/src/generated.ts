import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AishiAgent
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**

*/
export const aishiAgentAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_verifier', internalType: 'address', type: 'address' },
      { name: '_treasury', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'error', inputs: [], name: 'AccessControlBadConfirmation' },
  {
    type: 'error',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'neededRole', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'AccessControlUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'EnforcedPause' },
  { type: 'error', inputs: [], name: 'ExpectedPause' },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'conversationHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'contextType',
        internalType: 'enum IPersonalityEvolution.ContextType',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'conversationCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AgentConversation',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'oldLevel',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'newLevel',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'AgentEvolved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_user',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'AuthorizedUsage',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_newTokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_from',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      { name: '_to', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'Cloned',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'period',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'bonus',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'specialReward',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ConsolidationCompleted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'dreamHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'intelligenceLevel',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'DreamProcessed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'payer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'FeePaid',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'achievement',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'totalInteractions',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'MemoryMilestone',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'memoryType',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'newHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'oldHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'MemoryUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'milestone',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      { name: 'value', internalType: 'uint8', type: 'uint8', indexed: false },
    ],
    name: 'MilestoneUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_creator',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: '_dataHashes',
        internalType: 'bytes32[]',
        type: 'bytes32[]',
        indexed: false,
      },
      {
        name: '_dataDescriptions',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
    ],
    name: 'Minted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Paused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'traits',
        internalType: 'struct IPersonalityEvolution.PersonalityTraits',
        type: 'tuple',
        components: [
          { name: 'creativity', internalType: 'uint8', type: 'uint8' },
          { name: 'analytical', internalType: 'uint8', type: 'uint8' },
          { name: 'empathy', internalType: 'uint8', type: 'uint8' },
          { name: 'intuition', internalType: 'uint8', type: 'uint8' },
          { name: 'resilience', internalType: 'uint8', type: 'uint8' },
          { name: 'curiosity', internalType: 'uint8', type: 'uint8' },
          { name: 'dominantMood', internalType: 'string', type: 'string' },
          { name: 'lastDreamDate', internalType: 'uint256', type: 'uint256' },
          {
            name: 'uniqueFeatures',
            internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
            type: 'tuple[]',
            components: [
              { name: 'name', internalType: 'string', type: 'string' },
              { name: 'description', internalType: 'string', type: 'string' },
              { name: 'intensity', internalType: 'uint8', type: 'uint8' },
              { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
        indexed: false,
      },
      {
        name: 'dreamCount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'PersonalityActivated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'dreamHash',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newPersonality',
        internalType: 'struct IPersonalityEvolution.PersonalityTraits',
        type: 'tuple',
        components: [
          { name: 'creativity', internalType: 'uint8', type: 'uint8' },
          { name: 'analytical', internalType: 'uint8', type: 'uint8' },
          { name: 'empathy', internalType: 'uint8', type: 'uint8' },
          { name: 'intuition', internalType: 'uint8', type: 'uint8' },
          { name: 'resilience', internalType: 'uint8', type: 'uint8' },
          { name: 'curiosity', internalType: 'uint8', type: 'uint8' },
          { name: 'dominantMood', internalType: 'string', type: 'string' },
          { name: 'lastDreamDate', internalType: 'uint256', type: 'uint256' },
          {
            name: 'uniqueFeatures',
            internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
            type: 'tuple[]',
            components: [
              { name: 'name', internalType: 'string', type: 'string' },
              { name: 'description', internalType: 'string', type: 'string' },
              { name: 'intensity', internalType: 'uint8', type: 'uint8' },
              { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
        indexed: false,
      },
      {
        name: 'impact',
        internalType: 'struct IPersonalityEvolution.PersonalityImpact',
        type: 'tuple',
        components: [
          { name: 'creativityChange', internalType: 'int8', type: 'int8' },
          { name: 'analyticalChange', internalType: 'int8', type: 'int8' },
          { name: 'empathyChange', internalType: 'int8', type: 'int8' },
          { name: 'intuitionChange', internalType: 'int8', type: 'int8' },
          { name: 'resilienceChange', internalType: 'int8', type: 'int8' },
          { name: 'curiosityChange', internalType: 'int8', type: 'int8' },
          { name: 'moodShift', internalType: 'string', type: 'string' },
          { name: 'evolutionWeight', internalType: 'uint8', type: 'uint8' },
          {
            name: 'newFeatures',
            internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
            type: 'tuple[]',
            components: [
              { name: 'name', internalType: 'string', type: 'string' },
              { name: 'description', internalType: 'string', type: 'string' },
              { name: 'intensity', internalType: 'uint8', type: 'uint8' },
              { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
        indexed: false,
      },
    ],
    name: 'PersonalityEvolved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'milestone',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'traitValue',
        internalType: 'uint8',
        type: 'uint8',
        indexed: false,
      },
      {
        name: 'traitName',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'PersonalityMilestone',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: '_to', internalType: 'address', type: 'address', indexed: true },
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: '_sealedKeys',
        internalType: 'bytes16[]',
        type: 'bytes16[]',
        indexed: false,
      },
    ],
    name: 'PublishedSealedKey',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'newStyle',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'dominantTraits',
        internalType: 'string[]',
        type: 'string[]',
        indexed: false,
      },
    ],
    name: 'ResponseStyleEvolved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'oldStyle',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
      {
        name: 'newStyle',
        internalType: 'string',
        type: 'string',
        indexed: false,
      },
    ],
    name: 'ResponseStyleUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'previousAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
      {
        name: 'newAdminRole',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: true,
      },
    ],
    name: 'RoleAdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleGranted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32', indexed: true },
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
    name: 'RoleRevoked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: '_tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: '_from',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      { name: '_to', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'Transferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      {
        name: 'newFeatures',
        internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
        type: 'tuple[]',
        components: [
          { name: 'name', internalType: 'string', type: 'string' },
          { name: 'description', internalType: 'string', type: 'string' },
          { name: 'intensity', internalType: 'uint8', type: 'uint8' },
          { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      {
        name: 'totalFeatures',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'UniqueFeaturesAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'Unpaused',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenId',
        internalType: 'uint256',
        type: 'uint256',
        indexed: true,
      },
      { name: 'year', internalType: 'uint16', type: 'uint16', indexed: false },
    ],
    name: 'YearlyReflectionAvailable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'DEFAULT_ADMIN_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MAX_SUPPLY',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'MINTING_FEE',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PAUSER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PRICE_STEP',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'PRICE_STEP_INTERVAL',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'VERIFIER_ROLE',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'agentMemories',
    outputs: [
      { name: 'memoryCoreHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'currentDreamDailyHash',
        internalType: 'bytes32',
        type: 'bytes32',
      },
      {
        name: 'currentConvDailyHash',
        internalType: 'bytes32',
        type: 'bytes32',
      },
      {
        name: 'lastDreamMonthlyHash',
        internalType: 'bytes32',
        type: 'bytes32',
      },
      { name: 'lastConvMonthlyHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'lastConsolidation', internalType: 'uint256', type: 'uint256' },
      { name: 'currentMonth', internalType: 'uint8', type: 'uint8' },
      { name: 'currentYear', internalType: 'uint16', type: 'uint16' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'agentPersonalities',
    outputs: [
      { name: 'creativity', internalType: 'uint8', type: 'uint8' },
      { name: 'analytical', internalType: 'uint8', type: 'uint8' },
      { name: 'empathy', internalType: 'uint8', type: 'uint8' },
      { name: 'intuition', internalType: 'uint8', type: 'uint8' },
      { name: 'resilience', internalType: 'uint8', type: 'uint8' },
      { name: 'curiosity', internalType: 'uint8', type: 'uint8' },
      { name: 'dominantMood', internalType: 'string', type: 'string' },
      { name: 'lastDreamDate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'agents',
    outputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'agentName', internalType: 'string', type: 'string' },
      { name: 'createdAt', internalType: 'uint256', type: 'uint256' },
      { name: 'lastUpdated', internalType: 'uint256', type: 'uint256' },
      { name: 'intelligenceLevel', internalType: 'uint256', type: 'uint256' },
      { name: 'dreamCount', internalType: 'uint256', type: 'uint256' },
      { name: 'conversationCount', internalType: 'uint256', type: 'uint256' },
      { name: 'personalityInitialized', internalType: 'bool', type: 'bool' },
      { name: 'totalEvolutions', internalType: 'uint256', type: 'uint256' },
      { name: 'lastEvolutionDate', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'authorizeUsage',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'authorizedUsersOf',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'canProcessDreamToday',
    outputs: [{ name: 'canProcess', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'dreamMonthlyHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'convMonthlyHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'month', internalType: 'uint8', type: 'uint8' },
      { name: 'year', internalType: 'uint16', type: 'uint16' },
    ],
    name: 'consolidateMonth',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'consolidationStreak',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'currentMintPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'user', internalType: 'address', type: 'address' },
    ],
    name: 'emergencyAuthorizeUser',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'to', internalType: 'address', type: 'address' },
    ],
    name: 'emergencyTransfer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getAgentMemory',
    outputs: [
      {
        name: '',
        internalType: 'struct IPersonalityEvolution.AgentMemory',
        type: 'tuple',
        components: [
          { name: 'memoryCoreHash', internalType: 'bytes32', type: 'bytes32' },
          {
            name: 'currentDreamDailyHash',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'currentConvDailyHash',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'lastDreamMonthlyHash',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'lastConvMonthlyHash',
            internalType: 'bytes32',
            type: 'bytes32',
          },
          {
            name: 'lastConsolidation',
            internalType: 'uint256',
            type: 'uint256',
          },
          { name: 'currentMonth', internalType: 'uint8', type: 'uint8' },
          { name: 'currentYear', internalType: 'uint16', type: 'uint16' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getConsolidationReward',
    outputs: [
      { name: 'baseReward', internalType: 'uint256', type: 'uint256' },
      { name: 'streakBonus', internalType: 'uint256', type: 'uint256' },
      { name: 'earlyBirdBonus', internalType: 'uint256', type: 'uint256' },
      { name: 'totalReward', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getEvolutionStats',
    outputs: [
      { name: 'totalEvolutions', internalType: 'uint256', type: 'uint256' },
      { name: 'evolutionRate', internalType: 'uint256', type: 'uint256' },
      { name: 'lastEvolution', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getMemoryAccess',
    outputs: [
      { name: 'monthsAccessible', internalType: 'uint256', type: 'uint256' },
      { name: 'memoryDepth', internalType: 'string', type: 'string' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getPersonalityTraits',
    outputs: [
      {
        name: '',
        internalType: 'struct IPersonalityEvolution.PersonalityTraits',
        type: 'tuple',
        components: [
          { name: 'creativity', internalType: 'uint8', type: 'uint8' },
          { name: 'analytical', internalType: 'uint8', type: 'uint8' },
          { name: 'empathy', internalType: 'uint8', type: 'uint8' },
          { name: 'intuition', internalType: 'uint8', type: 'uint8' },
          { name: 'resilience', internalType: 'uint8', type: 'uint8' },
          { name: 'curiosity', internalType: 'uint8', type: 'uint8' },
          { name: 'dominantMood', internalType: 'string', type: 'string' },
          { name: 'lastDreamDate', internalType: 'uint256', type: 'uint256' },
          {
            name: 'uniqueFeatures',
            internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
            type: 'tuple[]',
            components: [
              { name: 'name', internalType: 'string', type: 'string' },
              { name: 'description', internalType: 'string', type: 'string' },
              { name: 'intensity', internalType: 'uint8', type: 'uint8' },
              { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'role', internalType: 'bytes32', type: 'bytes32' }],
    name: 'getRoleAdmin',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'getUniqueFeatures',
    outputs: [
      {
        name: 'features',
        internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
        type: 'tuple[]',
        components: [
          { name: 'name', internalType: 'string', type: 'string' },
          { name: 'description', internalType: 'string', type: 'string' },
          { name: 'intensity', internalType: 'uint8', type: 'uint8' },
          { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'grantRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'milestoneName', internalType: 'string', type: 'string' },
    ],
    name: 'hasMilestone',
    outputs: [
      { name: 'achieved', internalType: 'bool', type: 'bool' },
      { name: 'at', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'hasRole',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint256', type: 'uint256' },
      { name: '', internalType: 'string', type: 'string' },
    ],
    name: 'milestones',
    outputs: [
      { name: 'achieved', internalType: 'bool', type: 'bool' },
      { name: 'achievedAt', internalType: 'uint256', type: 'uint256' },
      { name: 'traitValue', internalType: 'uint8', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'proofs', internalType: 'bytes[]', type: 'bytes[]' },
      { name: 'descriptions', internalType: 'string[]', type: 'string[]' },
      { name: 'agentName', internalType: 'string', type: 'string' },
      { name: 'to', internalType: 'address', type: 'address' },
    ],
    name: 'mintAgent',
    outputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'string', type: 'string' }],
    name: 'nameExists',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'nextTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'tokenId', internalType: 'uint256', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'ownerToTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'pendingRewards',
    outputs: [
      { name: 'intelligenceBonus', internalType: 'uint256', type: 'uint256' },
      { name: 'specialMilestone', internalType: 'string', type: 'string' },
      { name: 'yearlyReflection', internalType: 'bool', type: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'pricingInfo',
    outputs: [
      { name: 'base', internalType: 'uint256', type: 'uint256' },
      { name: 'step', internalType: 'uint256', type: 'uint256' },
      { name: 'interval', internalType: 'uint256', type: 'uint256' },
      { name: 'currentTier', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'dreamHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'impact',
        internalType: 'struct IPersonalityEvolution.PersonalityImpact',
        type: 'tuple',
        components: [
          { name: 'creativityChange', internalType: 'int8', type: 'int8' },
          { name: 'analyticalChange', internalType: 'int8', type: 'int8' },
          { name: 'empathyChange', internalType: 'int8', type: 'int8' },
          { name: 'intuitionChange', internalType: 'int8', type: 'int8' },
          { name: 'resilienceChange', internalType: 'int8', type: 'int8' },
          { name: 'curiosityChange', internalType: 'int8', type: 'int8' },
          { name: 'moodShift', internalType: 'string', type: 'string' },
          { name: 'evolutionWeight', internalType: 'uint8', type: 'uint8' },
          {
            name: 'newFeatures',
            internalType: 'struct IPersonalityEvolution.UniqueFeature[]',
            type: 'tuple[]',
            components: [
              { name: 'name', internalType: 'string', type: 'string' },
              { name: 'description', internalType: 'string', type: 'string' },
              { name: 'intensity', internalType: 'uint8', type: 'uint8' },
              { name: 'addedAt', internalType: 'uint256', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    name: 'processDailyDream',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'conversationHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'contextType',
        internalType: 'enum IPersonalityEvolution.ContextType',
        type: 'uint8',
      },
    ],
    name: 'recordConversation',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'callerConfirmation', internalType: 'address', type: 'address' },
    ],
    name: 'renounceRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'responseStyles',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'role', internalType: 'bytes32', type: 'bytes32' },
      { name: 'account', internalType: 'address', type: 'address' },
    ],
    name: 'revokeRole',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'id', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalAgents',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalFeesCollected',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'proofs', internalType: 'bytes[]', type: 'bytes[]' },
    ],
    name: 'transfer',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'unpause',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenId', internalType: 'uint256', type: 'uint256' },
      { name: 'newHash', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'updateMemoryCore',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [
      {
        name: '',
        internalType: 'contract IERC7857DataVerifier',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
] as const

/**

*/
export const aishiAgentAddress = {
  16602: '0x6Ea891A7223459aCC46030aae203DCC218a388C6',
  16661: '0x67aC6AE80039AbB81F155313cB2002124Ac77A28',
} as const

/**

*/
export const aishiAgentConfig = {
  address: aishiAgentAddress,
  abi: aishiAgentAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// AishiVerifier
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**

*/
export const aishiVerifierAbi = [
  {
    type: 'function',
    inputs: [{ name: 'proofs', internalType: 'bytes[]', type: 'bytes[]' }],
    name: 'verifyPreimage',
    outputs: [
      {
        name: 'outputs',
        internalType: 'struct PreimageProofOutput[]',
        type: 'tuple[]',
        components: [
          { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'isValid', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'proofs', internalType: 'bytes[]', type: 'bytes[]' }],
    name: 'verifyTransferValidity',
    outputs: [
      {
        name: 'outputs',
        internalType: 'struct TransferValidityProofOutput[]',
        type: 'tuple[]',
        components: [
          { name: 'oldDataHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'newDataHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'pubKey', internalType: 'bytes', type: 'bytes' },
          { name: 'sealedKey', internalType: 'bytes16', type: 'bytes16' },
          { name: 'isValid', internalType: 'bool', type: 'bool' },
        ],
      },
    ],
    stateMutability: 'pure',
  },
] as const

/**

*/
export const aishiVerifierAddress = {
  16602: '0x978a566B8817f14fEAaA783177E41e2d6dCA000C',
  16661: '0xD36e1AdFB81D8231fB2be005C2b0AeBFA8C892B9',
} as const

/**

*/
export const aishiVerifierConfig = {
  address: aishiVerifierAddress,
  abi: aishiVerifierAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__
 */
export const useReadAishiAgent = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"ADMIN_ROLE"`
 */
export const useReadAishiAgentAdminRole = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'ADMIN_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"DEFAULT_ADMIN_ROLE"`
 */
export const useReadAishiAgentDefaultAdminRole =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'DEFAULT_ADMIN_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"MAX_SUPPLY"`
 */
export const useReadAishiAgentMaxSupply = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'MAX_SUPPLY',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"MINTING_FEE"`
 */
export const useReadAishiAgentMintingFee = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'MINTING_FEE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"PAUSER_ROLE"`
 */
export const useReadAishiAgentPauserRole = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'PAUSER_ROLE',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"PRICE_STEP"`
 */
export const useReadAishiAgentPriceStep = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'PRICE_STEP',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"PRICE_STEP_INTERVAL"`
 */
export const useReadAishiAgentPriceStepInterval =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'PRICE_STEP_INTERVAL',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"VERIFIER_ROLE"`
 */
export const useReadAishiAgentVerifierRole =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'VERIFIER_ROLE',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"agentMemories"`
 */
export const useReadAishiAgentAgentMemories =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'agentMemories',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"agentPersonalities"`
 */
export const useReadAishiAgentAgentPersonalities =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'agentPersonalities',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"agents"`
 */
export const useReadAishiAgentAgents = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'agents',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"authorizedUsersOf"`
 */
export const useReadAishiAgentAuthorizedUsersOf =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'authorizedUsersOf',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadAishiAgentBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"canProcessDreamToday"`
 */
export const useReadAishiAgentCanProcessDreamToday =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'canProcessDreamToday',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"consolidationStreak"`
 */
export const useReadAishiAgentConsolidationStreak =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'consolidationStreak',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"currentMintPrice"`
 */
export const useReadAishiAgentCurrentMintPrice =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'currentMintPrice',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getAgentMemory"`
 */
export const useReadAishiAgentGetAgentMemory =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getAgentMemory',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getConsolidationReward"`
 */
export const useReadAishiAgentGetConsolidationReward =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getConsolidationReward',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getEvolutionStats"`
 */
export const useReadAishiAgentGetEvolutionStats =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getEvolutionStats',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getMemoryAccess"`
 */
export const useReadAishiAgentGetMemoryAccess =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getMemoryAccess',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getPersonalityTraits"`
 */
export const useReadAishiAgentGetPersonalityTraits =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getPersonalityTraits',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getRoleAdmin"`
 */
export const useReadAishiAgentGetRoleAdmin =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getRoleAdmin',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"getUniqueFeatures"`
 */
export const useReadAishiAgentGetUniqueFeatures =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'getUniqueFeatures',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"hasMilestone"`
 */
export const useReadAishiAgentHasMilestone =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'hasMilestone',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"hasRole"`
 */
export const useReadAishiAgentHasRole = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'hasRole',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"milestones"`
 */
export const useReadAishiAgentMilestones = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'milestones',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"name"`
 */
export const useReadAishiAgentName = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"nameExists"`
 */
export const useReadAishiAgentNameExists = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'nameExists',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"nextTokenId"`
 */
export const useReadAishiAgentNextTokenId = /*#__PURE__*/ createUseReadContract(
  {
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'nextTokenId',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"ownerOf"`
 */
export const useReadAishiAgentOwnerOf = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'ownerOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"ownerToTokenId"`
 */
export const useReadAishiAgentOwnerToTokenId =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'ownerToTokenId',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"paused"`
 */
export const useReadAishiAgentPaused = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'paused',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"pendingRewards"`
 */
export const useReadAishiAgentPendingRewards =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'pendingRewards',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"pricingInfo"`
 */
export const useReadAishiAgentPricingInfo = /*#__PURE__*/ createUseReadContract(
  {
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'pricingInfo',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"responseStyles"`
 */
export const useReadAishiAgentResponseStyles =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'responseStyles',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadAishiAgentSupportsInterface =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'supportsInterface',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadAishiAgentSymbol = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"totalAgents"`
 */
export const useReadAishiAgentTotalAgents = /*#__PURE__*/ createUseReadContract(
  {
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'totalAgents',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"totalFeesCollected"`
 */
export const useReadAishiAgentTotalFeesCollected =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'totalFeesCollected',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadAishiAgentTotalSupply = /*#__PURE__*/ createUseReadContract(
  {
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'totalSupply',
  },
)

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"treasury"`
 */
export const useReadAishiAgentTreasury = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'treasury',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"verifier"`
 */
export const useReadAishiAgentVerifier = /*#__PURE__*/ createUseReadContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'verifier',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__
 */
export const useWriteAishiAgent = /*#__PURE__*/ createUseWriteContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"authorizeUsage"`
 */
export const useWriteAishiAgentAuthorizeUsage =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'authorizeUsage',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"consolidateMonth"`
 */
export const useWriteAishiAgentConsolidateMonth =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'consolidateMonth',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"emergencyAuthorizeUser"`
 */
export const useWriteAishiAgentEmergencyAuthorizeUser =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'emergencyAuthorizeUser',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"emergencyTransfer"`
 */
export const useWriteAishiAgentEmergencyTransfer =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'emergencyTransfer',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"grantRole"`
 */
export const useWriteAishiAgentGrantRole = /*#__PURE__*/ createUseWriteContract(
  { abi: aishiAgentAbi, address: aishiAgentAddress, functionName: 'grantRole' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"mintAgent"`
 */
export const useWriteAishiAgentMintAgent = /*#__PURE__*/ createUseWriteContract(
  { abi: aishiAgentAbi, address: aishiAgentAddress, functionName: 'mintAgent' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"pause"`
 */
export const useWriteAishiAgentPause = /*#__PURE__*/ createUseWriteContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'pause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"processDailyDream"`
 */
export const useWriteAishiAgentProcessDailyDream =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'processDailyDream',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"recordConversation"`
 */
export const useWriteAishiAgentRecordConversation =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'recordConversation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useWriteAishiAgentRenounceRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useWriteAishiAgentRevokeRole =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteAishiAgentTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"unpause"`
 */
export const useWriteAishiAgentUnpause = /*#__PURE__*/ createUseWriteContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
  functionName: 'unpause',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"updateMemoryCore"`
 */
export const useWriteAishiAgentUpdateMemoryCore =
  /*#__PURE__*/ createUseWriteContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'updateMemoryCore',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__
 */
export const useSimulateAishiAgent = /*#__PURE__*/ createUseSimulateContract({
  abi: aishiAgentAbi,
  address: aishiAgentAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"authorizeUsage"`
 */
export const useSimulateAishiAgentAuthorizeUsage =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'authorizeUsage',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"consolidateMonth"`
 */
export const useSimulateAishiAgentConsolidateMonth =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'consolidateMonth',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"emergencyAuthorizeUser"`
 */
export const useSimulateAishiAgentEmergencyAuthorizeUser =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'emergencyAuthorizeUser',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"emergencyTransfer"`
 */
export const useSimulateAishiAgentEmergencyTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'emergencyTransfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"grantRole"`
 */
export const useSimulateAishiAgentGrantRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'grantRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"mintAgent"`
 */
export const useSimulateAishiAgentMintAgent =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'mintAgent',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"pause"`
 */
export const useSimulateAishiAgentPause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'pause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"processDailyDream"`
 */
export const useSimulateAishiAgentProcessDailyDream =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'processDailyDream',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"recordConversation"`
 */
export const useSimulateAishiAgentRecordConversation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'recordConversation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"renounceRole"`
 */
export const useSimulateAishiAgentRenounceRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'renounceRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"revokeRole"`
 */
export const useSimulateAishiAgentRevokeRole =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'revokeRole',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateAishiAgentTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"unpause"`
 */
export const useSimulateAishiAgentUnpause =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'unpause',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link aishiAgentAbi}__ and `functionName` set to `"updateMemoryCore"`
 */
export const useSimulateAishiAgentUpdateMemoryCore =
  /*#__PURE__*/ createUseSimulateContract({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    functionName: 'updateMemoryCore',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__
 */
export const useWatchAishiAgentEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"AgentConversation"`
 */
export const useWatchAishiAgentAgentConversationEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'AgentConversation',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"AgentEvolved"`
 */
export const useWatchAishiAgentAgentEvolvedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'AgentEvolved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"AuthorizedUsage"`
 */
export const useWatchAishiAgentAuthorizedUsageEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'AuthorizedUsage',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"Cloned"`
 */
export const useWatchAishiAgentClonedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'Cloned',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"ConsolidationCompleted"`
 */
export const useWatchAishiAgentConsolidationCompletedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'ConsolidationCompleted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"DreamProcessed"`
 */
export const useWatchAishiAgentDreamProcessedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'DreamProcessed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"FeePaid"`
 */
export const useWatchAishiAgentFeePaidEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'FeePaid',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"MemoryMilestone"`
 */
export const useWatchAishiAgentMemoryMilestoneEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'MemoryMilestone',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"MemoryUpdated"`
 */
export const useWatchAishiAgentMemoryUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'MemoryUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"MilestoneUnlocked"`
 */
export const useWatchAishiAgentMilestoneUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'MilestoneUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"Minted"`
 */
export const useWatchAishiAgentMintedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'Minted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"Paused"`
 */
export const useWatchAishiAgentPausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'Paused',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"PersonalityActivated"`
 */
export const useWatchAishiAgentPersonalityActivatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'PersonalityActivated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"PersonalityEvolved"`
 */
export const useWatchAishiAgentPersonalityEvolvedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'PersonalityEvolved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"PersonalityMilestone"`
 */
export const useWatchAishiAgentPersonalityMilestoneEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'PersonalityMilestone',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"PublishedSealedKey"`
 */
export const useWatchAishiAgentPublishedSealedKeyEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'PublishedSealedKey',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"ResponseStyleEvolved"`
 */
export const useWatchAishiAgentResponseStyleEvolvedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'ResponseStyleEvolved',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"ResponseStyleUpdated"`
 */
export const useWatchAishiAgentResponseStyleUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'ResponseStyleUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"RoleAdminChanged"`
 */
export const useWatchAishiAgentRoleAdminChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'RoleAdminChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"RoleGranted"`
 */
export const useWatchAishiAgentRoleGrantedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'RoleGranted',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"RoleRevoked"`
 */
export const useWatchAishiAgentRoleRevokedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'RoleRevoked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"Transferred"`
 */
export const useWatchAishiAgentTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'Transferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"UniqueFeaturesAdded"`
 */
export const useWatchAishiAgentUniqueFeaturesAddedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'UniqueFeaturesAdded',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"Unpaused"`
 */
export const useWatchAishiAgentUnpausedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'Unpaused',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link aishiAgentAbi}__ and `eventName` set to `"YearlyReflectionAvailable"`
 */
export const useWatchAishiAgentYearlyReflectionAvailableEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: aishiAgentAbi,
    address: aishiAgentAddress,
    eventName: 'YearlyReflectionAvailable',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiVerifierAbi}__
 */
export const useReadAishiVerifier = /*#__PURE__*/ createUseReadContract({
  abi: aishiVerifierAbi,
  address: aishiVerifierAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiVerifierAbi}__ and `functionName` set to `"verifyPreimage"`
 */
export const useReadAishiVerifierVerifyPreimage =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiVerifierAbi,
    address: aishiVerifierAddress,
    functionName: 'verifyPreimage',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link aishiVerifierAbi}__ and `functionName` set to `"verifyTransferValidity"`
 */
export const useReadAishiVerifierVerifyTransferValidity =
  /*#__PURE__*/ createUseReadContract({
    abi: aishiVerifierAbi,
    address: aishiVerifierAddress,
    functionName: 'verifyTransferValidity',
  })
