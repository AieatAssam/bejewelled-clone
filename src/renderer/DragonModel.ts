import * as THREE from 'three';

export class DragonModel {
  private group: THREE.Group;
  private bodyMesh: THREE.Mesh;
  private headMesh: THREE.Mesh;
  private wingLeft: THREE.Mesh;
  private wingRight: THREE.Mesh;
  private tailMesh: THREE.Mesh;
  private animationTime: number = 0;
  private isFlying: boolean = false;
  private flyStartPosition: THREE.Vector3 = new THREE.Vector3();
  private flyEndPosition: THREE.Vector3 = new THREE.Vector3();
  private flyProgress: number = 0;
  private flyDuration: number = 2;
  private onFlyComplete: (() => void) | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    const dragonColor = 0x8b0000;
    const dragonMaterial = new THREE.MeshStandardMaterial({
      color: dragonColor,
      roughness: 0.4,
      metalness: 0.3,
      emissive: 0xff4500,
      emissiveIntensity: 0.2,
    });

    // Body
    const bodyGeometry = new THREE.CapsuleGeometry(0.5, 1.5, 8, 16);
    this.bodyMesh = new THREE.Mesh(bodyGeometry, dragonMaterial);
    this.bodyMesh.rotation.z = Math.PI / 2;
    this.group.add(this.bodyMesh);

    // Head
    const headGeometry = new THREE.ConeGeometry(0.4, 0.8, 8);
    this.headMesh = new THREE.Mesh(headGeometry, dragonMaterial.clone());
    this.headMesh.rotation.z = -Math.PI / 2;
    this.headMesh.position.set(1.2, 0.2, 0);
    this.group.add(this.headMesh);

    // Wings
    const wingGeometry = new THREE.PlaneGeometry(1.5, 1);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x660000,
      roughness: 0.6,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });

    this.wingLeft = new THREE.Mesh(wingGeometry, wingMaterial);
    this.wingLeft.position.set(0, 0.3, -0.5);
    this.wingLeft.rotation.x = 0.3;
    this.group.add(this.wingLeft);

    this.wingRight = new THREE.Mesh(wingGeometry, wingMaterial.clone());
    this.wingRight.position.set(0, 0.3, 0.5);
    this.wingRight.rotation.x = -0.3;
    this.group.add(this.wingRight);

    // Tail
    const tailGeometry = new THREE.ConeGeometry(0.2, 1.2, 8);
    this.tailMesh = new THREE.Mesh(tailGeometry, dragonMaterial.clone());
    this.tailMesh.rotation.z = Math.PI / 2;
    this.tailMesh.position.set(-1.3, 0, 0);
    this.group.add(this.tailMesh);

    // Scale up
    this.group.scale.setScalar(1.5);

    // Start off-screen
    this.group.position.set(-15, 5, 2);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  flyAcrossScreen(onComplete?: () => void): void {
    this.isFlying = true;
    this.group.visible = true;
    this.flyProgress = 0;
    this.onFlyComplete = onComplete || null;

    // Fly from left to right across the board
    this.flyStartPosition.set(-15, 3, 2);
    this.flyEndPosition.set(15, 3, 2);

    this.group.position.copy(this.flyStartPosition);
    this.group.rotation.y = 0;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    if (this.isFlying) {
      this.flyProgress += deltaTime / this.flyDuration;

      if (this.flyProgress >= 1) {
        this.flyProgress = 1;
        this.isFlying = false;
        this.group.visible = false;
        if (this.onFlyComplete) {
          this.onFlyComplete();
          this.onFlyComplete = null;
        }
      }

      // Smooth flight path with easing
      const t = this.easeInOutCubic(this.flyProgress);

      this.group.position.lerpVectors(
        this.flyStartPosition,
        this.flyEndPosition,
        t
      );

      // Add wave motion
      this.group.position.y += Math.sin(this.animationTime * 8) * 0.3;

      // Wing flapping
      const flapAngle = Math.sin(this.animationTime * 15) * 0.5;
      this.wingLeft.rotation.z = flapAngle;
      this.wingRight.rotation.z = -flapAngle;

      // Body bobbing
      this.bodyMesh.rotation.x = Math.sin(this.animationTime * 8) * 0.1;

      // Tail wagging
      this.tailMesh.rotation.y = Math.sin(this.animationTime * 6) * 0.3;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  isAnimating(): boolean {
    return this.isFlying;
  }

  dispose(): void {
    const disposeMesh = (mesh: THREE.Mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    };

    disposeMesh(this.bodyMesh);
    disposeMesh(this.headMesh);
    disposeMesh(this.wingLeft);
    disposeMesh(this.wingRight);
    disposeMesh(this.tailMesh);
  }
}
