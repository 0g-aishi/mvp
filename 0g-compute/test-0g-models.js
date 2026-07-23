#!/usr/bin/env node

const axios = require('axios');
const inquirer = require('inquirer');
const chalk = require('chalk');

// Configuration
const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;
const MASTER_WALLET = '0x0f13e85B575964B8b4b77E37d43A6aE9E354e94C';

// Test queries for different complexity levels
const TEST_QUERIES = {
  simple: "What is 2 + 2?",
  medium: "Explain the difference between React and Vue.js in one paragraph.",
  complex: "Analyze the philosophical implications of artificial consciousness and provide examples from current AI research with ethical considerations.",
  coding: "Write a Python function that checks if a number is prime and explain how it works."
};

// Banner and utilities
function showBanner() {
  console.clear();
  console.log(chalk.cyan(`
╔═══════════════════════════════════════╗
║      🌐 0G Network Model Tester       ║
║                                       ║
║   Test 0G Network AI models           ║
║   Compare performance & costs         ║
║   Interactive chat interface          ║
╚═══════════════════════════════════════╝
  `));
}

function formatTime(ms) {
  if (ms < 1000) return chalk.green(`${ms}ms`);
  if (ms < 3000) return chalk.yellow(`${(ms/1000).toFixed(1)}s`);
  return chalk.red(`${(ms/1000).toFixed(1)}s`);
}

