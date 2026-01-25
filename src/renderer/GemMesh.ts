import * as THREE from 'three';
import { GemType, GEM_COLORS, Gem, PowerupType } from '../puzzle/Gem';
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

    // Create gem materials with transparency for realistic gem appearance
    let material: THREE.MeshPhysicalMaterial;

    if (gem.type === GemType.Diamond) {
      // Diamond - brilliant clear with blue fire
      material = new THREE.MeshPhysicalMaterial({
        color: 0xeeffff,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.9,        // High transparency
        thickness: 0.5,           // Refraction depth
        ior: 2.4,                 // Diamond's index of refraction
        emissive: 0x4488ff,
        emissiveIntensity: 0.15,
        envMapIntensity: 2.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
    } else if (gem.type === GemType.GoldBracelet) {
      // Gold - rich luxurious metallic (no transparency)
      material = new THREE.MeshPhysicalMaterial({
        color: 0xffcc33,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0xcc9900,
        emissiveIntensity: 0.25,
        envMapIntensity: 1.5,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1,
      });
    } else if (gem.type === GemType.PearlEarring) {
      // Pearl - lustrous iridescent (slight translucency)
      material = new THREE.MeshPhysicalMaterial({
        color: 0xfff8f0,
        metalness: 0.0,
        roughness: 0.15,
        transmission: 0.1,
        thickness: 0.3,
        emissive: 0xffeedd,
        emissiveIntensity: 0.1,
        envMapIntensity: 1.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.2,
        sheen: 1.0,
        sheenColor: new THREE.Color(0xffddcc),
        sheenRoughness: 0.3,
      });
    } else if (gem.type === GemType.Ruby) {
      // Ruby - deep red with inner fire
      material = new THREE.MeshPhysicalMaterial({
        color: 0xee2244,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.6,
        thickness: 0.8,
        ior: 1.77,                // Ruby's IOR
        emissive: 0xcc1133,
        emissiveIntensity: 0.35,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
    } else if (gem.type === GemType.Sapphire) {
      // Sapphire - deep blue transparency
      material = new THREE.MeshPhysicalMaterial({
        color: 0x3355dd,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.6,
        thickness: 0.8,
        ior: 1.77,                // Sapphire's IOR
        emissive: 0x2244bb,
        emissiveIntensity: 0.3,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
    } else if (gem.type === GemType.Emerald) {
      // Emerald - rich green with depth
      material = new THREE.MeshPhysicalMaterial({
        color: 0x33cc66,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.65,
        thickness: 0.7,
        ior: 1.58,                // Emerald's IOR
        emissive: 0x22aa55,
        emissiveIntensity: 0.3,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
    } else {
      // Amethyst - royal purple with clarity
      material = new THREE.MeshPhysicalMaterial({
        color: 0xaa44dd,
        metalness: 0.0,
        roughness: 0.0,
        transmission: 0.6,
        thickness: 0.8,
        ior: 1.54,                // Quartz IOR
        emissive: 0x8833bb,
        emissiveIntensity: 0.3,
        envMapIntensity: 1.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.0,
      });
    }

    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.name = 'gem';

    // Rotate gold bracelet to lay flat
    if (gem.type === GemType.GoldBracelet) {
      mainMesh.rotation.x = Math.PI / 2;
    }

    group.add(mainMesh);

    // Add multiple sparkle highlights for extra brilliance
    if (gem.type !== GemType.PearlEarring && gem.type !== GemType.GoldBracelet) {
      // Main highlight
      const highlightGeom = new THREE.SphereGeometry(GEM_SIZE * 0.1, 8, 6);
      const highlightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
      });
      const highlight = new THREE.Mesh(highlightGeom, highlightMat);
      highlight.position.set(GEM_SIZE * 0.15, GEM_SIZE * 0.25, GEM_SIZE * 0.25);
      highlight.name = 'highlight';
      group.add(highlight);

      // Secondary smaller sparkle
      const sparkle2Geom = new THREE.SphereGeometry(GEM_SIZE * 0.06, 6, 4);
      const sparkle2Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
      });
      const sparkle2 = new THREE.Mesh(sparkle2Geom, sparkle2Mat);
      sparkle2.position.set(-GEM_SIZE * 0.1, GEM_SIZE * 0.15, GEM_SIZE * 0.2);
      sparkle2.name = 'highlight2';
      group.add(sparkle2);

      // Tiny accent sparkle
      const sparkle3Geom = new THREE.SphereGeometry(GEM_SIZE * 0.04, 6, 4);
      const sparkle3Mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      });
      const sparkle3 = new THREE.Mesh(sparkle3Geom, sparkle3Mat);
      sparkle3.position.set(GEM_SIZE * 0.05, -GEM_SIZE * 0.1, GEM_SIZE * 0.22);
      sparkle3.name = 'highlight3';
      group.add(sparkle3);
    } else if (gem.type === GemType.PearlEarring) {
      // Pearl gets a soft luster highlight
      const pearlHighlightGeom = new THREE.SphereGeometry(GEM_SIZE * 0.12, 8, 6);
      const pearlHighlightMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.5,
      });
      const pearlHighlight = new THREE.Mesh(pearlHighlightGeom, pearlHighlightMat);
      pearlHighlight.position.set(GEM_SIZE * 0.12, GEM_SIZE * 0.15, GEM_SIZE * 0.2);
      pearlHighlight.name = 'highlight';
      group.add(pearlHighlight);
    } else if (gem.type === GemType.GoldBracelet) {
      // Gold gets a metallic shine highlight
      const goldHighlightGeom = new THREE.SphereGeometry(GEM_SIZE * 0.08, 8, 6);
      const goldHighlightMat = new THREE.MeshBasicMaterial({
        color: 0xffffcc,
        transparent: true,
        opacity: 0.7,
      });
      const goldHighlight = new THREE.Mesh(goldHighlightGeom, goldHighlightMat);
      goldHighlight.position.set(GEM_SIZE * 0.2, GEM_SIZE * 0.1, GEM_SIZE * 0.15);
      goldHighlight.name = 'highlight';
      group.add(goldHighlight);
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

    // Add powerup indicators - floating bands ABOVE the gem (no clipping)
    if (gem.powerup === PowerupType.Star) {
      // Star gem - sparkling golden band floating above
      const bandGroup = new THREE.Group();
      bandGroup.position.y = GEM_SIZE * 0.7; // Float above the gem
      bandGroup.name = 'powerup-star-band';

      // Create curved band using a partial torus (arc shape)
      const bandGeom = new THREE.TorusGeometry(GEM_SIZE * 0.5, 0.04, 8, 32, Math.PI * 1.5);
      const bandMat = new THREE.MeshBasicMaterial({
        color: 0xffd700,
        transparent: true,
        opacity: 0.9,
      });
      const band = new THREE.Mesh(bandGeom, bandMat);
      band.rotation.x = Math.PI / 2;
      band.name = 'star-band-main';
      bandGroup.add(band);

      // Add sparkle stars along the band
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 1.5 - Math.PI * 0.75;
        const starShape = new THREE.Shape();
        const outerR = 0.06;
        const innerR = 0.025;

        for (let j = 0; j < 10; j++) {
          const r = j % 2 === 0 ? outerR : innerR;
          const a = (j * Math.PI) / 5 - Math.PI / 2;
          const x = Math.cos(a) * r;
          const y = Math.sin(a) * r;
          if (j === 0) starShape.moveTo(x, y);
          else starShape.lineTo(x, y);
        }
        starShape.closePath();

        const miniStarGeom = new THREE.ShapeGeometry(starShape);
        const miniStarMat = new THREE.MeshBasicMaterial({
          color: 0xffffcc,
          transparent: true,
          opacity: 0.95,
          side: THREE.DoubleSide,
        });
        const miniStar = new THREE.Mesh(miniStarGeom, miniStarMat);
        miniStar.position.set(
          Math.cos(angle) * GEM_SIZE * 0.5,
          0.05,
          Math.sin(angle) * GEM_SIZE * 0.5
        );
        miniStar.rotation.x = -Math.PI / 2;
        miniStar.name = `star-sparkle-${i}`;
        bandGroup.add(miniStar);
      }

      group.add(bandGroup);
    } else if (gem.powerup === PowerupType.Rainbow) {
      // Rainbow gem - colorful rainbow arc floating above
      const bandGroup = new THREE.Group();
      bandGroup.position.y = GEM_SIZE * 0.7; // Float above the gem
      bandGroup.name = 'powerup-rainbow-band';

      // Create rainbow bands (multiple arcs stacked)
      const rainbowColors = [0xff0000, 0xff8800, 0xffff00, 0x00dd44, 0x0088ff, 0x8844ff];

      rainbowColors.forEach((color, i) => {
        const radius = GEM_SIZE * 0.4 + i * 0.035;
        const arcGeom = new THREE.TorusGeometry(radius, 0.025, 6, 24, Math.PI);
        const arcMat = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.9,
        });
        const arc = new THREE.Mesh(arcGeom, arcMat);
        arc.rotation.x = Math.PI / 2;
        arc.rotation.z = Math.PI; // Flip to arch upward
        arc.position.y = 0.02 + i * 0.01;
        arc.name = `rainbow-arc-${i}`;
        bandGroup.add(arc);
      });

      // Add shimmer particles at the ends
      const shimmerPositions = [
        { x: -GEM_SIZE * 0.55, z: 0 },
        { x: GEM_SIZE * 0.55, z: 0 },
      ];
      shimmerPositions.forEach((pos, i) => {
        const shimmerGeom = new THREE.SphereGeometry(0.05, 8, 6);
        const shimmerMat = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8,
        });
        const shimmer = new THREE.Mesh(shimmerGeom, shimmerMat);
        shimmer.position.set(pos.x, 0, pos.z);
        shimmer.name = `rainbow-shimmer-${i}`;
        bandGroup.add(shimmer);
      });

      group.add(bandGroup);
    }

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

      // Highlight shimmer - multiple sparkles
      const highlight = mesh.getObjectByName('highlight') as THREE.Mesh;
      if (highlight) {
        const shimmer = 0.5 + Math.sin(this.time * 2.5 + phase) * 0.4;
        (highlight.material as THREE.MeshBasicMaterial).opacity = shimmer;
      }

      const highlight2 = mesh.getObjectByName('highlight2') as THREE.Mesh;
      if (highlight2) {
        const shimmer2 = 0.4 + Math.sin(this.time * 3 + phase + 1) * 0.35;
        (highlight2.material as THREE.MeshBasicMaterial).opacity = shimmer2;
      }

      const highlight3 = mesh.getObjectByName('highlight3') as THREE.Mesh;
      if (highlight3) {
        const shimmer3 = 0.3 + Math.sin(this.time * 4 + phase + 2) * 0.35;
        (highlight3.material as THREE.MeshBasicMaterial).opacity = shimmer3;
      }

      // Powerup animations - floating bands above gems
      const starBand = mesh.getObjectByName('powerup-star-band') as THREE.Group;
      if (starBand) {
        // Band rotates and bobs gently
        starBand.rotation.y = this.time * 1.5;
        starBand.position.y = GEM_SIZE * 0.7 + Math.sin(this.time * 2) * 0.03;

        // Main band pulses
        const mainBand = starBand.getObjectByName('star-band-main') as THREE.Mesh;
        if (mainBand) {
          (mainBand.material as THREE.MeshBasicMaterial).opacity = 0.7 + Math.sin(this.time * 3) * 0.3;
        }

        // Sparkle stars twinkle
        for (let i = 0; i < 5; i++) {
          const sparkle = starBand.getObjectByName(`star-sparkle-${i}`) as THREE.Mesh;
          if (sparkle) {
            const twinkle = 0.6 + Math.sin(this.time * 5 + i * 1.2) * 0.4;
            (sparkle.material as THREE.MeshBasicMaterial).opacity = twinkle;
            sparkle.rotation.z = this.time * 2 + i;
            const scale = 0.8 + Math.sin(this.time * 4 + i * 0.8) * 0.3;
            sparkle.scale.setScalar(scale);
          }
        }
      }

      const rainbowBand = mesh.getObjectByName('powerup-rainbow-band') as THREE.Group;
      if (rainbowBand) {
        // Rainbow band rotates and bobs
        rainbowBand.rotation.y = this.time * 0.8;
        rainbowBand.position.y = GEM_SIZE * 0.7 + Math.sin(this.time * 1.5 + 0.5) * 0.03;

        // Rainbow arcs shimmer
        for (let i = 0; i < 6; i++) {
          const arc = rainbowBand.getObjectByName(`rainbow-arc-${i}`) as THREE.Mesh;
          if (arc) {
            const shimmer = 0.7 + Math.sin(this.time * 3 + i * 0.5) * 0.3;
            (arc.material as THREE.MeshBasicMaterial).opacity = shimmer;
          }
        }

        // End shimmers pulse
        for (let i = 0; i < 2; i++) {
          const shimmer = rainbowBand.getObjectByName(`rainbow-shimmer-${i}`) as THREE.Mesh;
          if (shimmer) {
            const pulse = 1 + Math.sin(this.time * 4 + i * Math.PI) * 0.3;
            shimmer.scale.setScalar(pulse);
            (shimmer.material as THREE.MeshBasicMaterial).opacity = 0.6 + Math.sin(this.time * 5 + i) * 0.4;
          }
        }
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
          const material = gemMesh.material as THREE.MeshPhysicalMaterial;
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
        const material = gemMesh.material as THREE.MeshPhysicalMaterial;
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
            (gemMesh.material as THREE.MeshPhysicalMaterial).opacity = 1 - progress;
            (gemMesh.material as THREE.MeshPhysicalMaterial).transparent = true;
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
