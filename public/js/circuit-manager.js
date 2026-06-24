/**
 * Circuit Board Manager for BarelyCool Side Panels
 */

import { CONFIG } from './config.js';
import { isMobileDevice, handleError, throttle } from './utils.js';
import { CircuitBoard } from './effects/circuit-board.js';

export class CircuitManager {
  constructor() {
    this.leftScene = null;
    this.rightScene = null;
    this.leftCamera = null;
    this.rightCamera = null;
    this.leftRenderer = null;
    this.rightRenderer = null;
    this.leftCircuitBoard = null;
    this.rightCircuitBoard = null;
    
    this.isMobile = isMobileDevice();
    this.isDisposed = false;
    this.animationId = null;
    this.lastTime = 0;
    
    // Mouse tracking
    this.mouse = { x: 0, y: 0 };
    this.mouseInfluence = { x: 0, y: 0 };
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 16);
    this.handleResize = throttle(this.handleResize.bind(this), 250);
  }
  
  async init() {
    try {
      // Skip on mobile devices
      if (this.isMobile) {
        console.log('Mobile device detected - circuit board panels disabled');
        return;
      }
      
      // Get canvas elements
      const leftCanvas = document.getElementById('circuit-left-canvas');
      const rightCanvas = document.getElementById('circuit-right-canvas');
      
      if (!leftCanvas || !rightCanvas) {
        throw new Error('Circuit board canvas elements not found');
      }
      
      // Initialize scenes and cameras
      this.initScenes();
      this.initCameras();
      this.initRenderers(leftCanvas, rightCanvas);
      this.initCircuitBoards();
      this.initEventListeners();
      
      // Start animation
      this.animate();
      
      console.log('Circuit board panels initialized successfully');
      
    } catch (error) {
      handleError(error, 'Circuit board initialization');
    }
  }
  
  initScenes() {
    this.leftScene = new THREE.Scene();
    this.rightScene = new THREE.Scene();
    
    // Set background color
    this.leftScene.background = new THREE.Color(CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.PCB_BASE);
    this.rightScene.background = new THREE.Color(CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.PCB_BASE);
  }
  
  initCameras() {
    const panelWidth = window.innerWidth <= 1200 ? 100 : CONFIG.CIRCUIT_BOARD.PANEL_WIDTH;
    const aspect = panelWidth / window.innerHeight;
    
    // Orthographic cameras for 2D circuit board view
    this.leftCamera = new THREE.OrthographicCamera(
      -panelWidth / 2, panelWidth / 2,
      window.innerHeight / 2, -window.innerHeight / 2,
      0.1, 1000
    );
    this.leftCamera.position.z = 10;
    
    this.rightCamera = new THREE.OrthographicCamera(
      -panelWidth / 2, panelWidth / 2,
      window.innerHeight / 2, -window.innerHeight / 2,
      0.1, 1000
    );
    this.rightCamera.position.z = 10;
  }
  
  initRenderers(leftCanvas, rightCanvas) {
    // Left panel renderer
    this.leftRenderer = new THREE.WebGLRenderer({
      canvas: leftCanvas,
      alpha: true,
      antialias: !this.isMobile,
      powerPreference: "high-performance"
    });
    
    const leftPanelWidth = window.innerWidth <= 1200 ? 100 : CONFIG.CIRCUIT_BOARD.PANEL_WIDTH;
    this.leftRenderer.setSize(leftPanelWidth, window.innerHeight);
    this.leftRenderer.setClearColor(0x000000, 0);
    
    // Right panel renderer
    this.rightRenderer = new THREE.WebGLRenderer({
      canvas: rightCanvas,
      alpha: true,
      antialias: !this.isMobile,
      powerPreference: "high-performance"
    });
    
    const rightPanelWidth = window.innerWidth <= 1200 ? 100 : CONFIG.CIRCUIT_BOARD.PANEL_WIDTH;
    this.rightRenderer.setSize(rightPanelWidth, window.innerHeight);
    this.rightRenderer.setClearColor(0x000000, 0);
    
    // Set pixel ratio
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5); // Lower for side panels
    this.leftRenderer.setPixelRatio(pixelRatio);
    this.rightRenderer.setPixelRatio(pixelRatio);
  }
  
  initCircuitBoards() {
    const panelWidth = window.innerWidth <= 1200 ? 100 : CONFIG.CIRCUIT_BOARD.PANEL_WIDTH;
    const panelHeight = window.innerHeight;
    
    // Create circuit boards
    this.leftCircuitBoard = new CircuitBoard(this.leftScene, panelWidth, panelHeight, 'left');
    this.rightCircuitBoard = new CircuitBoard(this.rightScene, panelWidth, panelHeight, 'right');
  }
  
  initEventListeners() {
    // Mouse movement tracking
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    
    // Window resize
    window.addEventListener('resize', this.handleResize, { passive: true });
    
    // Page visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else {
        this.resumeAnimation();
      }
    });
    
    // Page unload cleanup
    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
  }
  
  handleMouseMove(event) {
    if (this.isDisposed) return;
    
    // Normalize mouse coordinates
    this.mouse.x = event.clientX / window.innerWidth;
    this.mouse.y = event.clientY / window.innerHeight;
    
    // Calculate influence on side panels
    this.mouseInfluence.x = (this.mouse.x - 0.5) * 2; // -1 to 1
    this.mouseInfluence.y = (this.mouse.y - 0.5) * 2; // -1 to 1
  }
  
  handleResize() {
    if (this.isDisposed) return;
    
    try {
      const panelWidth = window.innerWidth <= 1200 ? 100 : CONFIG.CIRCUIT_BOARD.PANEL_WIDTH;
      const panelHeight = window.innerHeight;
      
      // Update cameras
      this.leftCamera.left = -panelWidth / 2;
      this.leftCamera.right = panelWidth / 2;
      this.leftCamera.top = panelHeight / 2;
      this.leftCamera.bottom = -panelHeight / 2;
      this.leftCamera.updateProjectionMatrix();
      
      this.rightCamera.left = -panelWidth / 2;
      this.rightCamera.right = panelWidth / 2;
      this.rightCamera.top = panelHeight / 2;
      this.rightCamera.bottom = -panelHeight / 2;
      this.rightCamera.updateProjectionMatrix();
      
      // Update renderer sizes
      this.leftRenderer.setSize(panelWidth, panelHeight);
      this.rightRenderer.setSize(panelWidth, panelHeight);
      
      // Recreate circuit boards with new dimensions
      if (this.leftCircuitBoard) {
        this.leftCircuitBoard.dispose();
        this.leftCircuitBoard = new CircuitBoard(this.leftScene, panelWidth, panelHeight, 'left');
      }
      
      if (this.rightCircuitBoard) {
        this.rightCircuitBoard.dispose();
        this.rightCircuitBoard = new CircuitBoard(this.rightScene, panelWidth, panelHeight, 'right');
      }
      
    } catch (error) {
      handleError(error, 'Circuit board resize');
    }
  }
  
  animate(currentTime = 0) {
    if (this.isDisposed) return;
    
    try {
      this.animationId = requestAnimationFrame(this.animate);
      
      const deltaTime = (currentTime - this.lastTime) * 0.001; // Convert to seconds
      this.lastTime = currentTime;
      
      // Update circuit boards
      if (this.leftCircuitBoard) {
        this.leftCircuitBoard.update(deltaTime, this.mouseInfluence);
      }
      
      if (this.rightCircuitBoard) {
        this.rightCircuitBoard.update(deltaTime, this.mouseInfluence);
      }
      
      // Render scenes
      if (this.leftRenderer && this.leftScene && this.leftCamera) {
        this.leftRenderer.render(this.leftScene, this.leftCamera);
      }
      
      if (this.rightRenderer && this.rightScene && this.rightCamera) {
        this.rightRenderer.render(this.rightScene, this.rightCamera);
      }
      
    } catch (error) {
      handleError(error, 'Circuit board animation');
      this.pauseAnimation();
    }
  }
  
  pauseAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  resumeAnimation() {
    if (!this.animationId && !this.isDisposed) {
      this.animate();
    }
  }
  
  dispose() {
    if (this.isDisposed) return;
    
    console.log('Disposing circuit board panels');
    
    this.isDisposed = true;
    
    // Stop animation
    this.pauseAnimation();
    
    // Remove event listeners
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose circuit boards
    if (this.leftCircuitBoard) {
      this.leftCircuitBoard.dispose();
    }
    
    if (this.rightCircuitBoard) {
      this.rightCircuitBoard.dispose();
    }
    
    // Dispose renderers
    if (this.leftRenderer) {
      this.leftRenderer.dispose();
    }
    
    if (this.rightRenderer) {
      this.rightRenderer.dispose();
    }
    
    // Clear scenes
    if (this.leftScene) {
      this.leftScene.clear();
    }
    
    if (this.rightScene) {
      this.rightScene.clear();
    }
    
    console.log('Circuit board panels disposed');
  }
}