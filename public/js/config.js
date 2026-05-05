/**
 * Configuration constants for BarelyCool 3D effects
 */

export const CONFIG = {
  // Performance settings
  MOBILE_BREAKPOINT: 768,
  MOBILE_PARTICLE_COUNT: 50,
  DESKTOP_PARTICLE_COUNT: 150,
  MOBILE_WIREFRAME_COUNT: 4,
  DESKTOP_WIREFRAME_COUNT: 8,
  
  // Animation settings
  RAIN_SPEED_MIN: 0.02,
  RAIN_SPEED_MAX: 0.07,
  ROTATION_SPEED_MAX: 0.02,
  MOUSE_INFLUENCE_RADIUS: 3,
  WIREFRAME_INFLUENCE_RADIUS: 4,
  
  // Visual settings
  RAIN_DROP_SIZE: {
    width: 0.02,
    height: 0.3,
    depth: 0.02
  },
  
  WIREFRAME_SIZES: {
    octahedron: 0.5,
    icosahedron: 0.3,
    tetrahedron: 0.4
  },
  
  // Colors (matching CSS custom properties)
  COLORS: {
    MATRIX_GREEN: 0x00ff41,
    ERROR_RED: 0xff0040,
    CYAN: 0x00ffff,
    WHITE: 0xffffff,
    BLACK: 0x000000
  },
  
  // Scene bounds
  SCENE_BOUNDS: {
    width: 20,
    height: 20,
    depth: 20
  },
  
  // Camera settings
  CAMERA: {
    fov: 75,
    near: 0.1,
    far: 1000,
    position: { x: 0, y: 0, z: 5 }
  },
  
  // Circuit Board settings
  CIRCUIT_BOARD: {
    PANEL_WIDTH: 150,
    PANEL_HEIGHT_SEGMENTS: 20,
    TRACE_WIDTH: 0.8,
    TRACE_SEGMENTS: 50,
    NODE_SIZE: 1.5,
    COMPONENT_DENSITY: 0.3,
    DATA_PACKET_SPEED: 2,
    PULSE_FREQUENCY: 1.5,
    
    // Component sizes
    COMPONENTS: {
      RESISTOR: { width: 3, height: 0.8, depth: 0.8 },
      CAPACITOR: { width: 2, height: 1.2, depth: 1.2 },
      CHIP: { width: 4, height: 0.5, depth: 3 },
      CONNECTOR: { width: 1, height: 2, depth: 1 }
    },
    
    // Circuit colors
    CIRCUIT_COLORS: {
      TRACE: 0x00ff41,
      TRACE_ACTIVE: 0x40ff80,
      NODE: 0x00ff41,
      NODE_ACTIVE: 0xffffff,
      COMPONENT: 0x666666,
      COMPONENT_ACTIVE: 0x00ffff,
      PCB_BASE: 0x001a0a,
      DATA_PACKET: 0x00ff41
    }
  }
};