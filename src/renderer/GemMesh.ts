import * as THREE from 'three';
import { GemType, GEM_COLORS, Gem } from '../puzzle/Gem';
import { BOARD_SIZE } from '../puzzle/Board';

const GEM_SIZE = 0.42;
const GEM_SPACING = 1.05;

// Shared geometries for performance
let geometriesCreated = false;
const sharedGeometries: Map<GemType, THREE.BufferGeometry> = new Map();

function createSharedGeometries(): void {
  if (geometriesCreated) return;
  geometriesCreated = true;

  // Ruby - Faceted octahedron, compact
  const rubyGeom = new THREE.OctahedronGeometry(GEM_SIZE * 0.9, 0);
  rubyGeom.scale(1, 1.1, 0.8);
  sharedGeometries.set(GemType.Ruby, rubyGeom);

  // Sapphire - Round brilliant cut
  const sapphireGeom = new THREE.IcosahedronGeometry(GEM_SIZE * 0.8, 0);
  sharedGeometries.set(GemType.Sapphire, sapphireGeom);

  // Emerald - Rectangular step cut (box with bevels)
  const emeraldGeom = new THREE.BoxGeometry(GEM_SIZE * 1.2, GEM_SIZE * 0.8, GEM_SIZE * 0.6);
  sharedGeometries.set(GemType.Emerald, emeraldGeom);

  // Diamond - Small brilliant octahedron
  const diamondGeom = new THREE.OctahedronGeometry(GEM_SIZE * 0.7, 0);
  diamondGeom.scale(1, 1.1, 1);
  sharedGeometries.set(GemType.Diamond, diamondGeom);

  // Amethyst - Dodecahedron crystal
  const amethystGeom = new THREE.DodecahedronGeometry(GEM_SIZE * 0.75, 0);
  sharedGeometries.set(GemType.Amethyst, amethystGeom);

  // Gold Bracelet - Simple torus ring
  const braceletGeom = new THREE.TorusGeometry(GEM_SIZE * 0.5, GEM_SIZE * 0.2, 8, 16);
  sharedGeometries.set(GemType.GoldBracelet, braceletGeom);

  // Pearl Earring - Small smooth sphere
  const pearlGeom = new THREE.SphereGeometry(GEM_SIZE * 0.55, 16, 12);
  sharedGeometries.set(GemType.PearlEarring, pearlGeom);
}

export interface GemMeshData {
  gem: Gem;
  mesh: THREE.Group;
  targetPosition: THREE.Vector3;
  isAnimating: boolean;
  isSelected: boolean;
}

export class GemMeshFactory {
  constructor() {
    createSharedGeometries();
  }

  createMesh(gem: Gem): THREE.Group {
    const group = new THREE.Group();
    const geometry = sharedGeometries.get(gem.type)!;

    // Create rich, saturated gem materials
    let material: THREE.MeshStandardMaterial;

    if (gem.type === GemType.Diamond) {
      // Diamond - sparkling clear with subtle blue tint
      material = new THREE.MeshStandardMaterial({
        color: 0xaaeeff,
        metalness: 0.1,
        roughness: 0.0,
        emissive: 0x4488cc,
        emissiveIntensity: 0.15,
      });
    } else if (gem.type === GemType.GoldBracelet) {
      // Gold - rich metallic yellow
      material = new THREE.MeshStandardMaterial({
        color: 0xffaa00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0x996600,
        emissiveIntensity: 0.2,
      });
    } else if (gem.type === GemType.PearlEarring) {
      // Pearl - creamy white with pink tint
      material = new THREE.MeshStandardMaterial({
        color: 0xfff0e8,
        metalness: 0.2,
        roughness: 0.3,
        emissive: 0xffddcc,
        emissiveIntensity: 0.1,
      });
    } else if (gem.type === GemType.Ruby) {
      // Ruby - DEEP rich red
      material = new THREE.MeshStandardMaterial({
        color: 0xcc0022,
        metalness: 0.1,
        roughness: 0.05,
        emissive: 0x660011,
        emissiveIntensity: 0.3,
      });
    } else if (gem.type === GemType.Sapphire) {
      // Sapphire - DEEP royal blue
      material = new THREE.MeshStandardMaterial({
        color: 0x1133aa,
        metalness: 0.1,
        roughness: 0.05,
        emissive: 0x0a1a55,
        emissiveIntensity: 0.3,
      });
    } else if (gem.type === GemType.Emerald) {
      // Emerald - DEEP rich green
      material = new THREE.MeshStandardMaterial({
        color: 0x118844,
        metalness: 0.1,
        roughness: 0.1,
        emissive: 0x084422,
        emissiveIntensity: 0.25,
      });
    } else {
      // Amethyst - DEEP purple
      material = new THREE.MeshStandardMaterial({
        color: 0x7722aa,
        metalness: 0.1,
        roughness: 0.05,
        emissive: 0x3a1155,
        emissiveIntensity: 0.3,
      });
    }

    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.name = 'gem';

    // Rotate gold bracelet to lay flat
    if (gem.type === GemType.GoldBracelet) {
      mainMesh.rotation.x = Math.PI / 2;
    }

    group.add(mainMesh);

    // Add single bright highlight sparkle
    if (gem.type !== GemType.PearlEarring && gem.type !== GemType.GoldBracelet) {
      const highlightGeom = new THREE.SphereGeometry(GEM_SIZE * 0.1, 8, 6);
      const highlightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85,
      });
      const highlight = new THREE.Mesh(highlightGeom, highlightMat);
      highlight.position.set(GEM_SIZE * 0.15, GEM_SIZE * 0.25, GEM_SIZE * 0.2);
      highlight.name = 'highlight';
      group.add(highlight);
    }

    // Selection ring (hidden by default)
    const ringGeom = new THREE.TorusGeometry(GEM_SIZE * 1.2, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffff44,
      transparent: true,
      opacity: 0.9,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -GEM_SIZE * 0.3;
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
    sharedGeometries.forEach(g => g.dispose());
    sharedGeometries.clear();
    geometriesCreated = false;
  }
}

