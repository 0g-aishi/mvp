const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

/**
 * Environment types for cross-platform compatibility
 */
const EnvironmentType = {
  WSL: 'wsl',
  WINDOWS: 'windows', 
  LINUX: 'linux',
  UNKNOWN: 'unknown'
};

/**
 * Centralized environment variable loader with cross-platform compatibility
 * Supports WSL, Windows PowerShell, and Linux environments
 * Handles automatic path conversion between Windows and WSL paths
 */
class EnvLoader {
  static isLoaded = false;
  static loadedPath = null;
  static detectedEnvironment = null;

  /**
   * Detect the current environment (WSL, Windows, Linux)
   */
  static detectEnvironment() {
    if (this.detectedEnvironment) {
      return this.detectedEnvironment;
    }

    try {
      // Check if we're in WSL
      if (process.platform === 'linux') {
        try {
          const release = fs.readFileSync('/proc/version', 'utf8');
          if (release.toLowerCase().includes('microsoft') || release.toLowerCase().includes('wsl')) {
            this.detectedEnvironment = EnvironmentType.WSL;
            return EnvironmentType.WSL;
          }
        } catch {
          // If we can't read /proc/version, continue with other checks
        }
        
        // Check for WSL environment variables
        if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
          this.detectedEnvironment = EnvironmentType.WSL;
          return EnvironmentType.WSL;
        }
        
        this.detectedEnvironment = EnvironmentType.LINUX;
        return EnvironmentType.LINUX;
      }
      
      if (process.platform === 'win32') {
        this.detectedEnvironment = EnvironmentType.WINDOWS;
        return EnvironmentType.WINDOWS;
      }
    } catch (error) {
      if (process.env.TEST_ENV === 'true') {
        console.warn('⚠️  Environment detection failed:', error);
      }
    }