function formatCost(cost) {
  const numCost = parseFloat(cost);
  if (numCost < 0.001) return chalk.green(`${numCost.toFixed(8)} OG`);
  if (numCost < 0.01) return chalk.yellow(`${numCost.toFixed(6)} OG`);
  return chalk.red(`${numCost.toFixed(4)} OG`);
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

async function discover0GModels() {
  try {
    console.log(chalk.yellow('🔍 Discovering available 0G Network models...'));
    const response = await axios.get(`${API_URL}/models/discover`);
    
    if (response.data.success && response.data.data?.models) {
      const models = response.data.data.models || [];
      console.log(chalk.green(`✅ Discovered ${models.length} models`));
      
      // Debug: pokazanie nazw modeli
      if (models.length > 0) {
        const modelNames = models.map(m => m.name || m.id).join(', ');
        console.log(chalk.gray(`Models: ${modelNames}`));
      }
      
      return models;
    } else {
      console.log(chalk.red('❌ Failed to discover models:'), response.data.error || 'Invalid response structure');
      return [];
    }
  } catch (error) {
    console.log(chalk.red('❌ Error discovering models:'), error.message);
    return [];
  }
}

async function getMasterWalletBalance() {
  try {
    const response = await axios.get(`${API_URL}/master-wallet/balance`);
    if (response.data.success) {
      return response.data.data.balance;
    }
  } catch (error) {
    console.log(chalk.red('❌ Failed to get Master Wallet balance:'), error.message);
  }
  return null;
}

async function createVirtualBroker() {
  try {
    console.log(chalk.yellow('🏦 Creating virtual broker for testing...'));
    const response = await axios.post(`${API_URL}/create-broker`, { // ✅ Poprawiony endpoint
      walletAddress: MASTER_WALLET
    });
    
    if (response.data.success) {
      console.log(chalk.green('✅ Virtual broker created successfully'));
      return true;
    } else {
      console.log(chalk.red('❌ Failed to create virtual broker:'), response.data.error);
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Error creating virtual broker:'), error.message);
    return false;
  }
}

async function fundVirtualBroker(amount = 0.1) {
  try {
    console.log(chalk.yellow(`💰 Funding virtual broker with ${amount} OG...`));
    const response = await axios.post(`${API_URL}/fund`, { // ✅ Poprawiony endpoint
      walletAddress: MASTER_WALLET,
      amount: amount
    });
    
    if (response.data.success) {
      console.log(chalk.green(`✅ Broker funded with ${amount} OG`));
      return true;
    } else {
      console.log(chalk.red('❌ Failed to fund broker:'), response.data.error);
      return false;
    }
  } catch (error) {
    console.log(chalk.red('❌ Error funding broker:'), error.message);
    return false;
  }
}

async function test0GModel(modelId, query, queryType = 'custom') {
  const startTime = Date.now();
  
  try {
    console.log(chalk.cyan(`🤖 Testing model: ${chalk.bold(modelId)}`));
    console.log(chalk.gray(`Query (${queryType}): "${query.substring(0, 60)}..."`));
    
    // ✅ Dodaj debug informacje o żądaniu  
    const requestBody = {
      walletAddress: MASTER_WALLET, // ✅ Zmiana z userWalletAddress na walletAddress
      query: query,
      modelId: modelId
    };
    
    console.log(chalk.gray(`📤 Request: ${JSON.stringify(requestBody, null, 2)}`));
    
    const response = await axios.post(`${API_URL}/0g-compute`, requestBody);
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.data.success) {
      const data = response.data.data;
      
      console.log(chalk.green('✅ Success!'));
      console.log(`⏱️  Response Time: ${formatTime(responseTime)}`);
      console.log(`🤖 Model Used: ${chalk.bold(data.model)}`);
      console.log(`💸 Cost: ${formatCost(data.cost)}`);
      console.log(`🆔 Chat ID: ${chalk.gray(data.chatId)}`);
      console.log(`✅ Valid: ${data.isValid ? chalk.green('YES') : chalk.red('NO')}`);
      console.log(`📝 Response Preview: ${chalk.italic(data.response.substring(0, 150))}...`);
      
      return {
        success: true,
        responseTime,
        cost: data.cost,
        model: data.model,
        response: data.response,
        chatId: data.chatId,
        isValid: data.isValid
      };
    } else {
      console.log(chalk.red('❌ Request failed:'), response.data.error);
      console.log(chalk.gray(`📥 Full Response: ${JSON.stringify(response.data, null, 2)}`)); // ✅ Debug full response
      return { success: false, error: response.data.error };
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.log(chalk.red('❌ Error:'), error.message);
    
    // ✅ Lepsze error handling z więcej informacji
    if (error.response) {
      console.log(chalk.gray(`📥 Error Response Status: ${error.response.status}`));
      console.log(chalk.gray(`📥 Error Response Data: ${JSON.stringify(error.response.data, null, 2)}`));
    } else if (error.request) {
      console.log(chalk.gray(`📡 No response received from server`));
    }
    
    return { success: false, error: error.message, responseTime };
  }
}

async function showInteractiveChat(modelId) {
  console.log(chalk.cyan(`\n💬 Interactive Chat with ${chalk.bold(modelId)}`));
  console.log(chalk.gray('Type your messages (type "exit" to return to menu)\n'));
  
  while (true) {
    const { message } = await inquirer.prompt([{
      type: 'input',
      name: 'message',
      message: chalk.blue('You:'),
      validate: input => input.trim().length > 0 || 'Message cannot be empty'
    }]);
    
    if (message.toLowerCase().trim() === 'exit') {
      break;
    }
    
    console.log(''); // spacing
    const result = await test0GModel(modelId, message, 'chat');
    
    if (result.success) {
      console.log(chalk.green(`\n${modelId}:`));
      console.log(chalk.white(result.response));
      console.log(chalk.gray(`Cost: ${formatCost(result.cost)} | Time: ${formatTime(result.responseTime)}\n`));
    } else {
      console.log(chalk.red(`\nError: ${result.error}\n`));
    }
  }
}

async function compareAllModels(models) {
  if (models.length === 0) {
    console.log(chalk.red('❌ No models available for comparison'));
    return;
  }
  
  console.log(chalk.cyan('\n🏁 Performance Comparison Test'));
  console.log(chalk.gray('Testing all models with the same query...\n'));
  
  const results = [];
  
  for (const model of models) {
    console.log(chalk.yellow(`\n━━━ Testing ${model.name.toUpperCase()} ━━━`));
    const result = await test0GModel(model.id, TEST_QUERIES.complex, 'complex'); // ✅ Używamy model.id
    
    if (result.success) {
      results.push({
        ...result,
        modelName: model.name, // ✅ Używamy model.name dla display
        provider: model.provider
      });
    }
    
    console.log(''); // spacing
  }
  
  if (results.length > 0) {
    console.log(chalk.cyan('\n📊 Performance Summary:'));
    console.log('┌────────────────────────────┬──────────────┬────────────┬──────────────┬─────────────┐');
    console.log('│ Model                      │ Response Time│ Cost (OG)  │ Valid        │ Response*   │');
    console.log('├────────────────────────────┼──────────────┼────────────┼──────────────┼─────────────┤');
    
    results.forEach(result => {
      const model = result.modelName.substring(0, 26).padEnd(26);
      const time = `${result.responseTime}ms`.padEnd(12);
      const cost = result.cost.toFixed(6).padEnd(10);
      const valid = (result.isValid ? 'YES' : 'NO').padEnd(12);
      const quality = (result.response.length + ' chars').padEnd(11);
      
      console.log(`│ ${model} │ ${time} │ ${cost} │ ${valid} │ ${quality} │`);
    });
    
    console.log('└────────────────────────────┴──────────────┴────────────┴──────────────┴─────────────┘');
    console.log(chalk.gray('* Response quality measured by response length (longer = more detailed)'));
    
    // Show cost summary
    const totalCost = results.reduce((sum, r) => sum + parseFloat(r.cost), 0);
    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    console.log(chalk.cyan('\n💰 Cost Summary:'));
    console.log(`Total Cost: ${formatCost(totalCost)}`);
    console.log(`Average Response Time: ${formatTime(avgTime)}`);
  }
}

async function showModelDetails(models) {
  if (models.length === 0) {
    console.log(chalk.red('❌ No models available'));
    return;
  }
  
  console.log(chalk.cyan('🤖 Available 0G Network Models:\n'));
  
  models.forEach((model, index) => {
    console.log(`${chalk.bold(`${index + 1}. ${model.name || model.id}`)}`);
    console.log(`   Provider: ${chalk.yellow(model.provider)}`);
    console.log(`   Type: ${chalk.gray(model.type || 'decentralized')}`);
    console.log(`   Badge: ${chalk.blue(model.badge || 'None')}`);
    console.log(`   Input Price: ${chalk.green(model.inputPrice || '0')} wei`);
    console.log(`   Output Price: ${chalk.green(model.outputPrice || '0')} wei`);
    console.log(`   Verifiability: ${chalk.magenta(model.verifiability)}`);
    console.log(`   Available: ${model.available ? chalk.green('YES') : chalk.red('NO')}`);
    console.log('');
  });
}

// Main Menu
async function showMainMenu(models) {
  const modelChoices = models.length > 0 
    ? models.map(model => ({ name: `🤖 Test ${model.name || model.id}`, value: `test_${model.id}` }))
    : [{ name: chalk.gray('🚫 No models available'), value: null, disabled: true }];

  const choices = [
    { name: '🔍 Discover Available 0G Models', value: 'discover' },
    { name: '📋 View Model Details', value: 'view_models' },
    new inquirer.Separator('─ Test Individual Models ─'),
    ...modelChoices,
    new inquirer.Separator('─ Advanced Features ─'),
    { name: '💬 Interactive Chat', value: 'interactive_chat' },
    { name: '🏁 Compare All Models Performance', value: 'compare_all' },
    { name: '💰 Check Master Wallet Balance', value: 'check_balance' },
    { name: '🏦 Setup Virtual Broker', value: 'setup_broker' },
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
      pageSize: 20
    }
  ]);

  return action;
}

