/**
 * Main application entry point for BarelyCool 3D Effects
 */

import { SceneManager } from './scene-manager.js';
import { CircuitManager } from './circuit-manager.js';
import { isMobileDevice, isWebGLSupported, handleError } from './utils.js';

class BarelyCoolApp {
  constructor() {
    this.sceneManager = null;
    this.circuitManager = null;
    this.initialized = false;
  }
  
  async init() {
    try {
      console.log('Initializing BarelyCool 3D Experience...');
      
      // Check device capabilities
      const isMobile = isMobileDevice();
      const hasWebGL = isWebGLSupported();
      
      console.log(`Device: ${isMobile ? 'Mobile' : 'Desktop'}, WebGL: ${hasWebGL ? 'Supported' : 'Not supported'}`);
      
      // Skip 3D effects on mobile or if WebGL is not supported
      if (isMobile) {
        console.log('Mobile device detected - 3D effects disabled for performance');
        this.addMobileFallback();
        return;
      }
      
      if (!hasWebGL) {
        console.warn('WebGL not supported - 3D effects disabled');
        this.addWebGLFallback();
        return;
      }
      
      // Initialize 3D scene
      this.sceneManager = new SceneManager();
      await this.sceneManager.init();
      
      // Initialize circuit board panels
      this.circuitManager = new CircuitManager();
      await this.circuitManager.init();
      
      this.initialized = true;
      document.body.classList.add('webgl-enabled');
      
    } catch (error) {
      handleError(error, 'Application initialization');
      this.addErrorFallback();
    }
  }
  
  addMobileFallback() {
    document.body.classList.add('mobile-device');
    // Mobile users get enhanced CSS animations instead
    console.log('Enhanced CSS animations enabled for mobile');
  }
  
  addWebGLFallback() {
    document.body.classList.add('no-webgl');
    // Add fallback visual effects here
    console.log('CSS-only effects enabled as WebGL fallback');
  }
  
  addErrorFallback() {
    document.body.classList.add('effects-disabled');
    // Minimal fallback for critical errors
    console.log('All effects disabled due to errors');
  }
  
  dispose() {
    if (this.sceneManager) {
      this.sceneManager.dispose();
      this.sceneManager = null;
    }
    
    if (this.circuitManager) {
      this.circuitManager.dispose();
      this.circuitManager = null;
    }
    
    this.initialized = false;
  }
}

// Initialize application when DOM is ready
let app = null;

function initializeApp() {
  app = new BarelyCoolApp();
  app.init();
}

// Wait for DOM and Three.js to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // DOM already loaded
  if (typeof THREE !== 'undefined') {
    initializeApp();
  } else {
    // Wait for Three.js to load
    window.addEventListener('load', initializeApp);
  }
}

// Global cleanup
window.addEventListener('beforeunload', () => {
  if (app) {
    app.dispose();
  }
});

// Export for debugging
window.BarelyCoolApp = BarelyCoolApp;