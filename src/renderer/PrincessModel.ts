import * as THREE from 'three';
import { Princess } from '../characters/Princess';

export class PrincessModel {
  private group: THREE.Group;
  private princess: Princess;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private crownMesh: THREE.Mesh;
  private animationTime: number = 0;

  constructor(princess: Princess) {
    this.princess = princess;
    this.group = new THREE.Group();

    this.headMesh = this.createHead();
    this.bodyMesh = this.createBody();
    this.crownMesh = this.createCrown();

    this.group.add(this.headMesh);
    this.group.add(this.bodyMesh);
    this.group.add(this.crownMesh);

    // Position the princess to the side of the board
    this.group.position.set(-6, 0, 0);
  }

  private createHead(): THREE.Mesh {
    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffe4c4,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 1.8;
    mesh.castShadow = true;
    return mesh;
  }

  private createBody(): THREE.Mesh {
    const geometry = new THREE.ConeGeometry(0.8, 2, 32);
    const material = new THREE.MeshStandardMaterial({
      color: this.princess.colors.primary,
      roughness: 0.6,
      metalness: 0.2,
      emissive: this.princess.colors.accent,
      emissiveIntensity: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.5;
    mesh.castShadow = true;
    return mesh;
  }

  private createCrown(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.3, 0.4, 0.3, 5);
    const material = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xffd700,
      emissiveIntensity: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 2.3;
    mesh.castShadow = true;
    return mesh;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  update(deltaTime: number): void {
    this.animationTime += deltaTime;

    // Subtle idle animation
    this.group.position.y = Math.sin(this.animationTime * 2) * 0.05;
    this.crownMesh.rotation.y = Math.sin(this.animationTime * 1.5) * 0.1;
  }

  setPosition(x: number, y: number, z: number): void {
    this.group.position.set(x, y, z);
  }

  playHappyAnimation(): void {
    // Could be expanded with more complex animation
    const originalY = this.group.position.y;
    this.group.position.y += 0.3;
    setTimeout(() => {
      this.group.position.y = originalY;
    }, 200);
  }

  playSadAnimation(): void {
    // Dragon stole gems
    this.headMesh.rotation.z = 0.2;
    setTimeout(() => {
      this.headMesh.rotation.z = 0;
    }, 500);
  }

  dispose(): void {
    this.headMesh.geometry.dispose();
    (this.headMesh.material as THREE.Material).dispose();
    this.bodyMesh.geometry.dispose();
    (this.bodyMesh.material as THREE.Material).dispose();
    this.crownMesh.geometry.dispose();
    (this.crownMesh.material as THREE.Material).dispose();
  }
}
