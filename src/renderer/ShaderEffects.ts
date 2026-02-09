import * as THREE from 'three';

export interface MatcapConfig {
  /** Deep shadow color for edges/silhouette */
  shadow: string;
  /** Primary body color of the gem */
  body: string;
  /** Brighter mid-highlight (light passing through) */
  glow: string;
  /** Brightest specular highlight */
  specular: string;
  /** Secondary accent for internal reflections */
  accent: string;
}

// Matcap color palettes per gem type — vivid and saturated for dark backgrounds
export const GEM_MATCAP_CONFIGS: Record<string, MatcapConfig> = {
  Diamond: {
    shadow: '#4466aa',
    body: '#d0e0ff',
    glow: '#eef4ff',
    specular: '#ffffff',
    accent: '#99bbff',
  },
  Ruby: {
    shadow: '#550015',
    body: '#ee1144',
    glow: '#ff5577',
    specular: '#ffbbcc',
    accent: '#ff3355',
  },
  Sapphire: {
    shadow: '#0c1455',
    body: '#2255ee',
    glow: '#66aaff',
    specular: '#bbddff',
    accent: '#4488ff',
  },
  Emerald: {
    shadow: '#0a4420',
    body: '#11aa55',
    glow: '#44ee88',
    specular: '#99ffdd',
    accent: '#22cc66',
  },
  Amethyst: {
    shadow: '#220a44',
    body: '#8833dd',
    glow: '#bb66ff',
    specular: '#eeccff',
    accent: '#aa55ee',
  },
};

/**
 * Generates a procedural matcap texture (256x256) that simulates a
 * faceted gemstone. The approach:
 *
 * 1. Fill with body color (the gem is predominantly its own color)
 * 2. Radial falloff to shadow at edges (sphere illusion)
 * 3. Large soft glow in upper area (primary light)
 * 4. Multiple small bright hotspots scattered across the sphere
 *    to simulate light reflecting off internal facets
 * 5. Rim-light accent along the bottom edge for depth
 * 6. Diamond-specific rainbow fire patches
 */
export function generateMatcapTexture(configKey: string): THREE.CanvasTexture {
  const config = GEM_MATCAP_CONFIGS[configKey];
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;

  // Clip to circle (matcap is circular)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();

  // 1. Base fill with body color — gem is predominantly its own color
  ctx.fillStyle = config.body;
  ctx.fillRect(0, 0, size, size);

  // 2. Radial edge darkening — sphere illusion
  const edgeGrad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
  edgeGrad.addColorStop(0, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.6, 'rgba(0,0,0,0)');
  edgeGrad.addColorStop(0.85, 'rgba(0,0,0,0.35)');
  edgeGrad.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, size, size);

  // 3. Shadow tint at very edges for gem depth
  const shadowGrad = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
  shadowGrad.addColorStop(0, 'rgba(0,0,0,0)');
  shadowGrad.addColorStop(1, config.shadow);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(0, 0, size, size);
  ctx.globalCompositeOperation = 'source-over';

  // 4. Large soft primary light (upper-left — key light)
  ctx.globalCompositeOperation = 'screen';
  const keyLight = ctx.createRadialGradient(
    cx * 0.75, cy * 0.65, 0,
    cx * 0.75, cy * 0.65, r * 0.8
  );
  keyLight.addColorStop(0, config.specular);
  keyLight.addColorStop(0.15, config.glow);
  keyLight.addColorStop(0.5, config.body + '44');
  keyLight.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = keyLight;
  ctx.fillRect(0, 0, size, size);

  // 5. Secondary fill light (lower-right — softer)
  const fillLight = ctx.createRadialGradient(
    cx * 1.35, cy * 1.3, 0,
    cx * 1.35, cy * 1.3, r * 0.55
  );
  fillLight.addColorStop(0, config.glow + 'aa');
  fillLight.addColorStop(0.4, config.body + '44');
  fillLight.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fillLight;
  ctx.fillRect(0, 0, size, size);

  // 6. Multiple small bright hotspots — simulate internal facet reflections
  // These are what make gems sparkle vs look like plastic
  const hotspots = [
    { x: 0.38, y: 0.32, r: 0.12, intensity: 1.0 },   // Primary bright catch
    { x: 0.55, y: 0.25, r: 0.08, intensity: 0.8 },   // Secondary
    { x: 0.28, y: 0.52, r: 0.07, intensity: 0.6 },   // Left facet
    { x: 0.65, y: 0.45, r: 0.06, intensity: 0.5 },   // Right facet
    { x: 0.45, y: 0.62, r: 0.05, intensity: 0.4 },   // Lower facet
    { x: 0.72, y: 0.58, r: 0.04, intensity: 0.35 },  // Lower-right
    { x: 0.32, y: 0.72, r: 0.04, intensity: 0.3 },   // Lower-left
  ];

  for (const hs of hotspots) {
    const hg = ctx.createRadialGradient(
      size * hs.x, size * hs.y, 0,
      size * hs.x, size * hs.y, r * hs.r
    );
    // Bright white core fading to specular color
    const alpha = Math.round(hs.intensity * 255).toString(16).padStart(2, '0');
    hg.addColorStop(0, config.specular + alpha);
    hg.addColorStop(0.3, config.glow + Math.round(hs.intensity * 180).toString(16).padStart(2, '0'));
    hg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, size, size);
  }

  // 7. Rim light along bottom — subtle accent glow for depth
  const rimLight = ctx.createRadialGradient(
    cx, cy + r * 0.7, 0,
    cx, cy + r * 0.7, r * 0.5
  );
  rimLight.addColorStop(0, config.accent + '66');
  rimLight.addColorStop(0.5, config.accent + '22');
  rimLight.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = rimLight;
  ctx.fillRect(0, 0, size, size);

  // 8. Diamond-specific: rainbow fire patches
  if (configKey === 'Diamond') {
    const rainbowPatches = [
      { color: 'rgba(255,120,120,0.4)', x: 0.55, y: 0.35, r: 0.15 },
      { color: 'rgba(120,255,150,0.35)', x: 0.35, y: 0.55, r: 0.13 },
      { color: 'rgba(120,160,255,0.4)', x: 0.62, y: 0.55, r: 0.12 },
      { color: 'rgba(255,220,100,0.3)', x: 0.45, y: 0.42, r: 0.10 },
      { color: 'rgba(220,140,255,0.3)', x: 0.3, y: 0.4, r: 0.11 },
      { color: 'rgba(100,220,255,0.25)', x: 0.7, y: 0.4, r: 0.09 },
    ];

    for (const patch of rainbowPatches) {
      const rg = ctx.createRadialGradient(
        size * patch.x, size * patch.y, 0,
        size * patch.x, size * patch.y, r * patch.r
      );
      rg.addColorStop(0, patch.color);
      rg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, size, size);
    }
  }

  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
