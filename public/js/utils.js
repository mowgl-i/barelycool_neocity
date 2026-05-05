/**
 * Utility functions for BarelyCool 3D effects
 */

import { CONFIG } from './config.js';

/**
 * Detect if device is mobile
 * @returns {boolean}
 */
export function isMobileDevice() {
  return window.innerWidth <= CONFIG.MOBILE_BREAKPOINT || 
         /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Check if WebGL is supported
 * @returns {boolean}
 */
export function isWebGLSupported() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && 
              (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Generate random float between min and max
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random position within scene bounds
 * @returns {Object} {x, y, z}
 */
export function randomPosition() {
  const bounds = CONFIG.SCENE_BOUNDS;
  return {
    x: (Math.random() - 0.5) * bounds.width,
    y: Math.random() * bounds.height + 10,
    z: (Math.random() - 0.5) * bounds.depth
  };
}

/**
 * Clamp value between min and max
 * @param {number} value 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Handle error with fallback
 * @param {Error} error 
 * @param {string} context 
 */
export function handleError(error, context) {
  console.error(`BarelyCool 3D Error in ${context}:`, error);
  
  // Hide canvas on critical errors
  const canvas = document.getElementById('three-canvas');
  if (canvas) {
    canvas.style.display = 'none';
  }
  
  // Provide fallback experience
  document.body.classList.add('no-webgl');
}

/**
 * Throttle function execution
 * @param {Function} func 
 * @param {number} limit 
 * @returns {Function}
 */
export function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}