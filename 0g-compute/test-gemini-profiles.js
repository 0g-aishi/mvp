#!/usr/bin/env node

const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Test queries for different complexity levels
const TEST_QUERIES = {
  simple: "What is 2 + 2?",
  medium: "Explain the difference between React and Vue.js in one paragraph.",
  complex: "Analyze the philosophical implications of artificial consciousness and provide examples from current AI research with ethical considerations."
};

// Banner and utilities
function showBanner() {
  console.clear();
  console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║      🤖 Gemini Profile Tester         ║
║                                       ║
║   Test dynamic profile selection      ║
║   Compare performance & quality       ║
║   Verify backend implementation       ║
╚═══════════════════════════════════════╝
  `));
}

function formatTime(ms) {
  if (ms < 1000) return chalk.green(`${ms}ms`);
  if (ms < 3000) return chalk.yellow(`${(ms/1000).toFixed(1)}s`);
  return chalk.red(`${(ms/1000).toFixed(1)}s`);
}

function formatTokens(tokens) {
  return chalk.blue(`${tokens} tokens`);
}

// API Functions
async function checkBackendHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`);
    return response.data.success;
  } catch (error) {
    return false;
  }
}

async function getGeminiProfiles() {
  try {
    const response = await axios.get(`${API_URL}/gemini/profiles`);
    return response.data.data;
  } catch (error) {
    console.log(chalk.red('❌ Failed to fetch Gemini profiles:'), error.message);
    return null;
  }
}

async function getGeminiStatus() {
  try {
    const response = await axios.get(`${API_URL}/gemini/status`);
    return response.data.data;
  } catch (error) {
    console.log(chalk.red('❌ Failed to fetch Gemini status:'), error.message);
    return null;
  }
}

async function testGeminiProfile(profile, query, queryType = 'custom') {
  const startTime = Date.now();
  
  try {
    console.log(chalk.cyan(`🧪 Testing profile: ${chalk.bold(profile)}`));
    console.log(chalk.gray(`Query (${queryType}): "${query.substring(0, 60)}..."`));
    
    const response = await axios.post(`${API_URL}/gemini`, {
      prompt: query,
      profile: profile
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.data.success) {
      const metadata = response.data.metadata;
      
      console.log(chalk.green('✅ Success!'));
      console.log(`⏱️  Response Time: ${formatTime(responseTime)}`);
      console.log(`📊 Profile Used: ${chalk.bold(metadata.profile)}`);
      console.log(`💭 Thinking: ${metadata.thinkingEnabled ? chalk.green('ENABLED') : chalk.yellow('DISABLED')}`);
      
      if (metadata.thinkingBudget !== undefined) {
        const budget = metadata.thinkingBudget === -1 ? 'AUTO' : metadata.thinkingBudget;
        console.log(`🧠 Thinking Budget: ${chalk.blue(budget)}`);
      }
      
      console.log(`🔢 Tokens: ${formatTokens(metadata.promptTokenCount)} + ${formatTokens(metadata.candidatesTokenCount)} = ${formatTokens(metadata.totalTokenCount)}`);
      console.log(`📝 Response Preview: ${chalk.italic(response.data.data.substring(0, 100))}...`);
      
      return {
        success: true,
        responseTime,
        metadata,
        response: response.data.data,
        profile
      };
    } else {
      console.log(chalk.red('❌ Request failed:'), response.data.error);
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(chalk.red('❌ Error:'), error.message);
    return { success: false, error: error.message, responseTime };
  }
}

async function testModelIdExtraction(modelId, expectedProfile) {
  console.log(chalk.cyan(`🔍 Testing Model ID extraction: ${modelId}`));
  
  try {
    const response = await axios.post(`${API_URL}/gemini`, {
      prompt: TEST_QUERIES.simple,
      modelId: modelId
    });
    
    if (response.data.success) {
      const actualProfile = response.data.metadata.selectedProfile;
      const isCorrect = actualProfile === expectedProfile;
      
      console.log(`Expected: ${chalk.yellow(expectedProfile)} → Actual: ${isCorrect ? chalk.green(actualProfile) : chalk.red(actualProfile)}`);
      return isCorrect;
    }
  } catch (error) {
    console.log(chalk.red('❌ Error:'), error.message);
    return false;
  }
}

async function compareAllProfiles() {
  console.log(chalk.cyan('\n🏁 Performance Comparison Test'));
  console.log(chalk.gray('Testing all profiles with the same complex query...\n'));
  
  const profiles = ['thinking', 'fast', 'auto'];
  const results = [];
  
  for (const profile of profiles) {
    console.log(chalk.yellow(`\n━━━ Testing ${profile.toUpperCase()} Profile ━━━`));
    const result = await testGeminiProfile(profile, TEST_QUERIES.complex, 'complex');
    
    if (result.success) {
      results.push(result);
    }
    
    console.log(''); // spacing
  }
  
  if (results.length > 0) {
    console.log(chalk.cyan('\n📊 Performance Summary:'));
    console.log('┌─────────────┬──────────────┬────────────┬──────────────┬─────────────┐');
    console.log('│ Profile     │ Response Time│ Total Tokens│ Thinking     │ Quality*    │');
    console.log('├─────────────┼──────────────┼────────────┼──────────────┼─────────────┤');
    
    results.forEach(result => {
      const profile = result.profile.padEnd(11);
      const time = `${result.responseTime}ms`.padEnd(12);
      const tokens = `${result.metadata.totalTokenCount}`.padEnd(10);
      const thinking = (result.metadata.thinkingEnabled ? 'YES' : 'NO').padEnd(12);
      const quality = (result.response.length + ' chars').padEnd(11);
      
      console.log(`│ ${profile} │ ${time} │ ${tokens} │ ${thinking} │ ${quality} │`);
    });
    
    console.log('└─────────────┴──────────────┴────────────┴──────────────┴─────────────┘');
    console.log(chalk.gray('* Quality measured by response length (longer = more detailed)'));
  }
}

// Main Menu
async function showMainMenu() {
  const choices = [
    { name: '🧠 Test Profile: thinking (Deep Reasoning)', value: 'test_thinking' },
    { name: '⚡ Test Profile: fast (Speed Mode)', value: 'test_fast' },
    { name: '🎯 Test Profile: auto (Adaptive)', value: 'test_auto' },
    { name: '🔄 Test Backward Compatibility (no profile)', value: 'test_compatibility' },
    { name: '🏁 Compare All Profiles Performance', value: 'compare_all' },
    { name: '🔍 Test Model ID Extraction', value: 'test_extraction' },
    { name: '📋 View Available Profiles', value: 'view_profiles' },
    { name: '🩺 Check Backend Status', value: 'check_status' },
    { name: '🎨 Custom Query Test', value: 'custom_test' },
    new inquirer.Separator(),
    { name: '🚪 Exit', value: 'exit' }
  ];

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Choose an action:',
      choices,
      pageSize: 15
    }
  ]);

  return action;
}

