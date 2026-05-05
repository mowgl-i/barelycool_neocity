/**
 * Standalone Circuit Board System for BarelyCool
 * Self-contained version without ES6 imports for better compatibility
 */

// Configuration
const CIRCUIT_CONFIG = {
  PANEL_WIDTH: 150,
  TRACE_WIDTH: 0.8,
  TRACE_SEGMENTS: 50,
  NODE_SIZE: 1.5,
  DATA_PACKET_SPEED: 2,
  PULSE_FREQUENCY: 1.5,
  
  COLORS: {
    TRACE: 0x00ff41,
    TRACE_ACTIVE: 0x40ff80,
    NODE: 0x00ff41,
    NODE_ACTIVE: 0xffffff,
    COMPONENT: 0x666666,
    COMPONENT_ACTIVE: 0x00ffff,
    PCB_BASE: 0x001a0a,
    DATA_PACKET: 0x00ff41
  }
};

// Utility functions
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function isMobileDevice() {
  return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Circuit Board Class
class CircuitBoard {
  constructor(scene, width, height, side = 'left') {
    this.scene = scene;
    this.width = width;
    this.height = height;
    this.side = side;
    
    this.traces = [];
    this.nodes = [];
    this.components = [];
    this.dataPackets = [];
    this.glitchElements = [];
    
    this.time = 0;
    this.glitchTime = 0;
    this.nextGlitchTime = Math.random() * 5 + 2;
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
    const geometry = new THREE.PlaneGeometry(this.width, this.height);
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.PCB_BASE,
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
    const segmentCount = CIRCUIT_CONFIG.TRACE_SEGMENTS;
    
    for (let i = 0; i <= segmentCount; i++) {
      const x = (i / segmentCount) * this.width - this.width / 2;
      const noise = (Math.sin(i * 0.3 + index) + Math.cos(i * 0.7 + index * 1.5)) * 2;
      const curveY = y + noise;
      
      points.push(new THREE.Vector3(x, curveY, 0));
      
      if (i > 0 && i < segmentCount && Math.random() < 0.3) {
        const branchLength = randomFloat(5, 15);
        const branchAngle = randomFloat(-Math.PI/3, Math.PI/3);
        const branchEnd = new THREE.Vector3(
          x + Math.cos(branchAngle) * branchLength,
          curveY + Math.sin(branchAngle) * branchLength,
          0
        );
        
        this.createBranch(points[i], branchEnd, index);
      }
    }
    
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(
      curve, 
      segmentCount, 
      CIRCUIT_CONFIG.TRACE_WIDTH * 0.1, 
      8, 
      false
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.TRACE,
      transparent: true,
      opacity: 0.8
    });
    
    const traceMesh = new THREE.Mesh(tubeGeometry, material);
    traceMesh.userData = {
      curve: curve,
      originalColor: CIRCUIT_CONFIG.COLORS.TRACE,
      pulsePhase: randomFloat(0, Math.PI * 2)
    };
    
    this.scene.add(traceMesh);
    return traceMesh;
  }
  
  createBranch(start, end, parentIndex) {
    const points = [start, end];
    const curve = new THREE.CatmullRomCurve3(points);
    const tubeGeometry = new THREE.TubeGeometry(curve, 5, CIRCUIT_CONFIG.TRACE_WIDTH * 0.05, 6, false);
    
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.TRACE,
      transparent: true,
      opacity: 0.6
    });
    
    const branchMesh = new THREE.Mesh(tubeGeometry, material);
    branchMesh.userData = {
      curve: curve,
      originalColor: CIRCUIT_CONFIG.COLORS.TRACE,
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
    const geometry = new THREE.SphereGeometry(CIRCUIT_CONFIG.NODE_SIZE * 0.1, 8, 6);
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.NODE,
      transparent: true,
      opacity: 0.9
    });
    
    const node = new THREE.Mesh(geometry, material);
    node.position.copy(position);
    node.position.z = 0.1;
    
    node.userData = {
      originalColor: CIRCUIT_CONFIG.COLORS.NODE,
      pulsePhase: randomFloat(0, Math.PI * 2),
      pulseSpeed: randomFloat(0.8, 1.5)
    };
    
    this.scene.add(node);
    return node;
  }
  
  generateComponents() {
    const componentCount = Math.floor(this.height / 20);
    
    for (let i = 0; i < componentCount; i++) {
      const component = this.createComponent(i, componentCount);
      if (component) {
        this.components.push(component);
      }
    }
  }
  
  createComponent(index, total) {
    const types = ['box', 'cylinder'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let geometry;
    if (type === 'box') {
      geometry = new THREE.BoxGeometry(0.4, 0.05, 0.3);
    } else {
      geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 8);
    }
    
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.COMPONENT,
      transparent: true,
      opacity: 0.8
    });
    
    const component = new THREE.Mesh(geometry, material);
    
    const x = randomFloat(-this.width / 2 + 5, this.width / 2 - 5);
    const y = (index / (total - 1)) * this.height - this.height / 2 + randomFloat(-5, 5);
    component.position.set(x, y, 0.2);
    
    if (type === 'cylinder') {
      component.rotation.z = randomFloat(0, Math.PI);
    }
    
    component.userData = {
      type: type,
      originalColor: CIRCUIT_CONFIG.COLORS.COMPONENT,
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
      color: CIRCUIT_CONFIG.COLORS.DATA_PACKET,
      transparent: true,
      opacity: 0.9
    });
    
    const packet = new THREE.Mesh(geometry, material);
    
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
    const glitchCount = 3;
    
    for (let i = 0; i < glitchCount; i++) {
      const glitchElement = this.createGlitchElement();
      this.glitchElements.push(glitchElement);
    }
  }
  
  createGlitchElement() {
    const geometry = new THREE.BoxGeometry(
      randomFloat(5, 15),
      randomFloat(0.5, 2),
      0.1
    );
    
    const material = new THREE.MeshBasicMaterial({
      color: CIRCUIT_CONFIG.COLORS.DATA_PACKET,
      transparent: true,
      opacity: 0
    });
    
    const glitchElement = new THREE.Mesh(geometry, material);
    
    glitchElement.position.set(
      randomFloat(-this.width / 2, this.width / 2),
      randomFloat(-this.height / 2, this.height / 2),
      0.2
    );
    
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
    
    this.updateGlitchState();
    
    // Update traces
    this.traces.forEach(trace => {
      const pulseIntensity = Math.sin(this.time * CIRCUIT_CONFIG.PULSE_FREQUENCY + trace.userData.pulsePhase) * 0.5 + 0.5;
      
      const traceCenter = trace.position;
      const mouseDistance = Math.abs(traceCenter.y - mouseInfluence.y * this.height / 2);
      const mouseInfluenceStrength = Math.max(0, 1 - mouseDistance / (this.height / 4));
      
      const combinedIntensity = Math.max(pulseIntensity * 0.3, mouseInfluenceStrength * 0.7);
      
      const color = new THREE.Color(trace.userData.originalColor);
      color.lerp(new THREE.Color(CIRCUIT_CONFIG.COLORS.TRACE_ACTIVE), combinedIntensity);
      trace.material.color = color;
      trace.material.opacity = 0.6 + combinedIntensity * 0.4;
      
      if (mouseInfluenceStrength > 0.8) {
        const surgeEffect = Math.sin(this.time * 10) * 0.5 + 0.5;
        trace.material.opacity = Math.min(1, trace.material.opacity + surgeEffect * 0.3);
      }
    });
    
    // Update nodes
    this.nodes.forEach(node => {
      const pulseIntensity = Math.sin(this.time * node.userData.pulseSpeed + node.userData.pulsePhase) * 0.5 + 0.5;
      
      const nodeDistance = Math.sqrt(
        Math.pow(node.position.x - mouseInfluence.x * this.width / 4, 2) +
        Math.pow(node.position.y - mouseInfluence.y * this.height / 2, 2)
      );
      const mouseInfluenceStrength = Math.max(0, 1 - nodeDistance / 20);
      
      const combinedScale = 1 + (pulseIntensity * 0.5) + (mouseInfluenceStrength * 1.5);
      node.scale.setScalar(combinedScale);
      
      const color = new THREE.Color(node.userData.originalColor);
      const targetColor = mouseInfluenceStrength > 0.5 ? 
        CIRCUIT_CONFIG.COLORS.NODE_ACTIVE : 
        CIRCUIT_CONFIG.COLORS.NODE;
      color.lerp(new THREE.Color(targetColor), Math.max(pulseIntensity, mouseInfluenceStrength));
      node.material.color = color;
      
      if (mouseInfluenceStrength > 0.7) {
        const sparkle = Math.random() * mouseInfluenceStrength;
        node.material.opacity = 0.9 + sparkle * 0.1;
      } else {
        node.material.opacity = 0.9;
      }
    });
    
    // Update components
    this.components.forEach(component => {
      const pulseIntensity = Math.sin(this.time * 2 + component.userData.pulsePhase) * 0.5 + 0.5;
      
      const componentDistance = Math.sqrt(
        Math.pow(component.position.x - mouseInfluence.x * this.width / 4, 2) +
        Math.pow(component.position.y - mouseInfluence.y * this.height / 2, 2)
      );
      const mouseInfluenceStrength = Math.max(0, 1 - componentDistance / 25);
      
      const isInfluenced = mouseInfluenceStrength > 0.3;
      const shouldBeActive = component.userData.isActive || isInfluenced;
      
      if (shouldBeActive) {
        const activityLevel = component.userData.isActive ? 
          pulseIntensity * 0.5 : 
          mouseInfluenceStrength * 0.8;
        
        const color = new THREE.Color(component.userData.originalColor);
        color.lerp(new THREE.Color(CIRCUIT_CONFIG.COLORS.COMPONENT_ACTIVE), activityLevel);
        component.material.color = color;
        
        if (isInfluenced) {
          component.rotation.y = Math.sin(this.time * 3) * 0.1;
          component.rotation.x = Math.cos(this.time * 2.5) * 0.05;
        }
      } else {
        component.material.color.copy(new THREE.Color(component.userData.originalColor));
        component.rotation.y = 0;
        component.rotation.x = 0;
      }
    });
    
    // Update data packets
    this.dataPackets.forEach(packet => {
      if (packet.userData.trace && packet.userData.trace.userData.curve) {
        const packetDistance = Math.sqrt(
          Math.pow(packet.position.x - mouseInfluence.x * this.width / 4, 2) +
          Math.pow(packet.position.y - mouseInfluence.y * this.height / 2, 2)
        );
        const mouseInfluenceStrength = Math.max(0, 1 - packetDistance / 30);
        const speedMultiplier = 1 + mouseInfluenceStrength * 2;
        
        packet.userData.progress += packet.userData.speed * speedMultiplier;
        
        if (packet.userData.progress > 1) {
          packet.userData.progress = 0;
          packet.userData.trace = this.traces[Math.floor(Math.random() * this.traces.length)];
        }
        
        const position = packet.userData.trace.userData.curve.getPoint(packet.userData.progress);
        packet.position.copy(position);
        packet.position.z = 0.3;
        
        const fadeZone = 0.1;
        let opacity = packet.userData.originalOpacity;
        if (packet.userData.progress < fadeZone) {
          opacity *= packet.userData.progress / fadeZone;
        } else if (packet.userData.progress > 1 - fadeZone) {
          opacity *= (1 - packet.userData.progress) / fadeZone;
        }
        
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
    
    this.updateGlitchElements();
  }
  
  updateGlitchState() {
    if (!this.isGlitching && this.glitchTime >= this.nextGlitchTime) {
      this.startGlitch();
    }
    
    if (this.isGlitching) {
      this.glitchDuration += 0.016;
      
      if (this.glitchDuration >= randomFloat(0.1, 0.8)) {
        this.endGlitch();
      }
    }
  }
  
  startGlitch() {
    this.isGlitching = true;
    this.glitchDuration = 0;
    
    const affectedTraces = Math.floor(this.traces.length * 0.3);
    for (let i = 0; i < affectedTraces; i++) {
      const trace = this.traces[Math.floor(Math.random() * this.traces.length)];
      trace.userData.isGlitched = true;
    }
  }
  
  endGlitch() {
    this.isGlitching = false;
    this.glitchTime = 0;
    this.nextGlitchTime = Math.random() * 8 + 3;
    
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
        const flicker = Math.sin(this.time * element.userData.flickerSpeed) * 0.5 + 0.5;
        element.material.opacity = flicker * element.userData.glitchIntensity * 0.8;
        
        if (Math.random() < 0.1) {
          element.position.x += randomFloat(-2, 2);
          element.position.y += randomFloat(-2, 2);
        }
        
        const corruptedColor = new THREE.Color(
          Math.random(),
          randomFloat(0, 1),
          randomFloat(0, 1)
        );
        element.material.color.lerp(corruptedColor, 0.3);
        
      } else {
        element.material.opacity = 0;
      }
    });
    
    if (this.isGlitching) {
      this.traces.forEach(trace => {
        if (trace.userData.isGlitched) {
          const corruptionIntensity = Math.random() * 0.5;
          const corruptedColor = new THREE.Color(
            randomFloat(0.5, 1),
            randomFloat(0, 0.5),
            randomFloat(0, 1)
          );
          trace.material.color.lerp(corruptedColor, corruptionIntensity);
          trace.material.opacity = randomFloat(0.3, 1);
          
          if (Math.random() < 0.05) {
            trace.position.x += randomFloat(-1, 1);
            trace.position.y += randomFloat(-1, 1);
          }
        }
      });
      
      this.nodes.forEach(node => {
        if (Math.random() < 0.2) {
          node.userData.isGlitched = true;
          const scale = randomFloat(0.5, 3);
          node.scale.setScalar(scale);
          
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
  
  dispose() {
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

// Circuit Manager
class CircuitManager {
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
    
    this.mouse = { x: 0, y: 0 };
    this.mouseInfluence = { x: 0, y: 0 };
    
    this.animate = this.animate.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }
  
  async init() {
    try {
      if (this.isMobile) {
        console.log('Mobile device detected - circuit board panels disabled');
        return;
      }
      
      const leftCanvas = document.getElementById('circuit-left-canvas');
      const rightCanvas = document.getElementById('circuit-right-canvas');
      
      if (!leftCanvas || !rightCanvas) {
        console.error('Circuit board canvas elements not found');
        enableFallbackBackground();
        return;
      }
      
      console.log('Found canvas elements:', leftCanvas, rightCanvas);
      
      this.initScenes();
      this.initCameras();
      this.initRenderers(leftCanvas, rightCanvas);
      this.initCircuitBoards();
      this.initEventListeners();
      
      this.animate();
      
      console.log('Circuit board panels initialized successfully');
      
    } catch (error) {
      console.error('Circuit board initialization error:', error);
    }
  }
  
  initScenes() {
    this.leftScene = new THREE.Scene();
    this.rightScene = new THREE.Scene();
    
    // Set a visible dark green background to test rendering
    this.leftScene.background = new THREE.Color(0x003300);
    this.rightScene.background = new THREE.Color(0x003300);
    
    console.log('Scenes initialized with green background');
  }
  
  initCameras() {
    const panelWidth = window.innerWidth <= 1200 ? 100 : CIRCUIT_CONFIG.PANEL_WIDTH;
    
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
    const leftPanelWidth = window.innerWidth <= 1200 ? 100 : CIRCUIT_CONFIG.PANEL_WIDTH;
    const rightPanelWidth = window.innerWidth <= 1200 ? 100 : CIRCUIT_CONFIG.PANEL_WIDTH;
    
    console.log('Initializing renderers with dimensions:', leftPanelWidth, 'x', window.innerHeight);
    
    this.leftRenderer = new THREE.WebGLRenderer({
      canvas: leftCanvas,
      alpha: false, // Changed to false to make background visible
      antialias: !this.isMobile
    });
    
    this.leftRenderer.setSize(leftPanelWidth, window.innerHeight);
    this.leftRenderer.setClearColor(0x003300, 1); // Green background for testing
    
    this.rightRenderer = new THREE.WebGLRenderer({
      canvas: rightCanvas,
      alpha: false, // Changed to false to make background visible
      antialias: !this.isMobile
    });
    
    this.rightRenderer.setSize(rightPanelWidth, window.innerHeight);
    this.rightRenderer.setClearColor(0x003300, 1); // Green background for testing
    
    const pixelRatio = Math.min(window.devicePixelRatio, 1.5);
    this.leftRenderer.setPixelRatio(pixelRatio);
    this.rightRenderer.setPixelRatio(pixelRatio);
    
    console.log('Renderers initialized');
  }
  
  initCircuitBoards() {
    const panelWidth = window.innerWidth <= 1200 ? 100 : CIRCUIT_CONFIG.PANEL_WIDTH;
    const panelHeight = window.innerHeight;
    
    this.leftCircuitBoard = new CircuitBoard(this.leftScene, panelWidth, panelHeight, 'left');
    this.rightCircuitBoard = new CircuitBoard(this.rightScene, panelWidth, panelHeight, 'right');
  }
  
  initEventListeners() {
    window.addEventListener('mousemove', this.handleMouseMove, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimation();
      } else {
        this.resumeAnimation();
      }
    });
    
    window.addEventListener('beforeunload', () => {
      this.dispose();
    });
  }
  
  handleMouseMove(event) {
    if (this.isDisposed) return;
    
    this.mouse.x = event.clientX / window.innerWidth;
    this.mouse.y = event.clientY / window.innerHeight;
    
    this.mouseInfluence.x = (this.mouse.x - 0.5) * 2;
    this.mouseInfluence.y = (this.mouse.y - 0.5) * 2;
  }
  
  handleResize() {
    if (this.isDisposed) return;
    
    try {
      const panelWidth = window.innerWidth <= 1200 ? 100 : CIRCUIT_CONFIG.PANEL_WIDTH;
      const panelHeight = window.innerHeight;
      
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
      
      this.leftRenderer.setSize(panelWidth, panelHeight);
      this.rightRenderer.setSize(panelWidth, panelHeight);
      
      if (this.leftCircuitBoard) {
        this.leftCircuitBoard.dispose();
        this.leftCircuitBoard = new CircuitBoard(this.leftScene, panelWidth, panelHeight, 'left');
      }
      
      if (this.rightCircuitBoard) {
        this.rightCircuitBoard.dispose();
        this.rightCircuitBoard = new CircuitBoard(this.rightScene, panelWidth, panelHeight, 'right');
      }
      
    } catch (error) {
      console.error('Circuit board resize error:', error);
    }
  }
  
  animate(currentTime = 0) {
    if (this.isDisposed) return;
    
    try {
      this.animationId = requestAnimationFrame(this.animate);
      
      const deltaTime = (currentTime - this.lastTime) * 0.001;
      this.lastTime = currentTime;
      
      if (this.leftCircuitBoard) {
        this.leftCircuitBoard.update(deltaTime, this.mouseInfluence);
      }
      
      if (this.rightCircuitBoard) {
        this.rightCircuitBoard.update(deltaTime, this.mouseInfluence);
      }
      
      if (this.leftRenderer && this.leftScene && this.leftCamera) {
        this.leftRenderer.render(this.leftScene, this.leftCamera);
      }
      
      if (this.rightRenderer && this.rightScene && this.rightCamera) {
        this.rightRenderer.render(this.rightScene, this.rightCamera);
      }
      
    } catch (error) {
      console.error('Circuit board animation error:', error);
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
    
    this.pauseAnimation();
    
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    
    if (this.leftCircuitBoard) {
      this.leftCircuitBoard.dispose();
    }
    
    if (this.rightCircuitBoard) {
      this.rightCircuitBoard.dispose();
    }
    
    if (this.leftRenderer) {
      this.leftRenderer.dispose();
    }
    
    if (this.rightRenderer) {
      this.rightRenderer.dispose();
    }
    
    if (this.leftScene) {
      this.leftScene.clear();
    }
    
    if (this.rightScene) {
      this.rightScene.clear();
    }
    
    console.log('Circuit board panels disposed');
  }
}

// Initialize when page loads
let circuitManager = null;

function initCircuitBoards() {
  if (typeof THREE === 'undefined') {
    console.error('Three.js not loaded - falling back to original background');
    enableFallbackBackground();
    return;
  }
  
  try {
    circuitManager = new CircuitManager();
    circuitManager.init().then(() => {
      console.log('Circuit boards loaded successfully');
    }).catch((error) => {
      console.error('Failed to initialize circuit boards:', error);
      enableFallbackBackground();
    });
  } catch (error) {
    console.error('Failed to create circuit manager:', error);
    enableFallbackBackground();
  }
}

function enableFallbackBackground() {
  document.body.classList.add('circuit-fallback');
  console.log('Enabled fallback background image');
}

// Wait for DOM and Three.js to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initCircuitBoards, 100); // Small delay to ensure Three.js is loaded
  });
} else {
  setTimeout(initCircuitBoards, 100);
}

// Global cleanup
window.addEventListener('beforeunload', () => {
  if (circuitManager) {
    circuitManager.dispose();
  }
});

// Export for debugging
window.CircuitManager = CircuitManager;
window.circuitManager = circuitManager;