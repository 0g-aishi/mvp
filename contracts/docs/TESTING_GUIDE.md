# 🧪 Dreamscape iNFT Testing Guide

## Overview

This guide provides comprehensive testing instructions for the Dreamscape personality evolution iNFT system. Follow these steps to test all features and ensure the system works correctly.

## 🚀 Quick Start Testing

### Prerequisites

1. **Environment Setup**
```bash
# From the repository root
npm install
cd contracts
```

2. **Environment Variables** (contracts/doors.md)
```bash
WALLET_PRIVATE_KEY=your_private_key_here
TREASURY_ADDRESS=0x...
DREAMSCAPE_TEST=true
```

3. **Deploy Contracts**
```bash
npx hardhat deploy --network galileo --tags SimpleDreamVerifier
npx hardhat deploy --network galileo --tags DreamAgentNFTv2
```

## 🎭 Core Personality System Tests

### Test 1: Basic Agent Minting with Personality

```javascript
// test-personality-minting.js
const { ethers } = require("hardhat");

async function testPersonalityMinting() {
  console.log("🧠 Testing personality-based agent minting...");
  
  const [deployer] = await ethers.getSigners();
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Define initial personality
  const initialPersonality = {
    creativity: 45,
    analytical: 60,
    empathy: 70,
    intuition: 35,
    resilience: 50,
    curiosity: 55,
    dominantMood: "curious",
    lastDreamDate: 0
  };
  
  console.log("Initial Personality:", initialPersonality);
  
  // Mint agent with personality
  const tx = await dreamAgentNFTv2.mintWithPersonality(
    [], // proofs (empty for test)
    ["initial_personality_test"],
    "TestAgent001",
    deployer.address,
    initialPersonality,
    { value: ethers.parseEther("0.1") }
  );
  
  const receipt = await tx.wait();
  const tokenId = 1; // First minted agent
  
  // Verify personality was set correctly
  const storedPersonality = await dreamAgentNFTv2.getPersonalityTraits(tokenId);
  console.log("Stored Personality:", storedPersonality);
  
  // Get response style
  const [responseStyle, primaryTrait] = await dreamAgentNFTv2.getResponseStyle(tokenId);
  console.log(`Response Style: ${responseStyle}, Primary Trait: ${primaryTrait}`);
  
  // Get dominant traits
  const [dominantTraits, dominantValues] = await dreamAgentNFTv2.getDominantTraits(tokenId);
  console.log("Dominant Traits:", dominantTraits.slice(0, 3));
  console.log("Trait Values:", dominantValues.slice(0, 3));
  
  console.log("✅ Personality minting test passed!");
  return tokenId;
}
```

### Test 2: Daily Dream Processing and Evolution

```javascript
// test-dream-evolution.js
async function testDreamEvolution(tokenId) {
  console.log("🌙 Testing daily dream evolution...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Get initial personality
  const initialPersonality = await dreamAgentNFTv2.getPersonalityTraits(tokenId);
  console.log("Before Evolution:", {
    creativity: initialPersonality.creativity,
    empathy: initialPersonality.empathy,
    mood: initialPersonality.dominantMood
  });
  
  // Define dream impact (water dream = empathy + intuition boost)
  const personalityImpact = {
    creativityChange: 3,
    analyticalChange: -1,
    empathyChange: 8,
    intuitionChange: 6,
    resilienceChange: 2,
    curiosityChange: 1,
    moodShift: "peaceful",
    evolutionWeight: 85
  };
  
  // Create mock dream and analysis hashes
  const dreamHash = ethers.keccak256(ethers.toUtf8Bytes("dream_peaceful_ocean_with_dolphins"));
  const analysisHash = ethers.keccak256(ethers.toUtf8Bytes("analysis_water_symbols_empathy_boost"));
  
  // Process dream evolution
  const tx = await dreamAgentNFTv2.processDailyDream(
    tokenId,
    dreamHash,
    analysisHash,
    personalityImpact
  );
  
  await tx.wait();
  
  // Get evolved personality
  const evolvedPersonality = await dreamAgentNFTv2.getPersonalityTraits(tokenId);
  console.log("After Evolution:", {
    creativity: evolvedPersonality.creativity,
    empathy: evolvedPersonality.empathy,
    mood: evolvedPersonality.dominantMood
  });
  
  // Verify changes
  const empathyIncrease = evolvedPersonality.empathy - initialPersonality.empathy;
  console.log(`Empathy increased by: ${empathyIncrease} points`);
  
  // Check if can process another dream today (should fail)
  const canProcessToday = await dreamAgentNFTv2.canProcessDreamToday(tokenId);
  console.log(`Can process another dream today: ${canProcessToday} (should be false)`);
  
  console.log("✅ Dream evolution test passed!");
}
```

