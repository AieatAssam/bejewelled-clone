import * as THREE from 'three';
import { GemType, GEM_COLORS, Gem } from '../puzzle/Gem';
import { BOARD_SIZE } from '../puzzle/Board';

const GEM_SIZE = 0.85;
const GEM_SPACING = 1.1;

// Cached geometries and materials for performance
const geometryCache: Map<GemType, THREE.BufferGeometry> = new Map();
const materialCache: Map<string, THREE.Material> = new Map();

export interface GemMeshData {
  gem: Gem;
  mesh: THREE.Group;
  targetPosition: THREE.Vector3;
  isAnimating: boolean;
  isSelected: boolean;
  baseY: number;
}

function createCachedGeometries(): void {
  if (geometryCache.size > 0) return;

  // Ruby - Heart-like octahedron
  const rubyGeom = new THREE.OctahedronGeometry(GEM_SIZE * 0.45, 0);
  rubyGeom.scale(1, 1.1, 0.8);

  // Sapphire - Smooth sphere with facets
  const sapphireGeom = new THREE.IcosahedronGeometry(GEM_SIZE * 0.42, 1);

  // Emerald - Rectangle cut
  const emeraldGeom = new THREE.BoxGeometry(GEM_SIZE * 0.7, GEM_SIZE * 0.85, GEM_SIZE * 0.4);
  emeraldGeom.translate(0, 0, GEM_SIZE * 0.1);

  // Diamond - Classic brilliant cut
  const diamondGeom = new THREE.OctahedronGeometry(GEM_SIZE * 0.48, 0);
  diamondGeom.scale(1, 1.3, 1);

  // Amethyst - Crystal cluster look
  const amethystGeom = new THREE.DodecahedronGeometry(GEM_SIZE * 0.4, 0);

  // Gold Bracelet - Torus
  const braceletGeom = new THREE.TorusGeometry(GEM_SIZE * 0.32, GEM_SIZE * 0.12, 12, 24);
  braceletGeom.rotateX(Math.PI / 2);

  // Pearl Earring - Smooth sphere
  const earringGeom = new THREE.SphereGeometry(GEM_SIZE * 0.35, 24, 24);

  geometryCache.set(GemType.Ruby, rubyGeom);
  geometryCache.set(GemType.Sapphire, sapphireGeom);
  geometryCache.set(GemType.Emerald, emeraldGeom);
  geometryCache.set(GemType.Diamond, diamondGeom);
  geometryCache.set(GemType.Amethyst, amethystGeom);
  geometryCache.set(GemType.GoldBracelet, braceletGeom);
  geometryCache.set(GemType.PearlEarring, earringGeom);
}

function getCachedMaterial(gemType: GemType): THREE.Material {
  const cacheKey = gemType;
  if (materialCache.has(cacheKey)) {
    return materialCache.get(cacheKey)!;
  }

  const colors = GEM_COLORS[gemType];

  let material: THREE.Material;

  if (gemType === GemType.Diamond) {
    // Diamond - Very shiny with rainbow reflections
    material = new THREE.MeshStandardMaterial({
      color: colors.primary,
      metalness: 0.1,
      roughness: 0.0,
      emissive: colors.glow,
      emissiveIntensity: 0.3,
    });
  } else if (gemType === GemType.GoldBracelet) {
    // Gold - Metallic
    material = new THREE.MeshStandardMaterial({
      color: colors.primary,
      metalness: 0.9,
      roughness: 0.2,
      emissive: colors.glow,
      emissiveIntensity: 0.15,
    });
  } else if (gemType === GemType.PearlEarring) {
    // Pearl - Soft luster
    material = new THREE.MeshStandardMaterial({
      color: colors.primary,
      metalness: 0.0,
      roughness: 0.2,
      emissive: colors.glow,
      emissiveIntensity: 0.1,
    });
  } else {
    // Colored gems - Vibrant and shiny
    material = new THREE.MeshStandardMaterial({
      color: colors.primary,
      metalness: 0.15,
      roughness: 0.1,
      emissive: colors.glow,
      emissiveIntensity: 0.25,
    });
  }

  materialCache.set(cacheKey, material);
  return material;
}

