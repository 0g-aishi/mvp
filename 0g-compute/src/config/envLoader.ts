/**
 * @fileoverview Cross-platform environment variable loader with automatic path conversion
 * @description Handles environment loading for WSL, Windows, and Linux with intelligent path resolution.
 * Supports automatic conversion between Windows and WSL paths, multiple fallback locations,
 * and provides platform-specific path suggestions for configuration files.
 */

const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const { createLogger } = require('../lib/logger');

const log = createLogger('EnvLoader');

type Environment = 'wsl' | 'windows' | 'linux' | 'unknown';

class EnvLoader{
  private static isLoaded = false;
  private static loadedPath: string | null = null;
  private static detectedEnvironment: Environment | null = null;

  /**
   * Detect the current environment (WSL, Windows, Linux)
   */
  private static detectEnvironment(): Environment {
    if (this.detectedEnvironment) {
      return this.detectedEnvironment;
    }

    try {
      // Check if we're in WSL
      if (process.platform === 'linux') {
        try {
          const processorVersionInfo = fs.readFileSync('/proc/version', 'utf8');
          if (processorVersionInfo.toLowerCase().includes('microsoft') || processorVersionInfo.toLowerCase().includes('wsl')) {
            this.detectedEnvironment = 'wsl';
            return 'wsl';
          }
        } catch {
          // If we can't read /proc/version, continue with other checks
        }
        
        // Check for WSL environment variables
        if (process.env.WSL_DISTRO_NAME || process.env.WSLENV) {
          this.detectedEnvironment = 'wsl';
          return 'wsl';
        }
        
        this.detectedEnvironment = 'linux';
        return 'linux';
      }
      
      if (process.platform === 'win32') {
        this.detectedEnvironment = 'windows';
        return 'windows';
      }
    } catch (error) {
      if (process.env.TEST_ENV === 'true') {
        log.warn('Environment detection failed', { error });
      }
    }

    this.detectedEnvironment = 'unknown';
    return 'unknown';
  }

  /**
   * Convert WSL path to Windows path or vice versa
   */
  private static convertPath(inputPath: string, targetEnv: Environment): string {
    if (!inputPath) return inputPath;

    const currentEnv = this.detectEnvironment();
    
    // No conversion needed if environments match
    if (currentEnv === targetEnv) return inputPath;

    try {
      // WSL to Windows conversion
      if (currentEnv === 'wsl' && targetEnv === 'windows') {
        if (inputPath.startsWith('/mnt/')) {
          // Convert /mnt/c/path to C:\path
          const drive = inputPath.charAt(5).toUpperCase();
          const windowsPath = inputPath.substring(7).replace(/\//g, '\\');
          return `${drive}:\\${windowsPath}`;
        }
      }
      
      // Windows to WSL conversion
      if (currentEnv === 'windows' && targetEnv === 'wsl') {
        if (inputPath.match(/^[A-Za-z]:\\/)) {
          // Convert C:\path to /mnt/c/path
          const drive = inputPath.charAt(0).toLowerCase();
          const wslPath = inputPath.substring(3).replace(/\\/g, '/');
          return `/mnt/${drive}/${wslPath}`;
        }
      }
      
      // Use wslpath command if available (WSL environment)
      if (currentEnv === 'wsl') {
        try {
          if (targetEnv === 'windows') {
            const result = execSync(`wslpath -w "${inputPath}"`, { encoding: 'utf8' }).trim();
            return result;
          }
        } catch {
          // Fall through to manual conversion
        }
      }
    } catch (error) {
      if (process.env.TEST_ENV === 'true') {
        log.warn('Path conversion failed', { error });
      }
    }

    return inputPath;
  }

  /**
   * Try multiple path variants for cross-platform compatibility
   */
  private static tryMultiplePaths(basePath: string): string[] {
    const paths: string[] = [];
    const currentEnv = this.detectEnvironment();
    
    // Always try the original path first
    paths.push(basePath);
    
    // Add converted paths
    if (currentEnv === 'wsl') {
      paths.push(this.convertPath(basePath, 'windows'));
    } else if (currentEnv === 'windows') {
      paths.push(this.convertPath(basePath, 'wsl'));
    }
    
    // Add common fallback patterns
    if (basePath.includes('Desktop/env/dreamscape')) {
      // Try both Windows and WSL variants
      paths.push('C:\\Users\\kubas\\Desktop\\env\\dreamscape\\.env');
      paths.push('/mnt/c/Users/kubas/Desktop/env/dreamscape/.env');
      paths.push('C:/Users/kubas/Desktop/env/dreamscape/.env');
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
  public static loadEnv(): void {
    if (this.isLoaded) {
      return;
    }

    const currentEnv = this.detectEnvironment();
    const externalEnvPath = process.env.ENV_FILE_PATH;

    if (process.env.TEST_ENV === 'true') {
      log.info('Detected environment', { environment: currentEnv });
      if (externalEnvPath) {
        log.info('ENV_FILE_PATH provided', { path: externalEnvPath });
      }
    }

    let pathsToTry: string[] = [];
    let pathSource = 'unknown';

    if (externalEnvPath) {
      // Try external path with cross-platform conversion
      pathsToTry = this.tryMultiplePaths(externalEnvPath);
      pathSource = 'external';

      if (process.env.TEST_ENV === 'true') {
        log.info('Path variants to try', { paths: pathsToTry });
      }
    } else{
      // Fallback to local .env file (cwd, then package directory — npm workspaces may differ)
      pathsToTry = [
        path.resolve(process.cwd(), '.env'),
        path.resolve(__dirname, '../../.env'),
      ];
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
            log.info('Environment loaded', { source: pathSource, path: resolvedPath });
          }
          break;
        } else {
          if (process.env.TEST_ENV === 'true') {
            log.info('Path does not exist', { path: resolvedPath });
          }
        }
      } catch (error) {
        if (process.env.TEST_ENV === 'true') {
          log.warn('Failed to load', { path: envPath, error });
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
            log.warn('External paths failed, using local fallback', { path: localPath });
          }
        }
      } catch (error) {
        if (process.env.TEST_ENV === 'true') {
          log.error('Local fallback also failed', { error });
        }
      }
    }