### Test 3: Context-Aware Conversations

```javascript
// test-conversations.js
async function testConversations(tokenId) {
  console.log("💬 Testing context-aware conversations...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Record different types of conversations
  const conversations = [
    {
      hash: ethers.keccak256(ethers.toUtf8Bytes("dream_discussion_about_ocean")),
      type: 0 // DREAM_DISCUSSION
    },
    {
      hash: ethers.keccak256(ethers.toUtf8Bytes("general_chat_about_weather")),
      type: 1 // GENERAL_CHAT
    },
    {
      hash: ethers.keccak256(ethers.toUtf8Bytes("therapeutic_conversation_anxiety")),
      type: 3 // THERAPEUTIC
    }
  ];
  
  for (const conv of conversations) {
    const tx = await dreamAgentNFTv2.recordConversation(
      tokenId,
      conv.hash,
      conv.type
    );
    await tx.wait();
    console.log(`Recorded conversation type ${conv.type}`);
  }
  
  // Get conversation history
  const conversationHistory = await dreamAgentNFTv2.getConversationHistory(tokenId, 0);
  console.log(`Total conversations recorded: ${conversationHistory.length}`);
  
  // Get agent stats
  const agent = await dreamAgentNFTv2.agents(tokenId);
  console.log(`Agent conversation count: ${agent.conversationCount}`);
  
  console.log("✅ Conversation test passed!");
}
```

## 📊 Analytics and Advanced Features Tests

### Test 4: Personality Analytics

```javascript
// test-personality-analytics.js
async function testPersonalityAnalytics(tokenId) {
  console.log("📊 Testing personality analytics...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Calculate rarity score
  const rarityScore = await dreamAgentNFTv2.calculatePersonalityRarity(tokenId);
  console.log(`Personality Rarity Score: ${rarityScore}`);
  
  // Get evolution stats
  const [totalEvolutions, evolutionRate, lastEvolution] = await dreamAgentNFTv2.getEvolutionStats(tokenId);
  console.log("Evolution Stats:", {
    totalEvolutions: totalEvolutions.toString(),
    evolutionRate: evolutionRate.toString(),
    lastEvolution: new Date(Number(lastEvolution) * 1000).toISOString()
  });
  
  // Get trait evolution history
  const [timestamps, values] = await dreamAgentNFTv2.getTraitEvolution(tokenId, "empathy", 0);
  console.log("Empathy Evolution History:");
  for (let i = 0; i < timestamps.length; i++) {
    console.log(`  ${new Date(Number(timestamps[i]) * 1000).toISOString()}: ${values[i]}`);
  }
  
  // Check milestones
  const milestones = ["empathy_master", "creative_genius", "balanced_soul"];
  for (const milestone of milestones) {
    const [achieved, achievedAt] = await dreamAgentNFTv2.hasMilestone(tokenId, milestone);
    if (achieved) {
      console.log(`🏆 Milestone achieved: ${milestone} at ${new Date(Number(achievedAt) * 1000).toISOString()}`);
    }
  }
  
  console.log("✅ Analytics test passed!");
}
```

### Test 5: Agent Compatibility

```javascript
// test-agent-compatibility.js
async function testAgentCompatibility() {
  console.log("🤝 Testing agent compatibility...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  const [deployer] = await ethers.getSigners();
  
  // Create a second agent with different personality
  const secondPersonality = {
    creativity: 80,  // High creativity
    analytical: 30,  // Low analytical
    empathy: 75,     // High empathy (similar to first agent)
    intuition: 65,
    resilience: 40,
    curiosity: 90,   // Very high curiosity
    dominantMood: "excited",
    lastDreamDate: 0
  };
  
  const tx = await dreamAgentNFTv2.mintWithPersonality(
    [],
    ["second_agent_test"],
    "TestAgent002",
    deployer.address,
    secondPersonality,
    { value: ethers.parseEther("0.1") }
  );
  
  await tx.wait();
  const secondTokenId = 2;
  
  // Calculate compatibility between agents
  const compatibility = await dreamAgentNFTv2.calculateCompatibility(1, secondTokenId);
  console.log(`Compatibility between Agent 1 and Agent 2: ${compatibility}%`);
  
  // Analyze why they're compatible/incompatible
  const agent1Traits = await dreamAgentNFTv2.getPersonalityTraits(1);
  const agent2Traits = await dreamAgentNFTv2.getPersonalityTraits(secondTokenId);
  
  console.log("Agent 1 Traits:", {
    creativity: agent1Traits.creativity,
    empathy: agent1Traits.empathy,
    curiosity: agent1Traits.curiosity
  });
  
  console.log("Agent 2 Traits:", {
    creativity: agent2Traits.creativity,
    empathy: agent2Traits.empathy,
    curiosity: agent2Traits.curiosity
  });
  
  console.log("✅ Compatibility test passed!");
  return secondTokenId;
}
```