export class GemMeshFactory {
  constructor() {
    createCachedGeometries();
  }

  createMesh(gem: Gem): THREE.Group {
    const group = new THREE.Group();
    const geometry = geometryCache.get(gem.type)!;
    const material = getCachedMaterial(gem.type).clone();
    const colors = GEM_COLORS[gem.type];

    // Main gem mesh
    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.castShadow = true;
    mainMesh.receiveShadow = true;
    mainMesh.name = 'main';
    group.add(mainMesh);

    // Simple glow sprite (much more performant than mesh glow)
    const glowColor = new THREE.Color(colors.glow);
    const spriteMaterial = new THREE.SpriteMaterial({
      color: glowColor,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const glowSprite = new THREE.Sprite(spriteMaterial);
    glowSprite.scale.setScalar(GEM_SIZE * 1.5);
    glowSprite.name = 'glow';
    group.add(glowSprite);

    // Selection indicator (simple ring)
    const ringGeom = new THREE.RingGeometry(GEM_SIZE * 0.5, GEM_SIZE * 0.6, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -GEM_SIZE * 0.4;
    ring.visible = false;
    ring.name = 'ring';
    group.add(ring);

    const position = this.boardToWorld(gem.position.row, gem.position.col);
    group.position.copy(position);

    group.userData.gem = gem;
    group.userData.gemType = gem.type;

    return group;
  }

  boardToWorld(row: number, col: number): THREE.Vector3 {
    const offsetX = -(BOARD_SIZE - 1) * GEM_SPACING * 0.5;
    const offsetY = (BOARD_SIZE - 1) * GEM_SPACING * 0.5;

    return new THREE.Vector3(
      col * GEM_SPACING + offsetX,
      -row * GEM_SPACING + offsetY,
      0
    );
  }

  worldToBoard(position: THREE.Vector3): { row: number; col: number } | null {
    const offsetX = -(BOARD_SIZE - 1) * GEM_SPACING * 0.5;
    const offsetY = (BOARD_SIZE - 1) * GEM_SPACING * 0.5;

    const col = Math.round((position.x - offsetX) / GEM_SPACING);
    const row = Math.round((offsetY - position.y) / GEM_SPACING);

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      return { row, col };
    }
    return null;
  }

  dispose(): void {
    geometryCache.forEach(g => g.dispose());
    materialCache.forEach(m => m.dispose());
    geometryCache.clear();
    materialCache.clear();
  }
}

export class GemMeshManager {
  private factory: GemMeshFactory;
  private meshes: Map<string, GemMeshData> = new Map();
  private scene: THREE.Scene;
  private animationSpeed: number = 12;
  private time: number = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.factory = new GemMeshFactory();
  }

  addGem(gem: Gem): THREE.Group {
    const mesh = this.factory.createMesh(gem);
    this.scene.add(mesh);

    const meshData: GemMeshData = {
      gem,
      mesh,
      targetPosition: mesh.position.clone(),
      isAnimating: false,
      isSelected: false,
      baseY: mesh.position.y,
    };

    this.meshes.set(gem.id, meshData);
    return mesh;
  }

  removeGem(gemId: string): void {
    const meshData = this.meshes.get(gemId);
    if (meshData) {
      this.scene.remove(meshData.mesh);
      // Don't dispose materials as they're cached
      meshData.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'ring') {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
        if (child instanceof THREE.Sprite) {
          (child.material as THREE.Material).dispose();
        }
      });
      this.meshes.delete(gemId);
    }
  }

  updateGemPosition(gemId: string, row: number, col: number, animate: boolean = true): void {
    const meshData = this.meshes.get(gemId);
    if (!meshData) return;

    const targetPos = this.factory.boardToWorld(row, col);
    meshData.baseY = targetPos.y;

    if (animate) {
      meshData.targetPosition.copy(targetPos);
      meshData.isAnimating = true;
    } else {
      meshData.mesh.position.copy(targetPos);
      meshData.targetPosition.copy(targetPos);
    }
  }

  spawnGemFromTop(gem: Gem): THREE.Group {
    const mesh = this.factory.createMesh(gem);

    const targetPos = this.factory.boardToWorld(gem.position.row, gem.position.col);
    mesh.position.set(targetPos.x, targetPos.y + BOARD_SIZE * GEM_SPACING, targetPos.z);

    this.scene.add(mesh);

    const meshData: GemMeshData = {
      gem,
      mesh,
      targetPosition: targetPos.clone(),
      isAnimating: true,
      isSelected: false,
      baseY: targetPos.y,
    };

    this.meshes.set(gem.id, meshData);
    return mesh;
  }

  setSelected(gemId: string, selected: boolean): void {
    const meshData = this.meshes.get(gemId);
    if (!meshData) return;

    meshData.isSelected = selected;

    const ring = meshData.mesh.getObjectByName('ring');
    if (ring) {
      ring.visible = selected;
    }

    // Scale effect
    const main = meshData.mesh.getObjectByName('main');
    if (main) {
      if (selected) {
        main.scale.setScalar(1.2);
      } else {
        main.scale.setScalar(1.0);
      }
    }

    // Glow intensity
    const glow = meshData.mesh.getObjectByName('glow') as THREE.Sprite;
    if (glow) {
      (glow.material as THREE.SpriteMaterial).opacity = selected ? 0.7 : 0.4;
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    this.meshes.forEach((meshData, gemId) => {
      const mesh = meshData.mesh;

      // Position animation - fast interpolation
      if (meshData.isAnimating) {
        const target = meshData.targetPosition;
        const diff = new THREE.Vector3().subVectors(target, mesh.position);
        const distance = diff.length();

        if (distance < 0.02) {
          mesh.position.copy(target);
          meshData.isAnimating = false;
        } else {
          mesh.position.lerp(target, Math.min(1, this.animationSpeed * deltaTime));
        }
      }

      // Idle animations - minimal for performance
      const gem = meshData.gem;
      const phase = gem.position.row * 0.3 + gem.position.col * 0.5;

      // Gentle rotation
      mesh.rotation.y = this.time * 0.8 + phase;

      // Subtle bob
      if (!meshData.isAnimating) {
        mesh.position.z = Math.sin(this.time * 2 + phase) * 0.02;
      }

      // Selection ring animation
      if (meshData.isSelected) {
        const ring = mesh.getObjectByName('ring') as THREE.Mesh;
        if (ring) {
          ring.rotation.z = this.time * 4;
        }
      }

      // Glow pulse
      const glow = mesh.getObjectByName('glow') as THREE.Sprite;
      if (glow) {
        const baseOpacity = meshData.isSelected ? 0.7 : 0.4;
        const pulse = Math.sin(this.time * 3 + phase) * 0.1;
        (glow.material as THREE.SpriteMaterial).opacity = baseOpacity + pulse;
      }
    });
  }

  getMesh(gemId: string): THREE.Group | null {
    return this.meshes.get(gemId)?.mesh || null;
  }

  getMeshData(gemId: string): GemMeshData | null {
    return this.meshes.get(gemId) || null;
  }

  isAnimating(): boolean {
    for (const meshData of this.meshes.values()) {
      if (meshData.isAnimating) return true;
    }
    return false;
  }

  highlightHint(row: number, col: number): void {
    for (const meshData of this.meshes.values()) {
      if (meshData.gem.position.row === row && meshData.gem.position.col === col) {
        const glow = meshData.mesh.getObjectByName('glow') as THREE.Sprite;
        if (glow) {
          (glow.material as THREE.SpriteMaterial).color.setHex(0xffff00);
          setTimeout(() => {
            const colors = GEM_COLORS[meshData.gem.type];
            (glow.material as THREE.SpriteMaterial).color.setHex(colors.glow);
          }, 1500);
        }
        break;
      }
    }
  }

  clear(): void {
    this.meshes.forEach((meshData) => {
      this.scene.remove(meshData.mesh);
      meshData.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.name === 'ring') {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
        if (child instanceof THREE.Sprite) {
          (child.material as THREE.Material).dispose();
        }
      });
    });
    this.meshes.clear();
  }

  getFactory(): GemMeshFactory {
    return this.factory;
  }

  dispose(): void {
    this.clear();
    this.factory.dispose();
  }
}