    // Final error reporting
    if (!loadedSuccessfully) {
      const message = pathSource === 'external'
        ? `No environment file found at any of the tried paths: ${pathsToTry.join(', ')}`
        : `Environment file not found at ${pathsToTry[0]}`;

      log.warn(message);
    }
  }

  /**
   * Get the path of the loaded environment file
   */
  public static getLoadedPath(): string | null {
    return this.loadedPath;
  }

  /**
   * Check if environment has been loaded
   */
  public static isEnvironmentLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Force reload environment (useful for testing)
   */
  public static forceReload(): void {
    this.isLoaded = false;
    this.loadedPath = null;
    this.detectedEnvironment = null;
    this.loadEnv();
  }

  /**
   * Get the detected environment
   */
  public static getEnvironment(): Environment {
    return this.detectEnvironment();
  }

  /**
   * Get platform-specific path suggestions for common .env locations
   */
  public static getPathSuggestions(): string[] {
    const currentEnv = this.detectEnvironment();
    const suggestions: string[] = [];

    if (currentEnv === 'wsl') {
      suggestions.push('/mnt/c/Users/kubas/Desktop/env/dreamscape/.env');
      suggestions.push('./env');
    } else if (currentEnv === 'windows') {
      suggestions.push('C:\\Users\\kubas\\Desktop\\env\\dreamscape\\.env');
      suggestions.push('.\\env');
    }
    
    suggestions.push('.env');
    
    return suggestions;
  }

  /**
   * Set ENV_FILE_PATH with automatic path conversion
   */
  public static setEnvPath(envPath: string): void {
    const currentEnv = this.detectEnvironment();
    let convertedPath = envPath;
    
    // Try to convert path to current environment format
    if (currentEnv === 'wsl' && envPath.match(/^[A-Za-z]:\\/)) {
      convertedPath = this.convertPath(envPath, 'wsl');
    } else if (currentEnv === 'windows' && envPath.startsWith('/mnt/')) {
      convertedPath = this.convertPath(envPath, 'windows');
    }
    
    process.env.ENV_FILE_PATH = convertedPath;

    if (process.env.TEST_ENV === 'true') {
      log.info('ENV_FILE_PATH set', {
        path: convertedPath,
        converted: convertedPath !== envPath ? `from ${envPath}` : undefined
      });
    }
  }
}

// Auto-load environment when module is required
EnvLoader.loadEnv();

module.exports = { EnvLoader };