async function runCustomTest() {
  const questions = [
    {
      type: 'input',
      name: 'query',
      message: 'Enter your custom query:',
      validate: input => input.trim().length > 0 || 'Query cannot be empty'
    },
    {
      type: 'list',
      name: 'profile',
      message: 'Choose profile:',
      choices: [
        { name: 'thinking - Deep reasoning', value: 'thinking' },
        { name: 'fast - Speed optimized', value: 'fast' },
        { name: 'auto - Adaptive', value: 'auto' }
      ]
    }
  ];

  const answers = await inquirer.prompt(questions);
  return testGeminiProfile(answers.profile, answers.query, 'custom');
}

// Main Application
async function main() {
  showBanner();
  
  // Check backend health
  console.log(chalk.yellow('🔍 Checking backend connection...'));
  const isHealthy = await checkBackendHealth();
  
  if (!isHealthy) {
    console.log(chalk.red('❌ Backend is not responding at http://localhost:3001'));
    console.log(chalk.yellow('💡 Please ensure the backend is running with: npm run dev:wsl'));
    process.exit(1);
  }
  
  console.log(chalk.green('✅ Backend is healthy and responding\n'));
  
  while (true) {
    const action = await showMainMenu();
    
    console.log(''); // spacing
    
    switch (action) {
      case 'test_thinking':
        await testGeminiProfile('thinking', TEST_QUERIES.complex, 'complex');
        break;
        
      case 'test_fast':
        await testGeminiProfile('fast', TEST_QUERIES.simple, 'simple');
        break;
        
      case 'test_auto':
        await testGeminiProfile('auto', TEST_QUERIES.medium, 'medium');
        break;
        
      case 'test_compatibility':
        console.log(chalk.cyan('🔄 Testing backward compatibility (no profile parameter)...'));
        try {
          const response = await axios.post(`${API_URL}/gemini`, {
            prompt: TEST_QUERIES.simple
          });
          console.log(chalk.green('✅ Backward compatibility works!'));
          console.log(`Default profile used: ${chalk.bold(response.data.metadata?.selectedProfile || 'auto')}`);
        } catch (error) {
          console.log(chalk.red('❌ Backward compatibility failed:'), error.message);
        }
        break;
        
      case 'compare_all':
        await compareAllProfiles();
        break;
        
      case 'test_extraction':
        console.log(chalk.cyan('🔍 Testing Model ID Extraction...'));
        await testModelIdExtraction('gemini-2.5-flash-thinking', 'thinking');
        await testModelIdExtraction('gemini-2.5-flash-fast', 'fast');
        await testModelIdExtraction('gemini-2.5-flash-auto', 'auto');
        await testModelIdExtraction('gemini-2.5-flash', 'auto');
        break;
        
      case 'view_profiles':
        const profiles = await getGeminiProfiles();
        if (profiles) {
          console.log(chalk.cyan('📋 Available Gemini Profiles:'));
          Object.entries(profiles.profiles).forEach(([id, profile]) => {
            console.log(`\n${chalk.bold(id)}:`);
            console.log(`  Name: ${profile.name}`);
            console.log(`  Description: ${profile.description}`);
            console.log(`  Temperature: ${profile.temperature}`);
            console.log(`  Thinking: ${profile.thinkingEnabled ? chalk.green('ENABLED') : chalk.yellow('DISABLED')}`);
            if (profile.thinkingEnabled) {
              console.log(`  Budget: ${chalk.blue(profile.thinkingBudget)}`);
            }
          });
        }
        break;
        
      case 'check_status':
        const status = await getGeminiStatus();
        if (status) {
          console.log(chalk.cyan('🩺 Gemini Service Status:'));
          console.log(`  Ready: ${status.isReady ? chalk.green('YES') : chalk.red('NO')}`);
          console.log(`  Project: ${status.project}`);
          console.log(`  Location: ${status.location}`);
          console.log(`  Model: ${status.model}`);
          console.log(`  Available Profiles: ${status.availableProfiles.join(', ')}`);
          console.log(`  Profile Count: ${status.profileCount}`);
        }
        break;
        
      case 'custom_test':
        await runCustomTest();
        break;
        
      case 'exit':
        console.log(chalk.green('\n👋 Thanks for using Gemini Profile Tester!'));
        process.exit(0);
        
      default:
        console.log(chalk.red('Unknown action'));
    }
    
    // Wait for user input before showing menu again
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: chalk.gray('Press Enter to continue...')
    }]);
    
    showBanner();
  }
}

// Handle graceful exit
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!'));
  process.exit(0);
});

// Run the application
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
});