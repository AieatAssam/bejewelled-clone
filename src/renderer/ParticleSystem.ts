import * as THREE from 'three';

export interface ParticleConfig {
  count: number;
  color: THREE.Color;
  size: number;
  lifetime: number;
  speed: number;
  spread: number;
}

interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  alpha: number;
}

export class ParticleEmitter {
  private particles: Particle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private config: ParticleConfig;
  private isActive: boolean = false;
  private emitPosition: THREE.Vector3 = new THREE.Vector3();

  constructor(scene: THREE.Scene, config: Partial<ParticleConfig> = {}) {
    this.config = {
      count: 50,
      color: new THREE.Color(0xffd700),
      size: 0.1,
      lifetime: 1.0,
      speed: 2.0,
      spread: 1.0,
      ...config,
    };

    this.geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(this.config.count * 3);
    const sizes = new Float32Array(this.config.count);
    const alphas = new Float32Array(this.config.count);

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    this.material = new THREE.PointsMaterial({
      color: this.config.color,
      size: this.config.size,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
    scene.add(this.points);

    // Initialize particles pool
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: this.config.lifetime,
        size: this.config.size,
        alpha: 0,
      });
    }
  }

  emit(position: THREE.Vector3, count?: number): void {
    this.emitPosition.copy(position);
    this.isActive = true;

    const particleCount = count || Math.floor(this.config.count * 0.3);
    let emitted = 0;

    for (const particle of this.particles) {
      if (particle.life <= 0 && emitted < particleCount) {
        this.resetParticle(particle);
        emitted++;
      }
    }
  }

  private resetParticle(particle: Particle): void {
    particle.position.copy(this.emitPosition);

    // Random velocity in sphere
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = this.config.speed * (0.5 + Math.random() * 0.5);

    particle.velocity.set(
      Math.sin(phi) * Math.cos(theta) * speed * this.config.spread,
      Math.sin(phi) * Math.sin(theta) * speed * this.config.spread,
      Math.cos(phi) * speed * 0.5
    );

    particle.life = this.config.lifetime * (0.5 + Math.random() * 0.5);
    particle.maxLife = particle.life;
    particle.size = this.config.size * (0.5 + Math.random() * 1.0);
    particle.alpha = 1;
  }

  update(deltaTime: number): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;

    let hasActiveParticles = false;

    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];

      if (particle.life > 0) {
        hasActiveParticles = true;

        // Update position
        particle.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime)
        );

        // Add gravity
        particle.velocity.y -= deltaTime * 2;

        // Update life
        particle.life -= deltaTime;

        // Fade out
        particle.alpha = particle.life / particle.maxLife;

        // Update buffers
        positions[i * 3] = particle.position.x;
        positions[i * 3 + 1] = particle.position.y;
        positions[i * 3 + 2] = particle.position.z;
        sizes[i] = particle.size * particle.alpha;
      } else {
        // Hide dead particle
        positions[i * 3] = 0;
        positions[i * 3 + 1] = -1000;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;

    if (!hasActiveParticles) {
      this.isActive = false;
    }
  }

  setColor(color: THREE.Color): void {
    this.material.color.copy(color);
    this.config.color.copy(color);
  }

  isEmitting(): boolean {
    return this.isActive;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private emitters: ParticleEmitter[] = [];
  private sparkleEmitter: ParticleEmitter;
  private collectEmitter: ParticleEmitter;
  private comboEmitter: ParticleEmitter;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Sparkle effect for gems
    this.sparkleEmitter = new ParticleEmitter(scene, {
      count: 100,
      color: new THREE.Color(0xffffff),
      size: 0.08,
      lifetime: 0.5,
      speed: 1.5,
      spread: 0.5,
    });
    this.emitters.push(this.sparkleEmitter);

    // Collection effect
    this.collectEmitter = new ParticleEmitter(scene, {
      count: 200,
      color: new THREE.Color(0xffd700),
      size: 0.12,
      lifetime: 0.8,
      speed: 3.0,
      spread: 1.5,
    });
    this.emitters.push(this.collectEmitter);

    // Combo effect
    this.comboEmitter = new ParticleEmitter(scene, {
      count: 300,
      color: new THREE.Color(0xff69b4),
      size: 0.15,
      lifetime: 1.2,
      speed: 4.0,
      spread: 2.0,
    });
    this.emitters.push(this.comboEmitter);
  }

  emitSparkle(position: THREE.Vector3, color?: THREE.Color): void {
    if (color) {
      this.sparkleEmitter.setColor(color);
    }
    this.sparkleEmitter.emit(position, 10);
  }

  emitCollect(position: THREE.Vector3, color?: THREE.Color): void {
    if (color) {
      this.collectEmitter.setColor(color);
    }
    this.collectEmitter.emit(position, 30);
  }

  emitCombo(position: THREE.Vector3, comboLevel: number): void {
    const colors = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xff69b4),
      new THREE.Color(0x9966cc),
      new THREE.Color(0x00ffff),
    ];
    const colorIndex = Math.min(comboLevel - 1, colors.length - 1);
    this.comboEmitter.setColor(colors[colorIndex]);
    this.comboEmitter.emit(position, 50 * comboLevel);
  }

  update(deltaTime: number): void {
    for (const emitter of this.emitters) {
      emitter.update(deltaTime);
    }
  }

  isAnimating(): boolean {
    return this.emitters.some(e => e.isEmitting());
  }

  dispose(): void {
    for (const emitter of this.emitters) {
      emitter.dispose();
    }
  }
}
