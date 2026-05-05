/**
 * Wireframe Geometric Shapes Effect for BarelyCool
 */

import { CONFIG } from '../config.js';
import { randomFloat, randomPosition } from '../utils.js';

export class WireframeShapes {
  constructor(scene, isMobile = false) {
    this.scene = scene;
    this.wireframeObjects = [];
    this.wireframeCount = isMobile ? CONFIG.MOBILE_WIREFRAME_COUNT : CONFIG.DESKTOP_WIREFRAME_COUNT;
    
    // Pre-allocate vectors for performance
    this.tempVector = new THREE.Vector3();
    this.mouseInfluence = new THREE.Vector3();
    
    this.init();
  }
  
  init() {
    try {
      // Create shared geometries
      const geometries = [
        new THREE.OctahedronGeometry(CONFIG.WIREFRAME_SIZES.octahedron),
        new THREE.IcosahedronGeometry(CONFIG.WIREFRAME_SIZES.icosahedron),
        new THREE.TetrahedronGeometry(CONFIG.WIREFRAME_SIZES.tetrahedron)
      ];
      
      for (let i = 0; i < this.wireframeCount; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshBasicMaterial({
          color: CONFIG.COLORS.MATRIX_GREEN,
          wireframe: true,
          transparent: true,
          opacity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        const position = randomPosition();
        mesh.position.set(position.x, position.y * 0.5, position.z); // Keep closer to center
        
        mesh.userData = {
          rotationSpeed: {
            x: randomFloat(-CONFIG.ROTATION_SPEED_MAX, CONFIG.ROTATION_SPEED_MAX),
            y: randomFloat(-CONFIG.ROTATION_SPEED_MAX, CONFIG.ROTATION_SPEED_MAX),
            z: randomFloat(-CONFIG.ROTATION_SPEED_MAX, CONFIG.ROTATION_SPEED_MAX)
          },
          originalOpacity: material.opacity,
          baseRotationSpeed: {
            x: mesh.userData?.rotationSpeed?.x || 0,
            y: mesh.userData?.rotationSpeed?.y || 0,
            z: mesh.userData?.rotationSpeed?.z || 0
          }
        };
        
        // Store base rotation speeds after userData is set
        mesh.userData.baseRotationSpeed = {
          x: mesh.userData.rotationSpeed.x,
          y: mesh.userData.rotationSpeed.y,
          z: mesh.userData.rotationSpeed.z
        };
        
        this.wireframeObjects.push(mesh);
        this.scene.add(mesh);
      }
    } catch (error) {
      console.error('Failed to initialize wireframe shapes:', error);
    }
  }
  
  update(mouseInfluence) {
    this.mouseInfluence.copy(mouseInfluence);
    
    this.wireframeObjects.forEach(obj => {
      // Update rotation
      obj.rotation.x += obj.userData.rotationSpeed.x;
      obj.rotation.y += obj.userData.rotationSpeed.y;
      obj.rotation.z += obj.userData.rotationSpeed.z;
      
      // Mouse influence
      this.tempVector.set(this.mouseInfluence.x, this.mouseInfluence.y, obj.position.z);
      const distance = obj.position.distanceTo(this.tempVector);
      
      if (distance < CONFIG.WIREFRAME_INFLUENCE_RADIUS) {
        const influence = (CONFIG.WIREFRAME_INFLUENCE_RADIUS - distance) / CONFIG.WIREFRAME_INFLUENCE_RADIUS;
        
        // Enhance glow and spin faster
        obj.material.opacity = Math.min(0.8, obj.userData.originalOpacity + influence * 0.5);
        obj.userData.rotationSpeed.x = obj.userData.baseRotationSpeed.x * (1 + influence * 2);
        obj.userData.rotationSpeed.y = obj.userData.baseRotationSpeed.y * (1 + influence * 2);
        obj.userData.rotationSpeed.z = obj.userData.baseRotationSpeed.z * (1 + influence * 2);
      } else {
        // Return to original state gradually
        obj.material.opacity = Math.max(obj.userData.originalOpacity, obj.material.opacity - 0.01);
        obj.userData.rotationSpeed.x *= 0.99;
        obj.userData.rotationSpeed.y *= 0.99;
        obj.userData.rotationSpeed.z *= 0.99;
        
        // Ensure minimum rotation speed
        const minSpeed = 0.001;
        if (Math.abs(obj.userData.rotationSpeed.x) < minSpeed) {
          obj.userData.rotationSpeed.x = obj.userData.baseRotationSpeed.x;
        }
        if (Math.abs(obj.userData.rotationSpeed.y) < minSpeed) {
          obj.userData.rotationSpeed.y = obj.userData.baseRotationSpeed.y;
        }
        if (Math.abs(obj.userData.rotationSpeed.z) < minSpeed) {
          obj.userData.rotationSpeed.z = obj.userData.baseRotationSpeed.z;
        }
      }
    });
  }
  
  dispose() {
    this.wireframeObjects.forEach(obj => {
      obj.geometry.dispose();
      obj.material.dispose();
      this.scene.remove(obj);
    });
    this.wireframeObjects = [];
  }
  
  setMouseInfluence(x, y) {
    this.mouseInfluence.set(x * 2, y * 2, 0);
  }
}