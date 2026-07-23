// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPersonalityEvolution - Interface for agent personality evolution
/// @notice Defines the personality evolution system for Dreamscape iNFTs
/// @dev Implements personality trait development based on dream analysis
interface IPersonalityEvolution {
    
    /// @notice Unique AI-generated feature from dreams
    /// @dev AI creates these features based on dream patterns
    struct UniqueFeature {
        string name;        // e.g., "Dream Architect", "Shadow Walker", "Time Dancer"
        string description; // e.g., "Builds impossible structures in dreams"
        uint8 intensity;    // 1-100: How strong this feature is
        uint256 addedAt;    // Timestamp when feature was added
    }
    
    /// @notice Core personality traits structure
    /// @dev All traits range from 0-100, dominantMood is current emotional state
    struct PersonalityTraits {
        uint8 creativity;      // 0-100: Innovation, imagination, artistic thinking
        uint8 analytical;      // 0-100: Logic, problem-solving, systematic thinking  
        uint8 empathy;         // 0-100: Emotional understanding, compassion, support
        uint8 intuition;       // 0-100: Gut feelings, spiritual insights, wisdom
        uint8 resilience;      // 0-100: Stress handling, recovery, perseverance
        uint8 curiosity;       // 0-100: Learning desire, exploration, questioning
        string dominantMood;   // Current emotional state: "peaceful", "anxious", "excited", etc.
        uint256 lastDreamDate; // Timestamp of last dream processing (prevents multiple per day)
        UniqueFeature[] uniqueFeatures; // AI-generated unique features from dreams
    }
    
    /// @notice Personality impact from dream analysis
    /// @dev Defines how a dream affects personality traits
    struct PersonalityImpact {
        int8 creativityChange;     // -10 to +10 change in creativity
        int8 analyticalChange;     // -10 to +10 change in analytical thinking
        int8 empathyChange;        // -10 to +10 change in empathy
        int8 intuitionChange;      // -10 to +10 change in intuition
        int8 resilienceChange;     // -10 to +10 change in resilience
        int8 curiosityChange;      // -10 to +10 change in curiosity
        string moodShift;          // New dominant mood
        uint8 evolutionWeight;     // 1-100: How much this dream affects personality
        UniqueFeature[] newFeatures; // AI-generated unique features to add (max 2)
    }
    
    /// @notice Conversation context type for memory management
    enum ContextType {
        DREAM_DISCUSSION,    // Discussing previous dreams
        GENERAL_CHAT,        // General conversation
        PERSONALITY_QUERY,   // Asking about personality/traits
        THERAPEUTIC,         // Therapeutic conversation
        ADVICE_SEEKING      // Seeking advice/guidance
    }
    
    /// @notice Three-tier memory system structure
    /// @dev Each layer stores a single hash pointing to encrypted storage
    struct AgentMemory {
        bytes32 memoryCoreHash;        // Yearly summaries & agent essence
        bytes32 currentDreamDailyHash; // Append-only during current month
        bytes32 currentConvDailyHash;  // Append-only during current month
        bytes32 lastDreamMonthlyHash;  // Finalised hash after consolidation
        bytes32 lastConvMonthlyHash;   // Finalised hash after consolidation
        uint256 lastConsolidation;     // timestamp when consolidateMonth() last ran
        uint8   currentMonth;          // 1-12   (initialised at mint)
        uint16  currentYear;           // 2024+  (initialised at mint)
    }
    
    // Events
    
    /// @dev Emitted when agent personality evolves from dream processing
    event PersonalityEvolved(
        uint256 indexed tokenId,
        bytes32 indexed dreamHash,
        PersonalityTraits newPersonality,
        PersonalityImpact impact
    );
    
    /// @dev Emitted when agent has a conversation (without personality evolution)
    event AgentConversation(
        uint256 indexed tokenId,
        bytes32 indexed conversationHash,
        ContextType contextType,
        uint256 conversationCount
    );
    
