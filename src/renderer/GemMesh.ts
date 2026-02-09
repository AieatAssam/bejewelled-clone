import * as THREE from 'three';
import { GemType, Gem, PowerupType } from '../puzzle/Gem';
import { BOARD_SIZE } from '../puzzle/Board';
import {
  generateMatcapTexture,
  GEM_MATCAP_CONFIGS,
} from './ShaderEffects';

const GEM_SIZE = 0.42;
const GEM_SPACING = 1.05;

// Shared geometries for performance
let geometriesCreated = false;
const sharedGeometries: Map<GemType, THREE.BufferGeometry> = new Map();

// Map from gem type name to matcap config key
const GEM_TYPE_TO_CONFIG: Partial<Record<GemType, string>> = {
  [GemType.Diamond]: 'Diamond',
  [GemType.Ruby]: 'Ruby',
  [GemType.Sapphire]: 'Sapphire',
  [GemType.Emerald]: 'Emerald',
  [GemType.Amethyst]: 'Amethyst',
};

// Cache procedural matcap textures
const matcapTextureCache: Map<string, THREE.Texture> = new Map();

function getMatcapTexture(configKey: string): THREE.Texture {
  let tex = matcapTextureCache.get(configKey);
  if (!tex) {
    tex = generateMatcapTexture(configKey);
    matcapTextureCache.set(configKey, tex);
  }
  return tex;
}

function isMatcapGem(type: GemType): boolean {
  return type in GEM_TYPE_TO_CONFIG;
}