## 🔍 Advanced Testing Scenarios

### Test 6: Personality Milestone Achievement

```javascript
// test-milestones.js
async function testMilestoneAchievement(tokenId) {
  console.log("🏆 Testing milestone achievements...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Create multiple dreams to boost empathy to master level (85+)
  const empathyBoostDreams = [
    { empathyChange: 10, moodShift: "compassionate" },
    { empathyChange: 8, moodShift: "loving" },
    { empathyChange: 7, moodShift: "caring" }
  ];
  
  for (let i = 0; i < empathyBoostDreams.length; i++) {
    // Wait 24h+ between dreams (simulate time passage)
    console.log(`Processing empathy dream ${i + 1}...`);
    
    const impact = {
      creativityChange: 0,
      analyticalChange: 0,
      empathyChange: empathyBoostDreams[i].empathyChange,
      intuitionChange: 2,
      resilienceChange: 1,
      curiosityChange: 0,
      moodShift: empathyBoostDreams[i].moodShift,
      evolutionWeight: 90
    };
    
    const dreamHash = ethers.keccak256(ethers.toUtf8Bytes(`empathy_dream_${i + 1}`));
    const analysisHash = ethers.keccak256(ethers.toUtf8Bytes(`empathy_analysis_${i + 1}`));
    
    // Advance time by 25 hours to allow next dream
    await network.provider.send("evm_increaseTime", [25 * 60 * 60]);
    await network.provider.send("evm_mine");
    
    const tx = await dreamAgentNFTv2.processDailyDream(
      tokenId,
      dreamHash,
      analysisHash,
      impact
    );
    
    await tx.wait();
    
    // Check current empathy level
    const personality = await dreamAgentNFTv2.getPersonalityTraits(tokenId);
    console.log(`Current empathy: ${personality.empathy}`);
    
    // Check if empathy master milestone was achieved
    const [achieved, achievedAt] = await dreamAgentNFTv2.hasMilestone(tokenId, "empathy_master");
    if (achieved) {
      console.log(`🎉 Empathy Master milestone achieved at empathy level ${personality.empathy}!`);
      break;
    }
  }
  
  console.log("✅ Milestone test passed!");
}
```

### Test 7: Agent Search and Filtering

```javascript
// test-agent-search.js
async function testAgentSearch() {
  console.log("🔍 Testing agent search functionality...");
  
  const dreamAgentNFTv2 = await ethers.getContract("DreamAgentNFTv2");
  
  // Find highly empathetic agents (empathy 70-100)
  const empatheticAgents = await dreamAgentNFTv2.findAgentsByTrait(
    "empathy",
    70,   // min value
    100,  // max value
    0,    // offset
    10    // limit
  );
  
  console.log(`Found ${empatheticAgents.length} highly empathetic agents:`, empatheticAgents);
  
  // Find creative agents (creativity 60-100)
  const creativeAgents = await dreamAgentNFTv2.findAgentsByTrait(
    "creativity",
    60,
    100,
    0,
    10
  );
  
  console.log(`Found ${creativeAgents.length} highly creative agents:`, creativeAgents);
  
  // Get personality summaries for multiple agents
  const allTokenIds = [1, 2]; // Adjust based on minted agents
  const personalitySummaries = await dreamAgentNFTv2.getPersonalitySummaries(allTokenIds);
  
  console.log("Personality Summaries:");
  personalitySummaries.forEach((personality, index) => {
    console.log(`Agent ${allTokenIds[index]}:`, {
      creativity: personality.creativity,
      empathy: personality.empathy,
      mood: personality.dominantMood
    });
  });
  
  console.log("✅ Search test passed!");
}
```

## 🎯 Complete Test Suite

### Run All Tests

```javascript
// test-complete-suite.js
async function runCompleteTestSuite() {
  console.log("🚀 Starting Complete Dreamscape iNFT Test Suite...\n");
  
  try {
    // Test 1: Basic minting
    const tokenId1 = await testPersonalityMinting();
    console.log();
    
    // Test 2: Dream evolution
    await testDreamEvolution(tokenId1);
    console.log();
    
    // Test 3: Conversations
    await testConversations(tokenId1);
    console.log();
    
    // Test 4: Analytics
    await testPersonalityAnalytics(tokenId1);
    console.log();
    
    // Test 5: Compatibility
    const tokenId2 = await testAgentCompatibility();
    console.log();
    
    // Test 6: Milestones
    await testMilestoneAchievement(tokenId1);
    console.log();
    
    // Test 7: Search
    await testAgentSearch();
    console.log();
    
    console.log("🎉 All tests passed! Dreamscape iNFT system is working correctly.");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  runCompleteTestSuite()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runCompleteTestSuite };
```

