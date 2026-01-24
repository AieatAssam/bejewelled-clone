import * as THREE from 'three';

export const GemVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GemFragmentShader = `
  uniform vec3 uColor;
  uniform vec3 uGlowColor;
  uniform float uTime;
  uniform float uGlowIntensity;
  uniform float uRefractionRatio;
  uniform samplerCube uEnvMap;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;

  void main() {
    // Basic Fresnel effect for gem edges
    vec3 viewDir = normalize(-vPosition);
    float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);

    // Refraction simulation
    vec3 refractDir = refract(-viewDir, vNormal, uRefractionRatio);

    // Sparkle effect based on time
    float sparkle = sin(vUv.x * 20.0 + uTime * 3.0) * sin(vUv.y * 20.0 + uTime * 2.0);
    sparkle = pow(max(sparkle, 0.0), 8.0) * 0.5;

    // Combine base color with effects
    vec3 baseColor = uColor;
    vec3 highlightColor = mix(baseColor, vec3(1.0), 0.3);

    // Rim glow
    vec3 rimGlow = uGlowColor * fresnel * uGlowIntensity;

    // Final color
    vec3 finalColor = baseColor + rimGlow + sparkle * highlightColor;

    // Add some internal refraction coloring
    finalColor += uColor * 0.2 * (1.0 - fresnel);

    gl_FragColor = vec4(finalColor, 0.95);
  }
`;

export const SparkleVertexShader = `
  attribute float size;
  attribute float alpha;

  varying float vAlpha;

  void main() {
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const SparkleFragmentShader = `
  uniform vec3 uColor;
  uniform sampler2D uTexture;

  varying float vAlpha;

  void main() {
    vec4 texColor = texture2D(uTexture, gl_PointCoord);
    gl_FragColor = vec4(uColor, texColor.a * vAlpha);
  }
`;

export function createGemMaterial(
  primaryColor: number,
  glowColor: number
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(primaryColor) },
      uGlowColor: { value: new THREE.Color(glowColor) },
      uTime: { value: 0 },
      uGlowIntensity: { value: 0.5 },
      uRefractionRatio: { value: 0.98 },
    },
    vertexShader: GemVertexShader,
    fragmentShader: GemFragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

export function createStandardGemMaterial(
  primaryColor: number,
  glowColor: number
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: primaryColor,
    metalness: 0.0,
    roughness: 0.1,
    transmission: 0.5,
    thickness: 0.5,
    ior: 2.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    emissive: glowColor,
    emissiveIntensity: 0.1,
  });
}
