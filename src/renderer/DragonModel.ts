import * as THREE from 'three';

export class DragonModel {
  private group: THREE.Group;
  private bodyParts: THREE.Group;
  private wingLeft: THREE.Group;
  private wingRight: THREE.Group;
  private animationTime: number = 0;
  private isFlying: boolean = false;
  private flyStartPosition: THREE.Vector3 = new THREE.Vector3();
  private flyEndPosition: THREE.Vector3 = new THREE.Vector3();
  private flyProgress: number = 0;
  private flyDuration: number = 2.5;
  private onFlyComplete: (() => void) | null = null;

  constructor() {
    this.group = new THREE.Group();
    this.group.visible = false;

    this.bodyParts = new THREE.Group();
    this.wingLeft = new THREE.Group();
    this.wingRight = new THREE.Group();

    this.createDragon();

    this.group.scale.setScalar(1.8);
    this.group.position.set(-15, 5, 2);
  }

  private createDragon(): void {
    const dragonRed = 0xcc2222;
    const dragonDark = 0x881111;
    const dragonBelly = 0xffcc66;
    const eyeColor = 0xffff00;

    // Main body material
    const bodyMat = new THREE.MeshStandardMaterial({
      color: dragonRed,
      roughness: 0.5,
      metalness: 0.2,
      emissive: 0xff2200,
      emissiveIntensity: 0.1,
    });

    const bellyMat = new THREE.MeshStandardMaterial({
      color: dragonBelly,
      roughness: 0.6,
      metalness: 0.1,
    });

    const darkMat = new THREE.MeshStandardMaterial({
      color: dragonDark,
      roughness: 0.4,
      metalness: 0.3,
    });

    // === BODY ===
    // Main body - elongated ellipsoid
    const bodyGeom = new THREE.SphereGeometry(0.6, 16, 12);
    bodyGeom.scale(1.8, 1, 1);
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    this.bodyParts.add(body);

    // Belly
    const bellyGeom = new THREE.SphereGeometry(0.45, 12, 8);
    bellyGeom.scale(1.5, 0.8, 0.9);
    const belly = new THREE.Mesh(bellyGeom, bellyMat);
    belly.position.set(0, -0.15, 0);
    this.bodyParts.add(belly);

    // === HEAD ===
    const headGroup = new THREE.Group();
    headGroup.position.set(1.3, 0.3, 0);

    // Head base
    const headGeom = new THREE.SphereGeometry(0.4, 12, 10);
    headGeom.scale(1.3, 1, 1);
    const head = new THREE.Mesh(headGeom, bodyMat);
    headGroup.add(head);

    // Snout
    const snoutGeom = new THREE.ConeGeometry(0.25, 0.6, 8);
    snoutGeom.rotateZ(-Math.PI / 2);
    const snout = new THREE.Mesh(snoutGeom, bodyMat);
    snout.position.set(0.5, -0.05, 0);
    headGroup.add(snout);

    // Nostrils
    const nostrilGeom = new THREE.SphereGeometry(0.05, 8, 6);
    const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const nostrilL = new THREE.Mesh(nostrilGeom, nostrilMat);
    nostrilL.position.set(0.75, 0, 0.1);
    headGroup.add(nostrilL);
    const nostrilR = new THREE.Mesh(nostrilGeom, nostrilMat);
    nostrilR.position.set(0.75, 0, -0.1);
    headGroup.add(nostrilR);

    // Eyes
    const eyeGeom = new THREE.SphereGeometry(0.1, 10, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eyeL = new THREE.Mesh(eyeGeom, eyeMat);
    eyeL.position.set(0.2, 0.15, 0.25);
    headGroup.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeom, eyeMat);
    eyeR.position.set(0.2, 0.15, -0.25);
    headGroup.add(eyeR);

    // Pupils
    const pupilGeom = new THREE.SphereGeometry(0.05, 8, 6);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const pupilL = new THREE.Mesh(pupilGeom, pupilMat);
    pupilL.position.set(0.28, 0.16, 0.26);
    headGroup.add(pupilL);
    const pupilR = new THREE.Mesh(pupilGeom, pupilMat);
    pupilR.position.set(0.28, 0.16, -0.26);
    headGroup.add(pupilR);

    // Horns
    const hornGeom = new THREE.ConeGeometry(0.08, 0.35, 6);
    const hornL = new THREE.Mesh(hornGeom, darkMat);
    hornL.position.set(-0.1, 0.35, 0.2);
    hornL.rotation.set(0, 0, 0.3);
    headGroup.add(hornL);
    const hornR = new THREE.Mesh(hornGeom, darkMat);
    hornR.position.set(-0.1, 0.35, -0.2);
    hornR.rotation.set(0, 0, 0.3);
    headGroup.add(hornR);

    // Ears/frills
    const earGeom = new THREE.ConeGeometry(0.1, 0.2, 4);
    const earL = new THREE.Mesh(earGeom, bodyMat);
    earL.position.set(-0.2, 0.2, 0.3);
    earL.rotation.set(0.5, 0, 0.5);
    headGroup.add(earL);
    const earR = new THREE.Mesh(earGeom, bodyMat);
    earR.position.set(-0.2, 0.2, -0.3);
    earR.rotation.set(-0.5, 0, 0.5);
    headGroup.add(earR);

    // Jaw
    const jawGeom = new THREE.SphereGeometry(0.2, 8, 6);
    jawGeom.scale(1.2, 0.5, 0.8);
    const jaw = new THREE.Mesh(jawGeom, bodyMat);
    jaw.position.set(0.35, -0.2, 0);
    headGroup.add(jaw);

    this.bodyParts.add(headGroup);

    // === NECK ===
    const neckGeom = new THREE.CylinderGeometry(0.25, 0.35, 0.6, 8);
    neckGeom.rotateZ(Math.PI / 2 - 0.3);
    const neck = new THREE.Mesh(neckGeom, bodyMat);
    neck.position.set(0.85, 0.15, 0);
    this.bodyParts.add(neck);

    // === TAIL ===
    const tailGroup = new THREE.Group();

    // Tail segments
    const tailSegments = 5;
    for (let i = 0; i < tailSegments; i++) {
      const size = 0.25 - i * 0.04;
      const segGeom = new THREE.SphereGeometry(size, 8, 6);
      segGeom.scale(1.2, 1, 1);
      const seg = new THREE.Mesh(segGeom, bodyMat);
      seg.position.set(-0.9 - i * 0.35, -0.05 - i * 0.05, 0);
      tailGroup.add(seg);
    }

    // Tail spikes
    const spikeGeom = new THREE.ConeGeometry(0.06, 0.2, 4);
    for (let i = 0; i < 4; i++) {
      const spike = new THREE.Mesh(spikeGeom, darkMat);
      spike.position.set(-1.0 - i * 0.4, 0.15, 0);
      spike.rotation.set(0, 0, -0.3);
      tailGroup.add(spike);
    }

    // Tail tip - arrow shape
    const tipGeom = new THREE.ConeGeometry(0.15, 0.3, 4);
    tipGeom.rotateZ(Math.PI / 2);
    const tip = new THREE.Mesh(tipGeom, darkMat);
    tip.position.set(-2.7, -0.25, 0);
    tailGroup.add(tip);

    this.bodyParts.add(tailGroup);

    // === LEGS ===
    const legGeom = new THREE.CapsuleGeometry(0.1, 0.3, 4, 8);
    const footGeom = new THREE.SphereGeometry(0.12, 8, 6);

    // Front left leg
    const frontLegL = new THREE.Mesh(legGeom, bodyMat);
    frontLegL.position.set(0.5, -0.5, 0.35);
    frontLegL.rotation.set(0, 0, 0.2);
    this.bodyParts.add(frontLegL);
    const frontFootL = new THREE.Mesh(footGeom, darkMat);
    frontFootL.position.set(0.55, -0.75, 0.35);
    this.bodyParts.add(frontFootL);

    // Front right leg
    const frontLegR = new THREE.Mesh(legGeom, bodyMat);
    frontLegR.position.set(0.5, -0.5, -0.35);
    frontLegR.rotation.set(0, 0, 0.2);
    this.bodyParts.add(frontLegR);
    const frontFootR = new THREE.Mesh(footGeom, darkMat);
    frontFootR.position.set(0.55, -0.75, -0.35);
    this.bodyParts.add(frontFootR);

    // Back left leg
    const backLegL = new THREE.Mesh(legGeom, bodyMat);
    backLegL.position.set(-0.5, -0.5, 0.35);
    backLegL.rotation.set(0, 0, -0.2);
    this.bodyParts.add(backLegL);
    const backFootL = new THREE.Mesh(footGeom, darkMat);
    backFootL.position.set(-0.55, -0.75, 0.35);
    this.bodyParts.add(backFootL);

    // Back right leg
    const backLegR = new THREE.Mesh(legGeom, bodyMat);
    backLegR.position.set(-0.5, -0.5, -0.35);
    backLegR.rotation.set(0, 0, -0.2);
    this.bodyParts.add(backLegR);
    const backFootR = new THREE.Mesh(footGeom, darkMat);
    backFootR.position.set(-0.55, -0.75, -0.35);
    this.bodyParts.add(backFootR);

    // === WINGS ===
    const wingMat = new THREE.MeshStandardMaterial({
      color: dragonRed,
      roughness: 0.5,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    const wingMembraneMat = new THREE.MeshStandardMaterial({
      color: 0xff6644,
      roughness: 0.6,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });

    // Left wing
    // Wing arm
    const wingArmGeom = new THREE.CapsuleGeometry(0.08, 0.8, 4, 8);
    const wingArmL = new THREE.Mesh(wingArmGeom, wingMat);
    wingArmL.rotation.set(0, 0, Math.PI / 4);
    wingArmL.position.set(0.3, 0.3, 0);
    this.wingLeft.add(wingArmL);

    // Wing membrane (simplified as planes)
    const membraneShape = new THREE.Shape();
    membraneShape.moveTo(0, 0);
    membraneShape.lineTo(1.2, 0.6);
    membraneShape.lineTo(1.4, 0.2);
    membraneShape.lineTo(1.3, -0.2);
    membraneShape.lineTo(0.8, -0.4);
    membraneShape.lineTo(0.3, -0.3);
    membraneShape.lineTo(0, 0);

    const membraneGeom = new THREE.ShapeGeometry(membraneShape);
    const membraneL = new THREE.Mesh(membraneGeom, wingMembraneMat);
    membraneL.position.set(0, 0.1, 0.01);
    this.wingLeft.add(membraneL);

    // Wing bones/fingers
    const wingBoneGeom = new THREE.CylinderGeometry(0.03, 0.02, 0.6, 4);
    for (let i = 0; i < 3; i++) {
      const bone = new THREE.Mesh(wingBoneGeom, darkMat);
      bone.position.set(0.4 + i * 0.35, 0.3 - i * 0.15, 0);
      bone.rotation.set(0, 0, Math.PI / 4 - i * 0.2);
      this.wingLeft.add(bone);
    }

    this.wingLeft.position.set(0, 0.4, 0.5);
    this.wingLeft.rotation.set(0.5, 0, 0);

    // Right wing (mirror)
    // Wing arm
    const wingArmR = new THREE.Mesh(wingArmGeom.clone(), wingMat);
    wingArmR.rotation.set(0, 0, Math.PI / 4);
    wingArmR.position.set(0.3, 0.3, 0);
    this.wingRight.add(wingArmR);

    // Membrane (flipped)
    const membraneR = new THREE.Mesh(membraneGeom.clone(), wingMembraneMat);
    membraneR.position.set(0, 0.1, -0.01);
    membraneR.rotation.y = Math.PI;
    this.wingRight.add(membraneR);

    // Wing bones
    for (let i = 0; i < 3; i++) {
      const bone = new THREE.Mesh(wingBoneGeom.clone(), darkMat);
      bone.position.set(0.4 + i * 0.35, 0.3 - i * 0.15, 0);
      bone.rotation.set(0, 0, Math.PI / 4 - i * 0.2);
      this.wingRight.add(bone);
    }

    this.wingRight.position.set(0, 0.4, -0.5);
    this.wingRight.rotation.set(-0.5, 0, 0);

    // === BACK SPINES ===
    for (let i = 0; i < 6; i++) {
      const spineGeom = new THREE.ConeGeometry(0.06, 0.2 - i * 0.02, 4);
      const spine = new THREE.Mesh(spineGeom, darkMat);
      spine.position.set(0.6 - i * 0.25, 0.55 - i * 0.03, 0);
      this.bodyParts.add(spine);
    }

    // Add all parts to main group
    this.group.add(this.bodyParts);
    this.group.add(this.wingLeft);
    this.group.add(this.wingRight);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  flyAcrossScreen(onComplete?: () => void): void {
    this.isFlying = true;
    this.group.visible = true;
    this.flyProgress = 0;
    this.onFlyComplete = onComplete || null;

    this.flyStartPosition.set(-15, 2, 2);
    this.flyEndPosition.set(15, 2, 2);

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

      // Smooth flight path
      const t = this.easeInOutCubic(this.flyProgress);

      this.group.position.lerpVectors(
        this.flyStartPosition,
        this.flyEndPosition,
        t
      );

      // Undulating flight motion
      this.group.position.y += Math.sin(this.animationTime * 4) * 0.4;

      // Slight roll during flight
      this.group.rotation.z = Math.sin(this.animationTime * 3) * 0.1;

      // Wing flapping - more dramatic
      const flapAngle = Math.sin(this.animationTime * 12) * 0.6;
      this.wingLeft.rotation.x = 0.5 + flapAngle;
      this.wingRight.rotation.x = -0.5 - flapAngle;

      // Body undulation
      this.bodyParts.rotation.y = Math.sin(this.animationTime * 3) * 0.1;
      this.bodyParts.rotation.x = Math.sin(this.animationTime * 4) * 0.05;
    }
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  isAnimating(): boolean {
    return this.isFlying;
  }

  dispose(): void {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    });
  }
}