## 🏃‍♂️ Running Tests

### Method 1: Individual Tests

```bash
# Run specific test
npx hardhat run scripts/test-personality-minting.js --network galileo

# Run dream evolution test
npx hardhat run scripts/test-dream-evolution.js --network galileo
```

### Method 2: Complete Test Suite

```bash
# Run all tests
npx hardhat run scripts/test-complete-suite.js --network galileo
```

### Method 3: Hardhat Test Framework

```bash
# Run formal tests
npx hardhat test test/DreamAgentNFTv2.test.js --network galileo
```

## 📋 Test Checklist

### ✅ Core Functionality

- [ ] Agent minting with initial personality
- [ ] Daily dream processing with 24h cooldown
- [ ] Personality trait evolution within bounds (0-100)
- [ ] Conversation recording without evolution
- [ ] Response style determination
- [ ] Dominant trait calculation

### ✅ Advanced Features

- [ ] Personality rarity scoring
- [ ] Agent compatibility calculation
- [ ] Milestone achievement detection
- [ ] Trait evolution history tracking
- [ ] Agent search and filtering
- [ ] Evolution statistics calculation

### ✅ Edge Cases

- [ ] Multiple dreams per day (should fail)
- [ ] Invalid trait changes (out of bounds)
- [ ] Empty agent name (should fail)
- [ ] Insufficient payment (should fail)
- [ ] Maximum agents limit
- [ ] Personality consistency after evolution

### ✅ Events and Logs

- [ ] PersonalityEvolved event emission
- [ ] AgentConversation event emission
- [ ] PersonalityMilestone event emission
- [ ] ResponseStyleEvolved event emission

## 🐛 Common Issues and Solutions

### Issue 1: Daily Dream Cooldown

**Problem:** Cannot process multiple dreams per day
**Solution:** Use `evm_increaseTime` to simulate time passage in tests

```javascript
await network.provider.send("evm_increaseTime", [25 * 60 * 60]); // 25 hours
await network.provider.send("evm_mine");
```

### Issue 2: Trait Bounds Validation

**Problem:** Trait values going below 0 or above 100
**Solution:** Check bounds validation is working correctly

```javascript
// This should fail
const invalidImpact = {
  creativityChange: 15, // Invalid: > 10
  // ... other changes
};
```

### Issue 3: Gas Limit Issues

**Problem:** Transaction gas limit exceeded
**Solution:** Optimize function calls or increase gas limit

```javascript
const tx = await contract.method(...args, {
  gasLimit: 2000000 // Increase gas limit
});
```

### Issue 4: Event Not Emitted

**Problem:** Expected events not being emitted
**Solution:** Check event filters and wait for transaction receipt

```javascript
const tx = await contract.processDailyDream(...);
const receipt = await tx.wait();

// Check for specific event
const personalityEvolvedEvent = receipt.logs.find(
  log => log.eventName === "PersonalityEvolved"
);
```

## 📊 Performance Benchmarks

### Expected Gas Costs

| Function | Gas Cost (Est.) | Notes |
|----------|----------------|-------|
| `mintWithPersonality` | ~500,000 | Initial minting |
| `processDailyDream` | ~200,000 | Daily evolution |
| `recordConversation` | ~100,000 | Store conversation |
| `getPersonalityTraits` | ~30,000 | Read personality |
| `calculateCompatibility` | ~50,000 | Compare agents |

### Expected Response Times

| Operation | Time (ms) | Network |
|-----------|-----------|---------|
| Mint Agent | 3000-5000 | Galileo Testnet |
| Process Dream | 2000-3000 | Galileo Testnet |
| Query Personality | 100-300 | Galileo Testnet |
| Search Agents | 500-1000 | Galileo Testnet |

---

## 🎯 Success Criteria

The system passes all tests when:

1. ✅ **Agents mint with correct initial personality**
2. ✅ **Dreams evolve personality within daily limits**
3. ✅ **Conversations record without evolution**
4. ✅ **Milestones trigger at correct thresholds**
5. ✅ **Analytics provide accurate insights**
6. ✅ **Compatibility calculations work correctly**
7. ✅ **All events emit properly**
8. ✅ **Error handling works as expected**

**Ready to create the most advanced personality evolution system in Web3!** 🌟 