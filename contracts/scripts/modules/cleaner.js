#!/usr/bin/env node

/**
 * @fileoverview Build Cleaner Module
 * @description Clean cache, artifacts, and temporary files
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// Color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Logging utilities
const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`\n${colors.cyan}[Step ${num}]${colors.reset} ${msg}`)
};

// Clean targets
const CLEAN_TARGETS = {
  cache: {
    name: 'Hardhat Cache',
    paths: ['build/cache'],
    description: 'Compilation cache files'
  },
  artifacts: {
    name: 'Build Artifacts',
    paths: ['build/artifacts'],
    description: 'Compiled contract artifacts'
  },
  typechain: {
    name: 'TypeChain Files',
    paths: ['typechain', 'typechain-types'],
    description: 'Generated TypeScript types'
  },
  deployments: {
    name: 'Deployment Records',
    paths: ['deployments'],
    description: 'Deployment history (use with caution)'
  },
  temp: {
    name: 'Temporary Files',
    paths: ['*.log', 'npm-debug.log*', '.openzeppelin/*.json~*'],
    description: 'Log and temporary files'
  }
};

class BuildCleaner {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    this.projectRoot = path.resolve(__dirname, '../..');
    this.backupDir = path.join(this.projectRoot, '.backup');
  }

  /**
   * Get user input
   */
  async question(query) {
    return new Promise(resolve => this.rl.question(query, resolve));
  }

  /**
   * Calculate directory size
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;

    if (!fs.existsSync(dirPath)) {
      return 0;
    }

    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        totalSize += this.getDirectorySize(filePath);
      } else {
        totalSize += stats.size;
      }
    }

    return totalSize;
  }

  /**
   * Format bytes to human readable
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Analyze current build files
   */
  async analyzeBuildFiles() {
    log.step(1, 'Analyzing build files...');

    console.log('\nCurrent build status:');
    console.log('-'.repeat(60));

    let totalSize = 0;
    const analysis = [];

    for (const [key, target] of Object.entries(CLEAN_TARGETS)) {
      for (const relativePath of target.paths) {
        const fullPath = path.join(this.projectRoot, relativePath);

        if (relativePath.includes('*')) {
          // Handle glob patterns
          const dir = path.dirname(fullPath);
          const pattern = path.basename(fullPath);

          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir).filter(f =>
              f.match(new RegExp(pattern.replace('*', '.*')))
            );

            if (files.length > 0) {
              const size = files.reduce((acc, file) => {
                const filePath = path.join(dir, file);
                return acc + fs.statSync(filePath).size;
              }, 0);

              totalSize += size;
              analysis.push({
                name: target.name,
                path: relativePath,
                exists: true,
                size: size,
                fileCount: files.length
              });
            }
          }
        } else {
          // Handle regular paths
          if (fs.existsSync(fullPath)) {
            const size = this.getDirectorySize(fullPath);
            totalSize += size;

            const fileCount = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() ?
              fs.readdirSync(fullPath).length : 1;

            analysis.push({
              name: target.name,
              path: relativePath,
              exists: true,
              size: size,
              fileCount: fileCount
            });
          }
        }
      }
    }

    if (analysis.length === 0) {
      log.info('No build files found. Everything is clean.');
    } else {
      console.log('Type'.padEnd(25) + 'Path'.padEnd(20) + 'Size'.padEnd(12) + 'Files');
      console.log('-'.repeat(60));

      analysis.forEach(item => {
        console.log(
          item.name.padEnd(25) +
          item.path.substring(0, 19).padEnd(20) +
          this.formatBytes(item.size).padEnd(12) +
          item.fileCount
        );
      });

      console.log('-'.repeat(60));
      console.log(`Total size: ${colors.yellow}${this.formatBytes(totalSize)}${colors.reset}`);
    }

    return analysis;
  }

  /**
   * Select items to clean
   */
  async selectCleanTargets() {
    console.log(`\n${colors.cyan}Select items to clean:${colors.reset}\n`);

    console.log('  1. Cache only (safe)');
    console.log('  2. Cache + Artifacts (recommended)');
    console.log('  3. Everything except deployments');
    console.log('  4. Everything (full clean)');
    console.log('  5. Custom selection');
    console.log('\n' + '-'.repeat(50));

    const choice = await this.question(`\n${colors.cyan}Your choice [1-5]:${colors.reset} `);

    let targets = [];

    switch (choice.trim()) {
      case '1':
        targets = ['cache'];
        break;
      case '2':
        targets = ['cache', 'artifacts'];
        break;
      case '3':
        targets = ['cache', 'artifacts', 'typechain', 'temp'];
        break;
      case '4':
        targets = Object.keys(CLEAN_TARGETS);
        break;
      case '5':
        targets = await this.customSelection();
        break;
      default:
        log.warning('Invalid choice. Using default (cache + artifacts)');
        targets = ['cache', 'artifacts'];
    }

    return targets;
  }

  /**
   * Custom selection of clean targets
   */
  async customSelection() {
    console.log('\nAvailable targets:');

    Object.entries(CLEAN_TARGETS).forEach(([key, target], index) => {
      console.log(`  ${index + 1}. ${target.name} - ${target.description}`);
    });

    const input = await this.question('\nEnter numbers separated by comma (e.g., 1,2,3): ');
    const indices = input.split(',').map(n => parseInt(n.trim()) - 1);
    const keys = Object.keys(CLEAN_TARGETS);

    return indices
      .filter(i => i >= 0 && i < keys.length)
      .map(i => keys[i]);
  }

  /**
   * Create backup before cleaning
   */
  async createBackup(targets) {
    const backupNeeded = targets.includes('deployments') || targets.includes('artifacts');

    if (!backupNeeded) {
      return null;
    }

    log.step(2, 'Creating backup...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, timestamp);

    try {
      fs.mkdirSync(backupPath, { recursive: true });

      for (const target of targets) {
        const targetPaths = CLEAN_TARGETS[target].paths;

        for (const relativePath of targetPaths) {
          const sourcePath = path.join(this.projectRoot, relativePath);

          if (fs.existsSync(sourcePath) && !relativePath.includes('*')) {
            const destPath = path.join(backupPath, relativePath);
            fs.mkdirSync(path.dirname(destPath), { recursive: true });

            execSync(`cp -r "${sourcePath}" "${destPath}"`, {
              cwd: this.projectRoot,
              stdio: 'pipe'
            });
          }
        }
      }

      log.success(`Backup created at: .backup/${timestamp}`);
      return backupPath;
    } catch (error) {
      log.warning(`Backup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove directories and files
   */
  removeDirectory(dirPath) {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  }

  /**
   * Clean selected targets
   */
  async cleanTargets(targets) {
    log.step(3, 'Cleaning selected items...');

    let cleanedCount = 0;
    let failedCount = 0;

    for (const target of targets) {
      const targetInfo = CLEAN_TARGETS[target];

      console.log(`\nCleaning ${targetInfo.name}...`);

      for (const relativePath of targetInfo.paths) {
        const fullPath = path.join(this.projectRoot, relativePath);

        try {
          if (relativePath.includes('*')) {
            // Handle glob patterns
            const dir = path.dirname(fullPath);
            const pattern = path.basename(fullPath);

            if (fs.existsSync(dir)) {
              const files = fs.readdirSync(dir).filter(f =>
                f.match(new RegExp(pattern.replace('*', '.*')))
              );

              files.forEach(file => {
                fs.unlinkSync(path.join(dir, file));
                cleanedCount++;
              });

              if (files.length > 0) {
                console.log(`  - Removed ${files.length} ${pattern} files`);
              }
            }
          } else {
            // Handle regular paths
            if (this.removeDirectory(fullPath)) {
              console.log(`  - Removed ${relativePath}`);
              cleanedCount++;
            }
          }
        } catch (error) {
          console.log(`  ${colors.red}✗${colors.reset} Failed to clean ${relativePath}: ${error.message}`);
          failedCount++;
        }
      }
    }

    return { cleanedCount, failedCount };
  }

  /**
   * Run hardhat clean
   */
  async runHardhatClean() {
    log.step(4, 'Running Hardhat clean...');

    try {
      execSync('npx hardhat clean', {
        cwd: this.projectRoot,
        stdio: 'pipe'
      });

      log.success('Hardhat clean completed');
    } catch (error) {
      log.warning(`Hardhat clean failed: ${error.message}`);
    }
  }

  /**
   * Display cleaning summary
   */
  displaySummary(results, backupPath) {
    console.log('\n' + '='.repeat(50));
    log.success('CLEANING COMPLETED');
    console.log('='.repeat(50));

    console.log('\nSummary:');
    console.log(`  Items cleaned: ${results.cleanedCount}`);

    if (results.failedCount > 0) {
      console.log(`  Failed: ${colors.red}${results.failedCount}${colors.reset}`);
    }

    if (backupPath) {
      console.log(`  Backup location: ${colors.cyan}${backupPath}${colors.reset}`);
    }

    console.log('\nNext steps:');
    console.log('  1. Run compilation to rebuild artifacts');
    console.log('  2. Verify project still works correctly');

    if (backupPath) {
      console.log('  3. Delete backup when confirmed working');
    }
  }

  /**
   * Main cleaning flow
   */
  async run() {
    console.log('='.repeat(50));
    console.log(`${colors.bright}    BUILD CLEANER MODULE${colors.reset}`);
    console.log('='.repeat(50));

    try {
      // Analyze current state
      const analysis = await this.analyzeBuildFiles();

      if (analysis.length === 0) {
        console.log('\nNothing to clean!');
        process.exit(0);
      }

      // Select targets
      const targets = await this.selectCleanTargets();

      if (targets.length === 0) {
        log.warning('No targets selected');
        process.exit(0);
      }

      console.log('\n' + colors.yellow + 'Selected for cleaning:' + colors.reset);
      targets.forEach(t => console.log(`  - ${CLEAN_TARGETS[t].name}`));

      // Confirm
      const confirm = await this.question(`\n${colors.yellow}Proceed with cleaning? (y/n):${colors.reset} `);

      if (confirm.toLowerCase() !== 'y') {
        log.warning('Cleaning cancelled');
        process.exit(0);
      }

      // Create backup
      const backupPath = await this.createBackup(targets);

      // Clean targets
      const results = await this.cleanTargets(targets);

      // Run hardhat clean
      if (targets.includes('cache') || targets.includes('artifacts')) {
        await this.runHardhatClean();
      }

      // Display summary
      this.displaySummary(results, backupPath);

    } catch (error) {
      console.log('\n' + '='.repeat(50));
      log.error(`Cleaning failed: ${error.message}`);
      console.log('='.repeat(50));
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const cleaner = new BuildCleaner();
  cleaner.run();
}

module.exports = BuildCleaner;