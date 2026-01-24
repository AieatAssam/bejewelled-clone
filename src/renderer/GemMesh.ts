import * as THREE from 'three';
import { GemType, GEM_COLORS, Gem } from '../puzzle/Gem';
import { createStandardGemMaterial } from './ShaderEffects';
import { BOARD_SIZE } from '../puzzle/Board';

const GEM_SIZE = 0.8;
const GEM_SPACING = 1.0;

export interface GemMeshData {
  gem: Gem;
  mesh: THREE.Mesh;
  targetPosition: THREE.Vector3;
  isAnimating: boolean;
}

export class GemMeshFactory {
  private geometries: Map<GemType, THREE.BufferGeometry> = new Map();
  private materials: Map<GemType, THREE.Material> = new Map();

  constructor() {
    this.createGeometries();
    this.createMaterials();
  }

  private createGeometries(): void {
    // Diamond-cut octahedron for gems
    const gemGeometry = new THREE.OctahedronGeometry(GEM_SIZE * 0.5, 0);

    // Slightly different shapes for variety
    const sphereGeometry = new THREE.IcosahedronGeometry(GEM_SIZE * 0.45, 1);
    const torusGeometry = new THREE.TorusGeometry(GEM_SIZE * 0.35, GEM_SIZE * 0.15, 8, 16);
    const ringGeometry = new THREE.TorusGeometry(GEM_SIZE * 0.3, GEM_SIZE * 0.1, 8, 16);

    this.geometries.set(GemType.Ruby, gemGeometry);
    this.geometries.set(GemType.Sapphire, gemGeometry.clone());
    this.geometries.set(GemType.Emerald, gemGeometry.clone());
    this.geometries.set(GemType.Diamond, sphereGeometry);
    this.geometries.set(GemType.Amethyst, gemGeometry.clone());
    this.geometries.set(GemType.GoldBracelet, torusGeometry);
    this.geometries.set(GemType.PearlEarring, ringGeometry);
  }

  private createMaterials(): void {
    for (const gemType of Object.values(GemType)) {
      const colors = GEM_COLORS[gemType];
      const material = createStandardGemMaterial(colors.primary, colors.glow);
      this.materials.set(gemType, material);
    }
  }

  createMesh(gem: Gem): THREE.Mesh {
    const geometry = this.geometries.get(gem.type)!;
    const baseMaterial = this.materials.get(gem.type)!;

    // Clone material for individual gem manipulation
    const material = baseMaterial.clone();

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const position = this.boardToWorld(gem.position.row, gem.position.col);
    mesh.position.copy(position);

    // Add slight random rotation for visual interest
    mesh.rotation.x = Math.random() * 0.2;
    mesh.rotation.y = Math.random() * Math.PI * 2;

    // Store gem reference
    mesh.userData.gem = gem;
    mesh.userData.gemType = gem.type;

    return mesh;
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

  updateSpecialGem(mesh: THREE.Mesh, isSpecial: boolean, isSuper: boolean): void {
    const material = mesh.material as THREE.MeshPhysicalMaterial;

    if (isSuper) {
      material.emissiveIntensity = 0.5;
      mesh.scale.setScalar(1.2);
    } else if (isSpecial) {
      material.emissiveIntensity = 0.3;
      mesh.scale.setScalar(1.1);
    }
  }

  dispose(): void {
    this.geometries.forEach(g => g.dispose());
    this.materials.forEach(m => m.dispose());
  }
}

export class GemMeshManager {
  private factory: GemMeshFactory;
  private meshes: Map<string, GemMeshData> = new Map();
  private scene: THREE.Scene;
  private animationSpeed: number = 8;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.factory = new GemMeshFactory();
  }

  addGem(gem: Gem): THREE.Mesh {
    const mesh = this.factory.createMesh(gem);
    this.scene.add(mesh);

    const meshData: GemMeshData = {
      gem,
      mesh,
      targetPosition: mesh.position.clone(),
      isAnimating: false,
    };

    this.meshes.set(gem.id, meshData);
    return mesh;
  }

  removeGem(gemId: string): void {
    const meshData = this.meshes.get(gemId);
    if (meshData) {
      this.scene.remove(meshData.mesh);
      meshData.mesh.geometry.dispose();
      (meshData.mesh.material as THREE.Material).dispose();
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

  spawnGemFromTop(gem: Gem): THREE.Mesh {
    const mesh = this.factory.createMesh(gem);

    // Start above the board
    const targetPos = this.factory.boardToWorld(gem.position.row, gem.position.col);
    mesh.position.set(targetPos.x, targetPos.y + BOARD_SIZE * GEM_SPACING, targetPos.z);

    this.scene.add(mesh);

    const meshData: GemMeshData = {
      gem,
      mesh,
      targetPosition: targetPos,
      isAnimating: true,
    };

    this.meshes.set(gem.id, meshData);
    return mesh;
  }

  update(deltaTime: number): void {
    this.meshes.forEach((meshData) => {
      if (meshData.isAnimating) {
        const mesh = meshData.mesh;
        const target = meshData.targetPosition;

        // Smooth lerp towards target
        mesh.position.lerp(target, this.animationSpeed * deltaTime);

        // Check if close enough to stop animating
        if (mesh.position.distanceTo(target) < 0.01) {
          mesh.position.copy(target);
          meshData.isAnimating = false;
        }
      }

      // Add subtle floating animation
      const time = Date.now() * 0.001;
      const gem = meshData.gem;
      meshData.mesh.rotation.y += deltaTime * 0.5;
      meshData.mesh.position.z = Math.sin(time + gem.position.row + gem.position.col) * 0.05;
    });
  }

  getMesh(gemId: string): THREE.Mesh | null {
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

  clear(): void {
    this.meshes.forEach((meshData) => {
      this.scene.remove(meshData.mesh);
      meshData.mesh.geometry.dispose();
      (meshData.mesh.material as THREE.Material).dispose();
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
