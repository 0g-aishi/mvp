/**
 * @fileoverview Utility function for concatenating class names
 * @description Combines multiple class names, filtering out falsy values
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}