    this.detectedEnvironment = EnvironmentType.UNKNOWN;
    return EnvironmentType.UNKNOWN;
  }

  /**
   * Convert WSL path to Windows path or vice versa
   */
  static convertPath(inputPath, targetEnv) {
    if (!inputPath) return inputPath;

    const currentEnv = this.detectEnvironment();
    
    // No conversion needed if environments match
    if (currentEnv === targetEnv) return inputPath;

    try {
      // WSL to Windows conversion
      if (currentEnv === EnvironmentType.WSL && targetEnv === EnvironmentType.WINDOWS) {
        if (inputPath.startsWith('/mnt/')) {
          // Convert /mnt/c/path to C:\path
          const drive = inputPath.charAt(5).toUpperCase();
          const windowsPath = inputPath.substring(7).replace(/\//g, '\\');
          return `${drive}:\\${windowsPath}`;
        }
      }
      
      // Windows to WSL conversion
      if (currentEnv === EnvironmentType.WINDOWS && targetEnv === EnvironmentType.WSL) {
        if (inputPath.match(/^[A-Za-z]:\\/)) {
          // Convert C:\path to /mnt/c/path
          const drive = inputPath.charAt(0).toLowerCase();
          const wslPath = inputPath.substring(3).replace(/\\/g, '/');
          return `/mnt/${drive}/${wslPath}`;
        }
      }
      
      // Use wslpath command if available (WSL environment)
      if (currentEnv === EnvironmentType.WSL) {
        try {
          if (targetEnv === EnvironmentType.WINDOWS) {
            const result = execSync(`wslpath -w "${inputPath}"`, { encoding: 'utf8' }).trim();
            return result;
          }
        } catch {
          // Fall through to manual conversion
        }
      }
    } catch (error) {
      if (process.env.TEST_ENV === 'true') {
        console.warn('⚠️  Path conversion failed:', error);
      }
    }

    return inputPath;
  }

  /**
   * Try multiple path variants for cross-platform compatibility
   */
  static tryMultiplePaths(basePath) {
    const paths = [];
    const currentEnv = this.detectEnvironment();
    
    // Always try the original path first
    paths.push(basePath);
    
    // Add converted paths
    if (currentEnv === EnvironmentType.WSL) {
      paths.push(this.convertPath(basePath, EnvironmentType.WINDOWS));
    } else if (currentEnv === EnvironmentType.WINDOWS) {
      paths.push(this.convertPath(basePath, EnvironmentType.WSL));
    }
    
    // Add common fallback patterns for contracts
    if (basePath.includes('Desktop/env/contracts')) {
      // Try both Windows and WSL variants
      paths.push('C:\\Users\\kubas\\Desktop\\env\\contracts\\.env');
      paths.push('/mnt/c/Users/kubas/Desktop/env/contracts/.env');
      paths.push('C:/Users/kubas/Desktop/env/contracts/.env');
    }
    
    // Remove duplicates while preserving order
    return [...new Set(paths)];
  }

  /**
   * Load environment variables from external path or fallback to local .env
   * Priority:
   * 1. ENV_FILE_PATH environment variable (with cross-platform path conversion)
   * 2. Platform-specific fallback paths
   * 3. Local .env file (development fallback)
   */
  static loadEnv() {
    if (this.isLoaded) {
      return;
    }

    const currentEnv = this.detectEnvironment();
    const externalEnvPath = process.env.ENV_FILE_PATH;
    
    if (process.env.TEST_ENV === 'true') {
      console.log(`🔍 Detected environment: ${currentEnv}`);
      if (externalEnvPath) {
        console.log(`📁 ENV_FILE_PATH provided: ${externalEnvPath}`);
      }
    }

    let pathsToTry = [];
    let pathSource = 'unknown';

    if (externalEnvPath) {
      // Try external path with cross-platform conversion
      pathsToTry = this.tryMultiplePaths(externalEnvPath);
      pathSource = 'external';
      
      if (process.env.TEST_ENV === 'true') {
        console.log(`🔄 Path variants to try:`, pathsToTry);
      }
    } else {
      // Fallback to local .env file
      pathsToTry = [path.resolve(process.cwd(), '.env')];
      pathSource = 'local';
    }

    // Try each path variant until one works
    let loadedSuccessfully = false;
    
    for (const envPath of pathsToTry) {
      try {
        const resolvedPath = path.resolve(envPath);
        
        if (fs.existsSync(resolvedPath)) {
          dotenv.config({ path: resolvedPath });
          this.loadedPath = resolvedPath;
          this.isLoaded = true;
          loadedSuccessfully = true;
          
          if (process.env.TEST_ENV === 'true') {
            console.log(`✅ Environment loaded from ${pathSource} path: ${resolvedPath}`);
          }
          break;
        } else {
          if (process.env.TEST_ENV === 'true') {
            console.log(`⏭️  Path does not exist: ${resolvedPath}`);
          }
        }
      } catch (error) {
        if (process.env.TEST_ENV === 'true') {
          console.warn(`⚠️  Failed to load from ${envPath}:`, error);
        }
        continue;
      }
    }

    // If external paths failed and we haven't tried local fallback yet
    if (!loadedSuccessfully && pathSource === 'external') {
      const localPath = path.resolve(process.cwd(), '.env');
      
      try {
        if (fs.existsSync(localPath)) {
          dotenv.config({ path: localPath });
          this.loadedPath = localPath;
          this.isLoaded = true;
          loadedSuccessfully = true;
          
          if (process.env.TEST_ENV === 'true') {
            console.log(`⚠️  External paths failed, using local fallback: ${localPath}`);
          }
        }
      } catch (error) {
        if (process.env.TEST_ENV === 'true') {
          console.error('❌ Local fallback also failed:', error);
        }
      }
    }

    // Final error reporting
    if (!loadedSuccessfully) {
      const message = pathSource === 'external' 
        ? `❌ No environment file found at any of the tried paths: ${pathsToTry.join(', ')}`
        : `❌ Environment file not found at ${pathsToTry[0]}`;
      
      console.warn(message);
    }
  }

  /**
   * Get the path of the loaded environment file
   */
  static getLoadedPath() {
    return this.loadedPath;
  }

  /**
   * Check if environment has been loaded
   */
  static isEnvironmentLoaded() {
    return this.isLoaded;
  }

  /**
   * Force reload environment (useful for testing)
   */
  static forceReload() {
    this.isLoaded = false;
    this.loadedPath = null;
    this.detectedEnvironment = null;
    this.loadEnv();
  }

  /**
   * Get the detected environment
   */
  static getEnvironment() {
    return this.detectEnvironment();
  }

  /**
   * Get platform-specific path suggestions for common .env locations
   */
  static getPathSuggestions() {
    const currentEnv = this.detectEnvironment();
    const suggestions = [];

    if (currentEnv === EnvironmentType.WSL) {
      suggestions.push('/mnt/c/Users/kubas/Desktop/env/contracts/.env');
      suggestions.push('./env');
    } else if (currentEnv === EnvironmentType.WINDOWS) {
      suggestions.push('C:\\Users\\kubas\\Desktop\\env\\contracts\\.env');
      suggestions.push('.\\env');
    }
    
    suggestions.push('.env');
    
    return suggestions;
  }

  /**
   * Set ENV_FILE_PATH with automatic path conversion
   */
  static setEnvPath(envPath) {
    const currentEnv = this.detectEnvironment();
    let convertedPath = envPath;
    
    // Try to convert path to current environment format
    if (currentEnv === EnvironmentType.WSL && envPath.match(/^[A-Za-z]:\\/)) {
      convertedPath = this.convertPath(envPath, EnvironmentType.WSL);
    } else if (currentEnv === EnvironmentType.WINDOWS && envPath.startsWith('/mnt/')) {
      convertedPath = this.convertPath(envPath, EnvironmentType.WINDOWS);
    }
    
    process.env.ENV_FILE_PATH = convertedPath;
    
    if (process.env.TEST_ENV === 'true') {
      console.log(`🔧 ENV_FILE_PATH set to: ${convertedPath}`);
      if (convertedPath !== envPath) {
        console.log(`   (converted from: ${envPath})`);
      }
    }
  }
}

// Auto-load environment when module is imported
EnvLoader.loadEnv();

module.exports = { EnvLoader, EnvironmentType };