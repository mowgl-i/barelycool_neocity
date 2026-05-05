/**
 * Circuit Board Generator for BarelyCool Side Panels
 */

import { CONFIG } from '../config.js';
import { randomFloat, clamp } from '../utils.js';

export class CircuitBoard {
  constructor(scene, width, height, side = 'left') {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.side = side;
    
    // Circuit elements
    this.traces = [];
    this.nodes = [];
    this.components = [];
    this.dataPackets = [];
    this.glitchElements = [];
    
    // Animation properties
    this.time = 0;
    this.pulseOffset = Math.random() * Math.PI * 2;
    
    // Glitch properties
    this.glitchTime = 0;
    this.nextGlitchTime = Math.random() * 5 + 2; // Random glitch every 2-7 seconds
    this.isGlitching = false;
    this.glitchDuration = 0;
    
    this.init();
  }
  
  init() {
    this.createPCBBase();
    this.generateTraces();
    this.generateNodes();
    this.generateComponents();
    this.generateDataPackets();
    this.generateGlitchElements();
  }
  
  createPCBBase() {
    // Create the base PCB substrate
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.PCB_BASE,
      transparent: true,
      opacity: 0.9
    });
    
    const pcbBase = new THREE.Mesh(geometry, material);
    pcbBase.position.z = -0.1;
    this.scene.add(pcbBase);
  }
  
  generateTraces() {
    const traceCount = Math.floor(this.height / 8);
    
    for (let i = 0; i < traceCount; i++) {
      const trace = this.createTrace(i, traceCount);
      this.traces.push(trace);
    }
  }
  
  createTrace(index, total) {
    const y = (index / (total - 1)) * this.height - this.height / 2;
    const points = [];
    const segmentCount = CONFIG.CIRCUIT_BOARD.TRACE_SEGMENTS;
    
    // Create organic trace path with curves and branches
    for (let i = 0; i <= segmentCount; i++) {
      const x = (i / segmentCount) * this.width - this.width / 2;
      const noise = (Math.sin(i * 0.3 + index) + Math.cos(i * 0.7 + index * 1.5)) * 2;
      const curveY = y + noise;
      
      points.push(new THREE.Vector3(x, curveY, 0));
      
      // Add random branches
      if (i > 0 && i < segmentCount && Math.random() < 0.3) {
        const branchLength = randomFloat(5, 15);
        const branchAngle = randomFloat(-Math.PI/3, Math.PI/3);
        const branchEnd = new THREE.Vector3(
          x + Math.cos(branchAngle) * branchLength,
          curveY + Math.sin(branchAngle) * branchLength,
          0
        );
        
        // Create branch trace
        this.createBranch(points[i], branchEnd, index);
      }
    }
    
    // Create trace geometry
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(
      curve, 
      segmentCount, 
      CONFIG.CIRCUIT_BOARD.TRACE_WIDTH * 0.1, 
      8, 
      false
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.TRACE,
      transparent: true,
      opacity: 0.8
    });
    
    const traceMesh = new THREE.Mesh(tubeGeometry, material);
    traceMesh.userData = {
      curve: curve,
      originalColor: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.TRACE,
      pulsePhase: randomFloat(0, Math.PI * 2)
    };
    
    this.scene.add(traceMesh);
    return traceMesh;
  }
  
  createBranch(start, end, parentIndex) {
    const points = [start, end];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 5, CONFIG.CIRCUIT_BOARD.TRACE_WIDTH * 0.05, 6, false);
    
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.TRACE,
      transparent: true,
      opacity: 0.6
    });
    
    const branchMesh = new THREE.Mesh(tubeGeometry, material);
    branchMesh.userData = {
      curve: curve,
      originalColor: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.TRACE,
      pulsePhase: randomFloat(0, Math.PI * 2),
      isBranch: true
    };
    
    this.scene.add(branchMesh);
    this.traces.push(branchMesh);
  }
  
  generateNodes() {
    const nodeCount = Math.floor(this.traces.length * 2);
    
    for (let i = 0; i < nodeCount; i++) {
      const trace = this.traces[Math.floor(Math.random() * this.traces.length)];
      if (trace.userData.curve) {
        const t = randomFloat(0.1, 0.9);
        const position = trace.userData.curve.getPoint(t);
        
        const node = this.createNode(position);
        this.nodes.push(node);
      }
    }
  }
  
  createNode(position) {
    const geometry = new THREE.SphereGeometry(CONFIG.CIRCUIT_BOARD.NODE_SIZE * 0.1, 8, 6);
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.NODE,
      transparent: true,
      opacity: 0.9
    });
    
    const node = new THREE.Mesh(geometry, material);
    node.position.copy(position);
    node.position.z = 0.1;
    
    node.userData = {
      originalColor: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.NODE,
      pulsePhase: randomFloat(0, Math.PI * 2),
      pulseSpeed: randomFloat(0.8, 1.5)
    };
    
    this.scene.add(node);
    return node;
  }
  
  generateComponents() {
    const componentCount = Math.floor(this.height / 20);
    const componentTypes = ['RESISTOR', 'CAPACITOR', 'CHIP', 'CONNECTOR'];
    
    for (let i = 0; i < componentCount; i++) {
      const type = componentTypes[Math.floor(Math.random() * componentTypes.length)];
      const component = this.createComponent(type, i, componentCount);
      if (component) {
        this.components.push(component);
      }
    }
  }
  
  createComponent(type, index, total) {
    const componentConfig = CONFIG.CIRCUIT_BOARD.COMPONENTS[type];
    if (!componentConfig) return null;
    
    let geometry;
    switch (type) {
      case 'RESISTOR':
        geometry = new THREE.CylinderGeometry(
          componentConfig.height * 0.1, 
          componentConfig.height * 0.1, 
          componentConfig.width * 0.1, 
          8
        );
        break;
      case 'CAPACITOR':
        geometry = new THREE.CylinderGeometry(
          componentConfig.width * 0.1, 
          componentConfig.width * 0.1, 
          componentConfig.height * 0.1, 
          8
        );
        break;
      case 'CHIP':
        geometry = new THREE.BoxGeometry(
          componentConfig.width * 0.1, 
          componentConfig.depth * 0.1, 
          componentConfig.height * 0.1
        );
        break;
      case 'CONNECTOR':
        geometry = new THREE.BoxGeometry(
          componentConfig.width * 0.1, 
          componentConfig.height * 0.1, 
          componentConfig.depth * 0.1
        );
        break;
      default:
        return null;
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.COMPONENT,
      transparent: true,
      opacity: 0.8
    });
    
    const component = new THREE.Mesh(geometry, material);
    
    // Position component
    const x = randomFloat(-this.width / 2 + 5, this.width / 2 - 5);
    const y = (index / (total - 1)) * this.height - this.height / 2 + randomFloat(-5, 5);
    component.position.set(x, y, 0.2);
    
    // Random rotation
    if (type === 'RESISTOR' || type === 'CONNECTOR') {
      component.rotation.z = randomFloat(0, Math.PI);
    }
    
    component.userData = {
      type: type,
      originalColor: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.COMPONENT,
      pulsePhase: randomFloat(0, Math.PI * 2),
      isActive: Math.random() < 0.3
    };
    
    this.scene.add(component);
    return component;
  }
  
  generateDataPackets() {
    const packetCount = 5;
    
    for (let i = 0; i < packetCount; i++) {
      if (this.traces.length > 0) {
        const packet = this.createDataPacket();
        if (packet) {
          this.dataPackets.push(packet);
        }
      }
    }
  }
  
  createDataPacket() {
    const geometry = new THREE.SphereGeometry(0.3, 6, 4);
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.DATA_PACKET,
      transparent: true,
      opacity: 0.9
    });
    
    const packet = new THREE.Mesh(geometry, material);
    
    // Assign to random trace
    const trace = this.traces[Math.floor(Math.random() * this.traces.length)];
    
    packet.userData = {
      trace: trace,
      progress: Math.random(),
      speed: randomFloat(0.01, 0.03),
      originalOpacity: 0.9
    };
    
    this.scene.add(packet);
    return packet;
  }
  
  generateGlitchElements() {
    // Create some hidden glitch elements that appear during corruption
    const glitchCount = 3;
    
    for (let i = 0; i < glitchCount; i++) {
      const glitchElement = this.createGlitchElement();
      this.glitchElements.push(glitchElement);
    }
  }
  
  createGlitchElement() {
    // Create corrupted trace fragments
    const geometry = new THREE.BoxGeometry(
      randomFloat(5, 15),
      randomFloat(0.5, 2),
      0.1
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.DATA_PACKET,
      transparent: true,
      opacity: 0 // Hidden by default
    });
    
    const glitchElement = new THREE.Mesh(geometry, material);
    
    // Random position
    glitchElement.position.set(
      randomFloat(-this.width / 2, this.width / 2),
      randomFloat(-this.height / 2, this.height / 2),
      0.2
    );
    
    // Random rotation
    glitchElement.rotation.z = randomFloat(0, Math.PI);
    
    glitchElement.userData = {
      originalOpacity: 0,
      glitchIntensity: randomFloat(0.5, 1),
      flickerSpeed: randomFloat(8, 15)
    };
    
    this.scene.add(glitchElement);
    return glitchElement;
  }
  
  update(deltaTime, mouseInfluence) {
    this.time += deltaTime;
    this.glitchTime += deltaTime;
    
    // Handle glitch timing
    this.updateGlitchState();
    
    // Calculate mouse proximity for this side panel
    const mouseProximity = this.calculateMouseProximity(mouseInfluence);
    
    // Update trace pulsing with mouse interaction
    this.traces.forEach(trace => {
      const pulseIntensity = Math.sin(this.time * CONFIG.CIRCUIT_BOARD.PULSE_FREQUENCY + trace.userData.pulsePhase) * 0.5 + 0.5;
      
      // Mouse influence on traces
      const traceCenter = trace.position;
      const mouseDistance = Math.abs(traceCenter.y - mouseInfluence.y * this.height / 2);
      const mouseInfluenceStrength = Math.max(0, 1 - mouseDistance / (this.height / 4));
      
      const combinedIntensity = Math.max(pulseIntensity * 0.3, mouseInfluenceStrength * 0.7);
      
      const color = new THREE.Color(trace.userData.originalColor);
      color.lerp(new THREE.Color(CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.TRACE_ACTIVE), combinedIntensity);
      trace.material.color = color;
      trace.material.opacity = 0.6 + combinedIntensity * 0.4;
      
      // Add electrical surge effect on high mouse influence
      if (mouseInfluenceStrength > 0.8) {
        const surgeEffect = Math.sin(this.time * 10) * 0.5 + 0.5;
        trace.material.opacity = Math.min(1, trace.material.opacity + surgeEffect * 0.3);
      }
    });
    
    // Update node pulsing with mouse interaction
    this.nodes.forEach(node => {
      const pulseIntensity = Math.sin(this.time * node.userData.pulseSpeed + node.userData.pulsePhase) * 0.5 + 0.5;
      
      // Mouse influence on nodes
      const nodeDistance = Math.sqrt(
        Math.pow(node.position.x - mouseInfluence.x * this.width / 4, 2) +
        Math.pow(node.position.y - mouseInfluence.y * this.height / 2, 2)
      );
      const mouseInfluenceStrength = Math.max(0, 1 - nodeDistance / 20);
      
      const combinedScale = 1 + (pulseIntensity * 0.5) + (mouseInfluenceStrength * 1.5);
      node.scale.setScalar(combinedScale);
      
      const color = new THREE.Color(node.userData.originalColor);
      const targetColor = mouseInfluenceStrength > 0.5 ? 
        CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.NODE_ACTIVE : 
        CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.NODE;
      color.lerp(new THREE.Color(targetColor), Math.max(pulseIntensity, mouseInfluenceStrength));
      node.material.color = color;
      
      // Add sparkling effect for highly influenced nodes
      if (mouseInfluenceStrength > 0.7) {
        const sparkle = Math.random() * mouseInfluenceStrength;
        node.material.opacity = 0.9 + sparkle * 0.1;
      } else {
        node.material.opacity = 0.9;
      }
    });
    
    // Update component activity with mouse interaction
    this.components.forEach(component => {
      const pulseIntensity = Math.sin(this.time * 2 + component.userData.pulsePhase) * 0.5 + 0.5;
      
      // Mouse influence on components
      const componentDistance = Math.sqrt(
        Math.pow(component.position.x - mouseInfluence.x * this.width / 4, 2) +
        Math.pow(component.position.y - mouseInfluence.y * this.height / 2, 2)
      );
      const mouseInfluenceStrength = Math.max(0, 1 - componentDistance / 25);
      
      // Activate components based on mouse proximity or existing activity
      const isInfluenced = mouseInfluenceStrength > 0.3;
      const shouldBeActive = component.userData.isActive || isInfluenced;
      
      if (shouldBeActive) {
        const activityLevel = component.userData.isActive ? 
          pulseIntensity * 0.5 : 
          mouseInfluenceStrength * 0.8;
        
        const color = new THREE.Color(component.userData.originalColor);
        color.lerp(new THREE.Color(CONFIG.CIRCUIT_BOARD.CIRCUIT_COLORS.COMPONENT_ACTIVE), activityLevel);
        component.material.color = color;
        
        // Add slight rotation for active components
        if (isInfluenced) {
          component.rotation.y = Math.sin(this.time * 3) * 0.1;
          component.rotation.x = Math.cos(this.time * 2.5) * 0.05;
        }
      } else {
        // Return to original color
        component.material.color.copy(new THREE.Color(component.userData.originalColor));
        component.rotation.y = 0;
        component.rotation.x = 0;
      }
    });
    
    // Update data packets with mouse influence
    this.dataPackets.forEach(packet => {
      if (packet.userData.trace && packet.userData.trace.userData.curve) {
        // Mouse influence on packet speed
        const packetDistance = Math.sqrt(
          Math.pow(packet.position.x - mouseInfluence.x * this.width / 4, 2) +
          Math.pow(packet.position.y - mouseInfluence.y * this.height / 2, 2)
        );
        const mouseInfluenceStrength = Math.max(0, 1 - packetDistance / 30);
        const speedMultiplier = 1 + mouseInfluenceStrength * 2; // Speed up near mouse
        
        packet.userData.progress += packet.userData.speed * speedMultiplier;
        
        if (packet.userData.progress > 1) {
          packet.userData.progress = 0;
          // Randomly reassign to new trace
          packet.userData.trace = this.traces[Math.floor(Math.random() * this.traces.length)];
        }
        
        const position = packet.userData.trace.userData.curve.getPoint(packet.userData.progress);
        packet.position.copy(position);
        packet.position.z = 0.3;
        
        // Enhanced effects with mouse influence
        const fadeZone = 0.1;
        let opacity = packet.userData.originalOpacity;
        if (packet.userData.progress < fadeZone) {
          opacity *= packet.userData.progress / fadeZone;
        } else if (packet.userData.progress > 1 - fadeZone) {
          opacity *= (1 - packet.userData.progress) / fadeZone;
        }
        
        // Brighten packets near mouse
        if (mouseInfluenceStrength > 0.3) {
          opacity = Math.min(1, opacity + mouseInfluenceStrength * 0.5);
          const scale = 1 + mouseInfluenceStrength * 0.5;
          packet.scale.setScalar(scale);
        } else {
          packet.scale.setScalar(1);
        }
        
        packet.material.opacity = opacity;
      }
    });
    
    // Update glitch elements
    this.updateGlitchElements();
  }
  
  updateGlitchState() {
    // Check if it's time for a glitch
    if (!this.isGlitching && this.glitchTime >= this.nextGlitchTime) {
      this.startGlitch();
    }
    
    // Handle ongoing glitch
    if (this.isGlitching) {
      this.glitchDuration += 0.016; // Approximate frame time
      
      if (this.glitchDuration >= randomFloat(0.1, 0.8)) {
        this.endGlitch();
      }
    }
  }
  
  startGlitch() {
    this.isGlitching = true;
    this.glitchDuration = 0;
    
    // Apply glitch effects to random elements
    const affectedTraces = Math.floor(this.traces.length * 0.3);
    for (let i = 0; i < affectedTraces; i++) {
      const trace = this.traces[Math.floor(Math.random() * this.traces.length)];
      trace.userData.isGlitched = true;
    }
    
    console.log('Circuit glitch started on', this.side, 'panel');
  }
  
  endGlitch() {
    this.isGlitching = false;
    this.glitchTime = 0;
    this.nextGlitchTime = Math.random() * 8 + 3; // Next glitch in 3-11 seconds
    
    // Remove glitch effects
    this.traces.forEach(trace => {
      trace.userData.isGlitched = false;
    });
    
    this.nodes.forEach(node => {
      node.userData.isGlitched = false;
    });
  }
  
  updateGlitchElements() {
    this.glitchElements.forEach(element => {
      if (this.isGlitching) {
        // Flicker effect during glitch
        const flicker = Math.sin(this.time * element.userData.flickerSpeed) * 0.5 + 0.5;
        element.material.opacity = flicker * element.userData.glitchIntensity * 0.8;
        
        // Random position shifts
        if (Math.random() < 0.1) {
          element.position.x += randomFloat(-2, 2);
          element.position.y += randomFloat(-2, 2);
        }
        
        // Color corruption
        const corruptedColor = new THREE.Color(
          Math.random(),
          randomFloat(0, 1),
          randomFloat(0, 1)
        );
        element.material.color.lerp(corruptedColor, 0.3);
        
      } else {
        // Hide glitch elements when not glitching
        element.material.opacity = 0;
      }
    });
    
    // Apply glitch effects to normal elements during glitch
    if (this.isGlitching) {
      this.traces.forEach(trace => {
        if (trace.userData.isGlitched) {
          // Color corruption
          const corruptionIntensity = Math.random() * 0.5;
          const corruptedColor = new THREE.Color(
            randomFloat(0.5, 1),
            randomFloat(0, 0.5),
            randomFloat(0, 1)
          );
          trace.material.color.lerp(corruptedColor, corruptionIntensity);
          
          // Random opacity flicker
          trace.material.opacity = randomFloat(0.3, 1);
          
          // Position corruption
          if (Math.random() < 0.05) {
            trace.position.x += randomFloat(-1, 1);
            trace.position.y += randomFloat(-1, 1);
          }
        }
      });
      
      // Glitch some nodes
      this.nodes.forEach(node => {
        if (Math.random() < 0.2) {
          node.userData.isGlitched = true;
          const scale = randomFloat(0.5, 3);
          node.scale.setScalar(scale);
          
          // Color corruption
          const corruptedColor = new THREE.Color(
            randomFloat(0, 1),
            randomFloat(0, 1),
            randomFloat(0.5, 1)
          );
          node.material.color.copy(corruptedColor);
        }
      });
    }
  }
  
  calculateMouseProximity(mouseInfluence) {
    // Calculate how close the mouse is to this side panel
    const leftInfluence = Math.max(0, 1 - Math.abs(mouseInfluence.x + 1) * 2); // Left side
    const rightInfluence = Math.max(0, 1 - Math.abs(mouseInfluence.x - 1) * 2); // Right side
    
    return this.side === 'left' ? leftInfluence : rightInfluence;
  }
  
  dispose() {
    // Clean up all geometries and materials
    [...this.traces, ...this.nodes, ...this.components, ...this.dataPackets, ...this.glitchElements].forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
      this.scene.remove(obj);
    });
    
    this.traces = [];
    this.nodes = [];
    this.components = [];
    this.dataPackets = [];
    this.glitchElements = [];
  }
}