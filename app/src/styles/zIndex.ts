/**
 * Centralized z-index management system
 * Ensures consistent layering across the application
 */

export const zIndex = {
  // Base layers
  background: -1,
  backgroundOverlay: 0,
  
  // Content layers
  base: 1,
  dropdown: 10,
  sticky: 20,
  
  // Overlays and modals
  sidebarOverlay: 40,
  sidebar: 50,
  header: 60,
  
  // Popups and tooltips
  tooltip: 100,
  popover: 200,
  
  // Modal layers
  modal: 1000,
  modalOverlay: 999,
  terminal: 1000,
  
  // Critical UI elements
  notification: 2000,
  splash: 9999,
  
  // Debug/Development
  debug: 10000,
} as const;

export type ZIndexKey = keyof typeof zIndex;