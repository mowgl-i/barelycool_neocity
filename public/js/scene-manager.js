/**
 * Scene Manager for BarelyCool 3D Effects
 */

import { CONFIG } from './config.js';
import { isMobileDevice, isWebGLSupported, handleError, throttle } from './utils.js';
import { DigitalRain } from './effects/digital-rain.js';
import { WireframeShapes } from './effects/wireframe-shapes.js';

export class SceneManager {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.digitalRain = null;
    this.wireframeShapes = null;
    this.mouse = new THREE.Vector2();
    this.mouseInfluence = new THREE.Vector3();
    this.isMobile = isMobileDevice();
    this.animationId = null;
    this.isDisposed = false;
    
    // Bind methods
    this.animate = this.animate.bind(this);
    this.handleMouseMove = throttle(this.handleMouseMove.bind(this), 16); // ~60fps
    this.handleResize = throttle(this.handleResize.bind(this), 250);
    this.handleContextLoss = this.handleContextLoss.bind(this);
    this.handleContextRestore = this.handleContextRestore.bind(this);
  }
  
  async init() {
    try {
      // Check WebGL support
      if (!isWebGLSupported()) {
        throw new Error('WebGL not supported');
      }
      
      // Get canvas element
      const canvas = document.getElementById('three-canvas');
      if (!canvas) {
        throw new Error('Canvas element not found');
      }
      
      // Initialize Three.js components
      this.initScene();
      this.initCamera();
      this.initRenderer(canvas);
      this.initEffects();
      this.initEventListeners();
      
      // Start animation loop
      this.animate();
      
      console.log('BarelyCool 3D Scene initialized successfully');
      
    } catch (error) {
      handleError(error, 'Scene initialization');
    }
  }
  
  initScene() {
    this.scene = new THREE.Scene();
  }
  
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.CAMERA.fov,
      window.innerWidth / window.innerHeight,
      CONFIG.CAMERA.near,
      CONFIG.CAMERA.far
    );
    this.camera.position.set(
      CONFIG.CAMERA.position.x,
      CONFIG.CAMERA.position.y,
      CONFIG.CAMERA.position.z
    );
  }
  
  initRenderer(canvas) {
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: !this.isMobile,
      powerPreference: "high-performance"
    });
    
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 0);
    
    // Optimize pixel ratio based on device
    const pixelRatio = this.isMobile ? 
      Math.min(window.devicePixelRatio, 1.5) : 
      Math.min(window.devicePixelRatio, 2);
    this.renderer.setPixelRatio(pixelRatio);
    
    // Add context loss/restore handlers
    const context = this.renderer.getContext();
    context.addEventListener('webglcontextlost', this.handleContextLoss);
    context.addEventListener('webglcontextrestored', this.handleContextRestore);
  }
  
  initEffects() {
    // Skip effects on mobile to preserve battery
    if (this.isMobile) {
      console.log('Mobile device detected, effects optimized');
    }
    
    this.digitalRain = new DigitalRain(this.scene, this.isMobile);
    this.wireframeShapes = new WireframeShapes(this.scene, this.isMobile);
  }
  
  initEventListeners() {
    // Mouse move event
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    
    // Window resize event
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
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.mouseInfluence.set(this.mouse.x, this.mouse.y, 0);
  }
  
  handleResize() {
    if (this.isDisposed) return;
    
    try {
      // Update camera aspect ratio
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // Update renderer size
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    } catch (error) {
      handleError(error, 'Window resize');
    }
  }
  
  handleContextLoss(event) {
    event.preventDefault();
    console.warn('WebGL context lost');
    this.pauseAnimation();
  }
  
  handleContextRestore() {
    console.log('WebGL context restored');
    try {
      // Reinitialize effects
      this.initEffects();
      this.resumeAnimation();
    } catch (error) {
      handleError(error, 'Context restore');
    }
  }
  
  animate() {
    if (this.isDisposed) return;
    
    try {
      this.animationId = requestAnimationFrame(this.animate);
      
      // Update effects
      if (this.digitalRain) {
        this.digitalRain.update(this.mouseInfluence);
      }
      
      if (this.wireframeShapes) {
        this.wireframeShapes.update(this.mouseInfluence);
      }
      
      // Render scene
      this.renderer.render(this.scene, this.camera);
      
    } catch (error) {
      handleError(error, 'Animation loop');
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
    
    console.log('Disposing BarelyCool 3D Scene');
    
    this.isDisposed = true;
    
    // Stop animation
    this.pauseAnimation();
    
    // Remove event listeners
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    
    // Dispose effects
    if (this.digitalRain) {
      this.digitalRain.dispose();
    }
    
    if (this.wireframeShapes) {
      this.wireframeShapes.dispose();
    }
    
    // Dispose renderer
    if (this.renderer) {
      const context = this.renderer.getContext();
      context.removeEventListener('webglcontextlost', this.handleContextLoss);
      context.removeEventListener('webglcontextrestored', this.handleContextRestore);
      this.renderer.dispose();
    }
    
    // Clear scene
    if (this.scene) {
      this.scene.clear();
    }
    
    console.log('BarelyCool 3D Scene disposed');
  }
}