/**
 * Digital Rain Effect for BarelyCool
 */

import { CONFIG } from '../config.js';
import { randomFloat, randomPosition } from '../utils.js';

export class DigitalRain {
  constructor(scene, isMobile = false) {
    this.scene = scene;
    this.rainDrops = [];
    this.rainCount = isMobile ? CONFIG.MOBILE_PARTICLE_COUNT : CONFIG.DESKTOP_PARTICLE_COUNT;
    
    // Pre-allocate vectors for performance
    this.tempVector = new THREE.Vector3();
    this.mouseInfluence = new THREE.Vector3();
    
    this.init();
  }
  
  init() {
    try {
      // Shared geometry for performance
      const geometry = new THREE.BoxGeometry(
        CONFIG.RAIN_DROP_SIZE.width,
        CONFIG.RAIN_DROP_SIZE.height,
        CONFIG.RAIN_DROP_SIZE.depth
      );
      
      for (let i = 0; i < this.rainCount; i++) {
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setHSL(0.3, 1, Math.random() * 0.5 + 0.5),
          transparent: true,
          opacity: Math.random() * 0.7 + 0.3
        });
        
        const drop = new THREE.Mesh(geometry, material);
        const position = randomPosition();
        drop.position.set(position.x, position.y, position.z);
        
        drop.userData = {
          speed: randomFloat(CONFIG.RAIN_SPEED_MIN, CONFIG.RAIN_SPEED_MAX),
          originalY: drop.position.y,
          originalOpacity: material.opacity
        };
        
        this.rainDrops.push(drop);
        this.scene.add(drop);
      }
    } catch (error) {
      console.error('Failed to initialize digital rain:', error);
    }
  }
  
  update(mouseInfluence) {
    this.mouseInfluence.copy(mouseInfluence);
    
    this.rainDrops.forEach(drop => {
      // Update position
      drop.position.y -= drop.userData.speed;
      
      // Reset position when drop goes below scene
      if (drop.position.y < -10) {
        drop.position.y = drop.userData.originalY;
        const newPos = randomPosition();
        drop.position.x = newPos.x;
        drop.position.z = newPos.z;
      }
      
      // Mouse influence
      this.tempVector.set(this.mouseInfluence.x, drop.position.y, 0);
      const distance = drop.position.distanceTo(this.tempVector);
      
      if (distance < CONFIG.MOUSE_INFLUENCE_RADIUS) {
        const influence = (CONFIG.MOUSE_INFLUENCE_RADIUS - distance) / CONFIG.MOUSE_INFLUENCE_RADIUS;
        drop.position.x += (this.mouseInfluence.x - drop.position.x) * influence * 0.02;
        
        // Enhance glow effect
        drop.material.opacity = Math.min(1, drop.userData.originalOpacity + influence * 0.5);
      } else {
        // Return to original opacity
        drop.material.opacity = drop.userData.originalOpacity;
      }
    });
  }
  
  dispose() {
    this.rainDrops.forEach(drop => {
      drop.geometry.dispose();
      drop.material.dispose();
      this.scene.remove(drop);
    });
    this.rainDrops = [];
  }
  
  setMouseInfluence(x, y) {
    this.mouseInfluence.set(x * 2, y * 2, 0);
  }
}