async function selectModel(models) {
  if (models.length === 0) {
    console.log(chalk.red('❌ No models available. Please discover models first.'));
    return null;
  }
  
  const { selectedModel } = await inquirer.prompt([{
    type: 'list',
    name: 'selectedModel',
    message: 'Select a model:',
    choices: models.map(model => ({ 
      name: `${model.name} (${model.provider})`, // ✅ Używamy model.name zamiast model.model
      value: model.id // ✅ Używamy model.id zamiast model.model
    }))
  }]);
  
  return selectedModel;
}

async function runCustomTest(models) {
  const model = await selectModel(models);
  if (!model) return;
  
  const { query } = await inquirer.prompt([{
    type: 'input',
    name: 'query',
    message: 'Enter your custom query:',
    validate: input => input.trim().length > 0 || 'Query cannot be empty'
  }]);
  
  return test0GModel(model, query, 'custom');
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
  
  // ✅ Auto-setup Virtual Broker for testing
  console.log(chalk.yellow('🏦 Setting up Virtual Broker...'));
  try {
    const brokerCreated = await createVirtualBroker();
    if (brokerCreated) {
      console.log(chalk.yellow('💰 Funding broker with 0.01 OG...'));
      const funded = await fundVirtualBroker(0.01);
      if (funded) {
        console.log(chalk.green('✅ Virtual Broker setup completed successfully'));
        
        // Verify balance
        try {
          const response = await axios.get(`${API_URL}/balance/${MASTER_WALLET}`);
          if (response.data.success) {
            const balance = response.data.data.balance;
            console.log(chalk.green(`💰 Current balance: ${balance.toFixed(8)} OG`));
          }
        } catch (error) {
          console.log(chalk.yellow('⚠️  Could not verify balance, but proceeding...'));
        }
      } else {
        console.log(chalk.red('❌ Failed to fund broker - some tests may fail'));
      }
    } else {
      console.log(chalk.red('❌ Failed to create broker - tests will likely fail'));
    }
  } catch (error) {
    console.log(chalk.red('❌ Broker setup failed:', error.message));
    console.log(chalk.yellow('⚠️  Continuing anyway - tests may fail without proper broker setup'));
  }
  
  console.log(''); // spacing
  
  let models = [];
  
  while (true) {
    const action = await showMainMenu(models);
    
    console.log(''); // spacing
    
    switch (action) {
      case 'discover':
        models = await discover0GModels();
        break;
        
      case 'view_models':
        await showModelDetails(models);
        break;
        
      case 'interactive_chat':
        const chatModel = await selectModel(models);
        if (chatModel) {
          await showInteractiveChat(chatModel);
        }
        break;
        
      case 'compare_all':
        await compareAllModels(models);
        break;
        
      case 'check_balance':
        console.log(chalk.cyan('💰 Checking Master Wallet balance...'));
        const balance = await getMasterWalletBalance();
        if (balance !== null) {
          console.log(`Master Wallet Balance: ${formatCost(balance)}`);
        }
        break;
        
      case 'setup_broker':
        console.log(chalk.cyan('🏦 Setting up Virtual Broker for testing...'));
        const brokerCreated = await createVirtualBroker();
        if (brokerCreated) {
          await fundVirtualBroker(0.1);
        }
        break;
        
      case 'custom_test':
        await runCustomTest(models);
        break;
        
      case 'exit':
        console.log(chalk.green('\n👋 Thanks for using 0G Network Model Tester!'));
        process.exit(0);
        
      default:
        // Handle individual model testing
        if (action && action.startsWith('test_')) {
          const modelName = action.replace('test_', '');
          await test0GModel(modelName, TEST_QUERIES.medium, 'medium');
        } else {
          console.log(chalk.red('Unknown action'));
        }
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