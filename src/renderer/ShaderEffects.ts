import * as THREE from 'three';
import {
  MeshBVH,
  MeshBVHUniformStruct,
  shaderStructs,
  shaderIntersectFunction,
} from 'three-mesh-bvh';

export interface RefractionConfig {
  bounces: number;
  ior: number;
  color: THREE.Color;
  fresnel: number;
  aberrationStrength: number;
}

// Default configs per gem type
export const GEM_REFRACTION_CONFIGS: Record<string, RefractionConfig> = {
  Diamond: {
    bounces: 3,
    ior: 2.42,
    color: new THREE.Color(1, 1, 1),
    fresnel: 1.0,
    aberrationStrength: 0.01,
  },
  Ruby: {
    bounces: 2,
    ior: 1.77,
    color: new THREE.Color(0xff3344),
    fresnel: 0.8,
    aberrationStrength: 0,
  },
  Sapphire: {
    bounces: 2,
    ior: 1.77,
    color: new THREE.Color(0x4466ee),
    fresnel: 0.8,
    aberrationStrength: 0,
  },
  Emerald: {
    bounces: 2,
    ior: 1.58,
    color: new THREE.Color(0x22dd66),
    fresnel: 0.8,
    aberrationStrength: 0,
  },
  Amethyst: {
    bounces: 2,
    ior: 1.54,
    color: new THREE.Color(0xaa55ff),
    fresnel: 0.8,
    aberrationStrength: 0,
  },
};

// Cache BVH structs per geometry to avoid rebuilding
const bvhCache = new Map<THREE.BufferGeometry, MeshBVHUniformStruct>();

function getOrCreateBVHStruct(geometry: THREE.BufferGeometry): MeshBVHUniformStruct {
  let cached = bvhCache.get(geometry);
  if (cached) return cached;

  // BVH needs indexed or non-indexed geometry
  // Our geometries are already toNonIndexed() but MeshBVH needs index
  // Re-index the geometry for BVH
  let bvhGeometry = geometry;
  if (!geometry.index) {
    // Create a simple sequential index
    const posCount = geometry.attributes.position.count;
    const indices = new Uint32Array(posCount);
    for (let i = 0; i < posCount; i++) indices[i] = i;
    bvhGeometry = geometry.clone();
    bvhGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
  }

  const bvh = new MeshBVH(bvhGeometry);
  const struct = new MeshBVHUniformStruct();
  struct.updateFrom(bvh);

  bvhCache.set(geometry, struct);
  return struct;
}

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

