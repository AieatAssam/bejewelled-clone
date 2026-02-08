import * as THREE from 'three';

export interface RefractionConfig {
  ior: number;
  color: THREE.Color;
  fresnel: number;
  aberrationStrength: number;
}

// Default configs per gem type
export const GEM_REFRACTION_CONFIGS: Record<string, RefractionConfig> = {
  Diamond: {
    ior: 2.42,
    color: new THREE.Color(1, 1, 1),
    fresnel: 1.0,
    aberrationStrength: 0.01,
  },
  Ruby: {
    ior: 1.77,
    color: new THREE.Color(1.0, 0.08, 0.12),
    fresnel: 0.5,
    aberrationStrength: 0,
  },
  Sapphire: {
    ior: 1.77,
    color: new THREE.Color(0.1, 0.25, 1.0),
    fresnel: 0.5,
    aberrationStrength: 0,
  },
  Emerald: {
    ior: 1.58,
    color: new THREE.Color(0.05, 1.0, 0.3),
    fresnel: 0.5,
    aberrationStrength: 0,
  },
  Amethyst: {
    ior: 1.54,
    color: new THREE.Color(0.6, 0.1, 1.0),
    fresnel: 0.5,
    aberrationStrength: 0,
  },
};

// Lightweight cubemap-based refraction vertex shader
const refractionVertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Lightweight fragment shader: uses refract() + cubemap lookup
// Instead of BVH ray tracing (20-50 texture fetches per pixel),
// this uses 2-4 cubemap samples per pixel via geometric approximation
function createRefractionFragmentShader(useChroma: boolean): string {
  return /* glsl */ `
    precision highp float;

    uniform samplerCube envMap;
    uniform vec3 color;
    uniform float ior;
    uniform float fresnel;
    uniform float aberrationStrength;
    uniform float opacity;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    // Schlick Fresnel approximation
    float fresnelFunc(vec3 viewDir, vec3 normal, float f0) {
      return f0 + (1.0 - f0) * pow(1.0 - abs(dot(viewDir, normal)), 5.0);
    }

    // Approximate refraction through a gem using double-refraction trick:
    // 1. Refract at entry surface (air -> gem)
    // 2. Approximate exit by flipping normal (simulates hitting back face)
    // 3. Refract at exit surface (gem -> air)
    // This gives a convincing gem-like distortion with just 1 cubemap sample
    vec3 traceRefraction(vec3 worldPos, vec3 worldNormal, float currentIor) {
      vec3 viewDir = normalize(worldPos - cameraPosition);

      // Entry refraction (air -> gem)
      vec3 refractedEntry = refract(viewDir, worldNormal, 1.0 / currentIor);

      // If total internal reflection at entry (shouldn't happen), fall back to reflection
      if (length(refractedEntry) < 0.001) {
        vec3 reflDir = reflect(viewDir, worldNormal);
        return textureCube(envMap, reflDir).rgb;
      }

      // Approximate exit: flip normal to simulate back face hit
      // This creates the light-bending effect through the gem body
      vec3 exitNormal = -worldNormal;

      // Exit refraction (gem -> air)
      vec3 exitDir = refract(refractedEntry, exitNormal, currentIor);

      // If TIR at exit, reflect internally then try exit again
      if (length(exitDir) < 0.001) {
        vec3 reflected = reflect(refractedEntry, exitNormal);
        exitDir = refract(reflected, worldNormal, currentIor);
        if (length(exitDir) < 0.001) {
          exitDir = reflect(viewDir, worldNormal);
        }
      }

      return textureCube(envMap, exitDir).rgb;
    }

    void main() {
      ${useChroma ? `
        // Chromatic aberration: 3 cubemap samples with slightly different IOR
        float iorR = ior * (1.0 + aberrationStrength);
        float iorG = ior;
        float iorB = ior * (1.0 - aberrationStrength);

        vec3 result;
        result.r = traceRefraction(vWorldPosition, vWorldNormal, iorR).r;
        result.g = traceRefraction(vWorldPosition, vWorldNormal, iorG).g;
        result.b = traceRefraction(vWorldPosition, vWorldNormal, iorB).b;
      ` : `
        vec3 result = traceRefraction(vWorldPosition, vWorldNormal, ior);
      `}

      // Rich color tinting: use luminance to drive strong gem color
      float luminance = dot(result, vec3(0.299, 0.587, 0.114));
      // Strong color glow driven by light passing through
      vec3 colorGlow = luminance * color * 1.5;
      // Light absorption filter
      vec3 colorFiltered = result * color;
      // Heavily favor the glow path for saturated color
      result = mix(colorFiltered, colorGlow, 0.75);

      // Boost saturation further
      float grey = dot(result, vec3(0.299, 0.587, 0.114));
      result = mix(vec3(grey), result, 1.4);

      // Fresnel reflection blend at surface (subtle to preserve color)
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      float f = fresnelFunc(viewDir, vWorldNormal, fresnel * 0.04);

      // Tinted reflection preserves gem identity at glancing angles
      vec3 reflectDir = reflect(viewDir, vWorldNormal);
      vec3 reflected = textureCube(envMap, reflectDir).rgb;
      reflected = mix(reflected, reflected * color, 0.6);

      result = mix(result, reflected, f);

      // Boost brightness for visible gems on dark background
      result *= 2.2;

      gl_FragColor = vec4(result, opacity);
    }
  `;
}

export function createRefractionMaterial(
  envMap: THREE.CubeTexture,
  config: RefractionConfig,
): THREE.ShaderMaterial {
  const useChroma = config.aberrationStrength > 0;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: envMap },
      color: { value: config.color.clone() },
      ior: { value: config.ior },
      fresnel: { value: config.fresnel },
      aberrationStrength: { value: config.aberrationStrength },
      opacity: { value: 1.0 },
    },
    vertexShader: refractionVertexShader,
    fragmentShader: createRefractionFragmentShader(useChroma),
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });

  return material;
}

export function updateRefractionUniforms(
  _mesh: THREE.Object3D,
  _material: THREE.ShaderMaterial,
): void {
  // No per-frame uniform updates needed for cubemap-based approach
  // The vertex shader's built-in modelMatrix handles transforms
}

export function disposeBVHCache(): void {
  // No BVH cache to dispose - kept for API compatibility
}
