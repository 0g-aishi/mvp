/**
 * @fileoverview JSON Serialization Utilities with BigInt Support
 * @description Provides safe JSON serialization functions that handle BigInt values from blockchain contracts
 */

/**
 * Custom JSON replacer function that converts BigInt values to strings
 * @param key - The property key being stringified
 * @param value - The property value being stringified
 * @returns The value to be serialized, with BigInt converted to string
 */
export function bigIntReplacer(key: string, value: any): any {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

/**
 * Safe JSON.stringify that handles BigInt values by converting them to strings
 * @param value - The value to stringify
 * @param space - Optional space parameter for formatting (default: undefined for compact output)
 * @returns JSON string with BigInt values converted to strings
 */
export function safeJsonStringify(value: any, space?: string | number): string {
  return JSON.stringify(value, bigIntReplacer, space);
}

/**
 * Safe JSON.stringify with pretty formatting (2-space indentation)
 * Useful for file storage and debugging
 * @param value - The value to stringify
 * @returns Pretty-formatted JSON string with BigInt values converted to strings
 */
export function safeJsonStringifyPretty(value: any): string {
  return JSON.stringify(value, bigIntReplacer, 2);
}

/**
 * Recursively converts BigInt values to strings in an object
 * This is useful when you need to transform data before passing it to other functions
 * @param obj - The object to transform
 * @returns A new object with BigInt values converted to strings
 */
export function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  
  return obj;
}