function createSharedGeometries(): void {
  if (geometriesCreated) return;
  geometriesCreated = true;

  // Ruby - Faceted octahedron, compact (toNonIndexed for sharp facets)
  const rubyBase = new THREE.OctahedronGeometry(GEM_SIZE * 0.9, 0);
  rubyBase.scale(1, 1.1, 0.8);
  const rubyGeom = rubyBase.toNonIndexed();
  rubyGeom.computeVertexNormals();
  sharedGeometries.set(GemType.Ruby, rubyGeom);

  // Sapphire - Round brilliant cut (toNonIndexed for facets)
  const sapphireBase = new THREE.IcosahedronGeometry(GEM_SIZE * 0.8, 0);
  const sapphireGeom = sapphireBase.toNonIndexed();
  sapphireGeom.computeVertexNormals();
  sharedGeometries.set(GemType.Sapphire, sapphireGeom);

  // Emerald - Bold octagonal step-cut gem
  // Fewer profile points = larger flat facets, more gem-like
  const eR = GEM_SIZE * 0.8;
  const emeraldProfile = [
    new THREE.Vector2(0, -eR * 0.7),            // bottom point (pavilion tip)
    new THREE.Vector2(eR * 0.85, -eR * 0.08),   // pavilion → girdle
    new THREE.Vector2(eR, 0),                    // girdle (widest)
    new THREE.Vector2(eR * 0.7, eR * 0.28),     // crown step
    new THREE.Vector2(eR * 0.5, eR * 0.35),     // table edge
    new THREE.Vector2(0, eR * 0.35),            // table center
  ];
  const emeraldBase = new THREE.LatheGeometry(emeraldProfile, 8);
  const emeraldGeom = emeraldBase.toNonIndexed();
  emeraldGeom.computeVertexNormals();
  sharedGeometries.set(GemType.Emerald, emeraldGeom);

  // Diamond - Brilliant-cut profile via LatheGeometry
  // Cross-section: culet (bottom tip) -> pavilion -> girdle -> crown -> table
  const diamondR = GEM_SIZE * 0.7;
  const diamondProfile = [
    new THREE.Vector2(0, -diamondR * 0.86),       // culet (bottom tip)
    new THREE.Vector2(diamondR * 0.95, -diamondR * 0.05), // pavilion edge at girdle
    new THREE.Vector2(diamondR, 0),                // girdle (widest point)
    new THREE.Vector2(diamondR * 0.85, diamondR * 0.16), // crown slope
    new THREE.Vector2(diamondR * 0.57, diamondR * 0.32), // table edge
    new THREE.Vector2(0, diamondR * 0.32),         // table center
  ];
  const diamondBase = new THREE.LatheGeometry(diamondProfile, 8);
  const diamondGeom = diamondBase.toNonIndexed();
  diamondGeom.computeVertexNormals();
  sharedGeometries.set(GemType.Diamond, diamondGeom);

  // Amethyst - Dodecahedron crystal (toNonIndexed for facets)
  const amethystBase = new THREE.DodecahedronGeometry(GEM_SIZE * 0.75, 0);
  const amethystGeom = amethystBase.toNonIndexed();
  amethystGeom.computeVertexNormals();
  sharedGeometries.set(GemType.Amethyst, amethystGeom);

  // Gold Bracelet - Smooth torus ring (high segments for smooth gold look)
  const braceletGeom = new THREE.TorusGeometry(GEM_SIZE * 0.5, GEM_SIZE * 0.2, 24, 48);
  sharedGeometries.set(GemType.GoldBracelet, braceletGeom);

  // Pearl Earring - Smooth sphere (keep smooth for pearl luster)
  const pearlGeom = new THREE.SphereGeometry(GEM_SIZE * 0.55, 24, 16);
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

    let material: THREE.Material;

    const configKey = GEM_TYPE_TO_CONFIG[gem.type];
    if (configKey) {
      // Use matcap material for gem types (1 texture lookup, no lighting needed)
      const matcap = getMatcapTexture(configKey);
      material = new THREE.MeshMatcapMaterial({
        matcap,
        flatShading: true,
        transparent: true,
      });
    } else if (gem.type === GemType.GoldBracelet) {
      // Gold - warm rich metallic gold
      material = new THREE.MeshPhysicalMaterial({
        color: 0xdaa520,
        metalness: 1.0,
        roughness: 0.25,
        envMapIntensity: 3.5,
        clearcoat: 0.8,
        clearcoatRoughness: 0.05,
        emissive: 0x553300,
        emissiveIntensity: 0.15,
      });
    } else {
      // Pearl - lustrous iridescent
      material = new THREE.MeshPhysicalMaterial({
        color: 0xfff5ee,
        metalness: 0.0,
        roughness: 0.2,
        envMapIntensity: 2.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
        sheen: 1.0,
        sheenColor: new THREE.Color(0xffeeff),
        sheenRoughness: 0.2,
        iridescence: 0.5,
        iridescenceIOR: 1.3,
      });
    }

    const mainMesh = new THREE.Mesh(geometry, material);
    mainMesh.name = 'gem';

    // Tilt gold bracelet so the ring face is visible
    if (gem.type === GemType.GoldBracelet) {
      mainMesh.rotation.x = Math.PI * 0.35;
    }

    group.add(mainMesh);

    // Add highlights only for Pearl and Gold (matcap gems have built-in highlights)
    if (gem.type === GemType.PearlEarring) {
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
    matcapTextureCache.forEach(t => t.dispose());
    matcapTextureCache.clear();
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

      // Gentle rotation (bracelets spin faster for visible tumble)
      if (gem.type === GemType.GoldBracelet) {
        mesh.rotation.y = this.time * 1.8 + phase;
      } else {
        mesh.rotation.y = this.time * 0.5 + phase;
      }

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
          const originalScale = gemMesh.scale.x;

          // Make ring visible with golden color for hint
          if (ring) {
            ring.visible = true;
            (ring.material as THREE.MeshBasicMaterial).color.set(0xffd700);
          }

          // For MeshPhysicalMaterial gems (gold, pearl), use emissive + scale
          // For MeshMatcapMaterial gems, use scale only
          const isPhysical = gemMesh.material instanceof THREE.MeshPhysicalMaterial;
          let originalEmissive = 0;
          if (isPhysical) {
            originalEmissive = (gemMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity;
          }

          const flash = (bright: boolean) => {
            if (bright) {
              if (isPhysical) {
                (gemMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 1.0;
              }
              gemMesh.scale.setScalar(1.3);
            } else {
              if (isPhysical) {
                (gemMesh.material as THREE.MeshPhysicalMaterial).emissiveIntensity = originalEmissive;
              }
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
        // For MeshPhysicalMaterial, use emissive glow
        if (gemMesh.material instanceof THREE.MeshPhysicalMaterial) {
          gemMesh.material.emissiveIntensity = 1.0;
        }
        // Scale up for emphasis (works for both material types)
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

            // MeshMatcapMaterial and MeshPhysicalMaterial both support opacity directly
            (gemMesh.material as THREE.Material).opacity = 1 - progress;
            (gemMesh.material as THREE.Material).transparent = true;
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