export class GemMeshManager {
  private factory: GemMeshFactory;
  private meshes: Map<string, GemMeshData> = new Map();
  private scene: THREE.Scene;
  private animationSpeed: number = 15;
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
    };

    this.meshes.set(gem.id, meshData);
    return mesh;
  }

  removeGem(gemId: string): void {
    const meshData = this.meshes.get(gemId);
    if (meshData) {
      this.scene.remove(meshData.mesh);
      meshData.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === 'ring' || child.name === 'highlight') {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
        }
      });
      this.meshes.delete(gemId);
    }
  }

  updateGemPosition(gemId: string, row: number, col: number, animate: boolean = true): void {
    const meshData = this.meshes.get(gemId);
    if (!meshData) return;

    const targetPos = this.factory.boardToWorld(row, col);

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

    // Scale effect on the main gem
    const gemMesh = meshData.mesh.getObjectByName('gem');
    if (gemMesh) {
      if (selected) {
        gemMesh.scale.setScalar(1.25);
      } else {
        gemMesh.scale.setScalar(1.0);
      }
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;

    this.meshes.forEach((meshData) => {
      const mesh = meshData.mesh;

      // Position animation
      if (meshData.isAnimating) {
        const target = meshData.targetPosition;
        const dist = mesh.position.distanceTo(target);

        if (dist < 0.02) {
          mesh.position.copy(target);
          meshData.isAnimating = false;
        } else {
          mesh.position.lerp(target, Math.min(1, this.animationSpeed * deltaTime));
        }
      }

      // Idle animations
      const gem = meshData.gem;
      const phase = gem.position.row * 0.4 + gem.position.col * 0.6;

      // Gentle rotation
      mesh.rotation.y = this.time * 0.5 + phase;

      // Subtle floating
      if (!meshData.isAnimating) {
        mesh.position.z = Math.sin(this.time * 1.5 + phase) * 0.015;
      }

      // Selection ring animation
      if (meshData.isSelected) {
        const ring = mesh.getObjectByName('ring') as THREE.Mesh;
        if (ring) {
          ring.rotation.z = this.time * 3;
          (ring.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(this.time * 6) * 0.3;
        }
      }

      // Highlight shimmer
      const highlight = mesh.getObjectByName('highlight') as THREE.Mesh;
      if (highlight) {
        const shimmer = 0.4 + Math.sin(this.time * 2 + phase) * 0.3;
        (highlight.material as THREE.MeshBasicMaterial).opacity = shimmer;
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
        const gemMesh = meshData.mesh.getObjectByName('gem') as THREE.Mesh;
        const ring = meshData.mesh.getObjectByName('ring') as THREE.Mesh;

        if (gemMesh) {
          const material = gemMesh.material as THREE.MeshStandardMaterial;
          const originalEmissive = material.emissiveIntensity;
          const originalScale = gemMesh.scale.x;

          // Make ring visible with golden color for hint
          if (ring) {
            ring.visible = true;
            (ring.material as THREE.MeshBasicMaterial).color.set(0xffd700);
          }

          // Flash brightly and scale up
          const flash = (bright: boolean) => {
            if (bright) {
              material.emissiveIntensity = 1.0;
              gemMesh.scale.setScalar(1.3);
            } else {
              material.emissiveIntensity = originalEmissive;
              gemMesh.scale.setScalar(originalScale);
            }
          };

          flash(true);
          setTimeout(() => flash(false), 250);
          setTimeout(() => flash(true), 500);
          setTimeout(() => flash(false), 750);
          setTimeout(() => flash(true), 1000);
          setTimeout(() => {
            flash(false);
            if (ring) ring.visible = false;
          }, 1250);
        }
        break;
      }
    }
  }

  // Highlight matched gems before they are removed - makes them glow and pulse
  highlightMatched(gemIds: string[]): void {
    for (const gemId of gemIds) {
      const meshData = this.meshes.get(gemId);
      if (!meshData) continue;

      const gemMesh = meshData.mesh.getObjectByName('gem') as THREE.Mesh;
      if (gemMesh) {
        // Make it glow brightly
        const material = gemMesh.material as THREE.MeshStandardMaterial;
        material.emissiveIntensity = 1.0;

        // Scale up for emphasis
        gemMesh.scale.setScalar(1.3);
      }
    }
  }

  // Animate matched gems disappearing with a shrink effect
  async animateRemoval(gemIds: string[]): Promise<void> {
    const meshesToAnimate: GemMeshData[] = [];

    for (const gemId of gemIds) {
      const meshData = this.meshes.get(gemId);
      if (meshData) {
        meshesToAnimate.push(meshData);
      }
    }

    // Animate shrink and fade
    return new Promise((resolve) => {
      const startTime = Date.now();
      const duration = 200; // ms

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        for (const meshData of meshesToAnimate) {
          const gemMesh = meshData.mesh.getObjectByName('gem') as THREE.Mesh;
          if (gemMesh) {
            const scale = 1.3 * (1 - progress);
            gemMesh.scale.setScalar(scale);
            (gemMesh.material as THREE.MeshStandardMaterial).opacity = 1 - progress;
            (gemMesh.material as THREE.MeshStandardMaterial).transparent = true;
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      animate();
    });
  }

  clear(): void {
    this.meshes.forEach((meshData) => {
      this.scene.remove(meshData.mesh);
      meshData.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === 'ring' || child.name === 'highlight') {
            child.geometry.dispose();
            (child.material as THREE.Material).dispose();
          }
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