function createRefractionFragmentShader(bounces: number, useChroma: boolean): string {
  return /* glsl */ `
    precision highp float;
    precision highp int;
    precision highp sampler2D;
    precision highp usampler2D;

    ${shaderStructs}
    ${shaderIntersectFunction}

    uniform sampler2D envMap;
    uniform BVH bvh;
    uniform vec3 color;
    uniform float ior;
    uniform float fresnel;
    uniform float aberrationStrength;
    uniform mat4 modelMatrixInverse;
    uniform float opacity;

    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;

    // Schlick Fresnel approximation
    float fresnelFunc(vec3 viewDir, vec3 normal, float f0) {
      return f0 + (1.0 - f0) * pow(1.0 - abs(dot(viewDir, normal)), 5.0);
    }

    vec3 traceRefraction(vec3 entryPoint, vec3 entryNormal, float currentIor) {
      vec3 viewDir = normalize(entryPoint - cameraPosition);

      // Transform to local space for BVH traversal
      vec3 localOrigin = (modelMatrixInverse * vec4(entryPoint, 1.0)).xyz;
      vec3 localNormal = normalize((modelMatrixInverse * vec4(entryNormal, 0.0)).xyz);
      vec3 localViewDir = normalize((modelMatrixInverse * vec4(viewDir, 0.0)).xyz);

      // Initial refraction (air -> gem)
      vec3 rayDir = refract(localViewDir, localNormal, 1.0 / currentIor);
      vec3 rayOrigin = localOrigin;

      // If TIR at entry (shouldn't normally happen), reflect
      if (length(rayDir) < 0.001) {
        rayDir = reflect(localViewDir, localNormal);
      }

      // Bounce loop
      for (int i = 0; i < ${bounces}; i++) {
        // Offset to avoid self-intersection
        rayOrigin += rayDir * 0.001;

        // Trace through BVH
        uvec4 faceIndices = uvec4(0u);
        vec3 faceNormal = vec3(0.0);
        vec3 barycoord = vec3(0.0);
        float side = 1.0;
        float dist = 0.0;

        bool hit = bvhIntersectFirstHit(
          bvh, rayOrigin, rayDir,
          faceIndices, faceNormal, barycoord, side, dist
        );

        if (!hit) break;

        vec3 hitPoint = rayOrigin + rayDir * dist;

        // Get proper normal at hit point using barycentric interpolation
        vec3 hitNormal = textureSampleBarycoord(
          bvh.position, barycoord, faceIndices.xyz
        ).xyz;
        hitNormal = faceNormal; // Use face normal for faceted look

        // Ensure normal faces incoming ray
        if (dot(hitNormal, rayDir) > 0.0) hitNormal = -hitNormal;

        // Refract exiting the gem (gem -> air)
        vec3 exitDir = refract(rayDir, hitNormal, currentIor);

        // Total internal reflection
        if (length(exitDir) < 0.001) {
          rayDir = reflect(rayDir, hitNormal);
        } else {
          rayDir = exitDir;
        }

        rayOrigin = hitPoint;
      }

      // Transform exit ray back to world space
      vec3 worldRayDir = normalize((modelMatrix * vec4(rayDir, 0.0)).xyz);

      // Sample environment map (PMREM texture is equirectangular in a 2D sampler)
      // Convert direction to equirectangular UV
      float phi = atan(worldRayDir.z, worldRayDir.x);
      float theta = asin(clamp(worldRayDir.y, -1.0, 1.0));
      vec2 envUV = vec2(phi / (2.0 * 3.14159265) + 0.5, theta / 3.14159265 + 0.5);

      return texture2D(envMap, envUV).rgb;
    }

    void main() {
      ${useChroma ? `
        // Chromatic aberration: trace with 3 different IOR values
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

      // Apply color tint
      result *= color;

      // Fresnel reflection blend at surface
      vec3 viewDir = normalize(vWorldPosition - cameraPosition);
      float f = fresnelFunc(viewDir, vWorldNormal, fresnel * 0.04);

      // Sample env for reflection
      vec3 reflectDir = reflect(viewDir, vWorldNormal);
      float phi = atan(reflectDir.z, reflectDir.x);
      float theta = asin(clamp(reflectDir.y, -1.0, 1.0));
      vec2 reflUV = vec2(phi / (2.0 * 3.14159265) + 0.5, theta / 3.14159265 + 0.5);
      vec3 reflected = texture2D(envMap, reflUV).rgb;

      result = mix(result, reflected, f);

      gl_FragColor = vec4(result, opacity);
    }
  `;
}

export function createRefractionMaterial(
  geometry: THREE.BufferGeometry,
  envMap: THREE.Texture,
  config: RefractionConfig,
): THREE.ShaderMaterial {
  const bvhStruct = getOrCreateBVHStruct(geometry);
  const useChroma = config.aberrationStrength > 0;

  const material = new THREE.ShaderMaterial({
    uniforms: {
      envMap: { value: envMap },
      bvh: { value: bvhStruct },
      color: { value: config.color.clone() },
      ior: { value: config.ior },
      fresnel: { value: config.fresnel },
      aberrationStrength: { value: config.aberrationStrength },
      modelMatrixInverse: { value: new THREE.Matrix4() },
      opacity: { value: 1.0 },
    },
    vertexShader: refractionVertexShader,
    fragmentShader: createRefractionFragmentShader(config.bounces, useChroma),
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
  });

  return material;
}

export function updateRefractionUniforms(
  mesh: THREE.Object3D,
  material: THREE.ShaderMaterial,
): void {
  mesh.updateWorldMatrix(true, false);
  material.uniforms.modelMatrixInverse.value.copy(mesh.matrixWorld).invert();
}

export function disposeBVHCache(): void {
  bvhCache.forEach((struct) => struct.dispose());
  bvhCache.clear();
}