    /// @dev Emitted when agent reaches personality milestones
    event PersonalityMilestone(
        uint256 indexed tokenId,
        string milestone,
        uint8 traitValue,
        string traitName
    );
    
    /// @dev Emitted when agent's response style evolves
    event ResponseStyleEvolved(
        uint256 indexed tokenId,
        string newStyle,
        string[] dominantTraits
    );
    
    /// @dev Emitted when AI adds unique features to agent
    event UniqueFeaturesAdded(
        uint256 indexed tokenId,
        UniqueFeature[] newFeatures,
        uint256 totalFeatures
    );
    
    // Core Functions
    
    /// @notice Process daily dream and evolve agent personality
    /// @param tokenId Agent to evolve
    /// @param dreamHash 0G Storage hash of encrypted dream data
    /// @param impact Personality changes from dream analysis
    function processDailyDream(
        uint256 tokenId,
        bytes32 dreamHash,
        PersonalityImpact calldata impact
    ) external;
    
    /// @notice Record conversation without personality evolution
    /// @param tokenId Agent having conversation
    /// @param conversationHash 0G Storage hash of conversation data
    /// @param contextType Type of conversation for context building
    function recordConversation(
        uint256 tokenId,
        bytes32 conversationHash,
        ContextType contextType
    ) external;
    
    /// @notice Get agent's current personality traits
    /// @param tokenId Agent to query
    /// @return traits Current personality traits
    function getPersonalityTraits(uint256 tokenId) 
        external view returns (PersonalityTraits memory traits);
    
    /// @notice Get memory access level based on intelligence
    /// @param tokenId Agent to check
    /// @return monthsAccessible Number of months accessible 
    /// @return memoryDepth Human-readable description
    function getMemoryAccess(uint256 tokenId) external view returns (
        uint256 monthsAccessible,
        string memory memoryDepth
    );

    /// @notice Check if agent can process dream today (24h cooldown)
    /// @param tokenId Agent to check
    /// @return canProcess True if agent can process a dream today
    function canProcessDreamToday(uint256 tokenId) 
        external view returns (bool canProcess);


    /// @notice Get consolidation reward preview
    /// @param tokenId Agent to check
    /// @return baseReward Base intelligence reward
    /// @return streakBonus Bonus from consolidation streak
    /// @return earlyBirdBonus Bonus for early consolidation
    /// @return totalReward Total intelligence reward
    function getConsolidationReward(uint256 tokenId) external view returns (
        uint256 baseReward,
        uint256 streakBonus,
        uint256 earlyBirdBonus,
        uint256 totalReward
    );

    /// @notice Get agent's hierarchical memory structure
    /// @param tokenId Agent to query
    /// @return memory Current memory structure
    function getAgentMemory(uint256 tokenId) external view returns (AgentMemory memory);
    
    // Advanced Analytics
    
    /// @notice Get personality evolution statistics
    /// @param tokenId Agent to analyze
    /// @return totalEvolutions Number of personality changes
    /// @return evolutionRate Rate of personality change
    /// @return lastEvolution Timestamp of last evolution
    function getEvolutionStats(uint256 tokenId) 
        external view returns (
            uint256 totalEvolutions,
            uint256 evolutionRate,
            uint256 lastEvolution
        );
    

    
    /// @notice Check if agent has reached specific personality milestone
    /// @param tokenId Agent to check
    /// @param milestoneName Milestone to check ("empathy_master", "creative_genius", etc.)
    /// @return achieved True if milestone has been achieved
    /// @return achievedAt Timestamp when milestone was achieved (0 if not achieved)
    function hasMilestone(uint256 tokenId, string calldata milestoneName) 
        external view returns (bool achieved, uint256 achievedAt);
    
    /// @notice Get agent's unique AI-generated features
    /// @param tokenId Agent to query
    /// @return features Array of unique features
    function getUniqueFeatures(uint256 tokenId) 
        external view returns (UniqueFeature[] memory features);
    
    // Batch Operations
    

} 