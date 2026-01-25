import { Scene } from '../game/GameState';
import { UIManager } from '../ui/UIManager';
import { eventBus } from '../utils/EventBus';
import { Renderer3D } from '../renderer/Renderer3D';
import { PRINCESSES } from '../characters/princessData';
import { Princess } from '../characters/Princess';

export class SelectScene implements Scene {
  private uiManager: UIManager;
  private renderer: Renderer3D;
  private container: HTMLElement | null = null;
  private selectedPrincess: Princess | null = null;

  constructor(uiManager: UIManager, renderer: Renderer3D) {
    this.uiManager = uiManager;
    this.renderer = renderer;
  }

  enter(): void {
    this.createUI();
  }

  private createUI(): void {
    this.container = this.uiManager.createContainer();
    this.container.style.maxWidth = '700px';

    const title = this.uiManager.createTitle('Choose Your Princess');
    title.style.marginBottom = '1.5rem';
    title.style.fontSize = '3rem';
    this.container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'princess-grid';
    grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
    grid.style.gap = '25px';
    this.container.appendChild(grid);

    for (const princess of PRINCESSES) {
      const card = this.createPrincessCard(princess);
      grid.appendChild(card);
    }

    const backButton = this.uiManager.createButton('Back', () => {
      eventBus.emit('changeState', 'menu');
    });
    backButton.style.marginTop = '25px';
    this.container.appendChild(backButton);

    this.uiManager.showElement(this.container);
    this.uiManager.fadeIn(this.container);
  }

  private createPrincessCard(princess: Princess): HTMLElement {
    const card = document.createElement('div');
    card.className = 'princess-card';
    card.style.width = '180px';
    card.style.height = '290px';
    card.style.padding = '15px';

    const primaryColor = princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = princess.colors.secondary.toString(16).padStart(6, '0');
    const accentColor = princess.colors.accent.toString(16).padStart(6, '0');

    card.style.background = `linear-gradient(180deg, #${secondaryColor} 0%, #${primaryColor} 100%)`;

    // Create princess portrait
    const portrait = this.createPrincessPortrait(princess);
    card.appendChild(portrait);

    const name = document.createElement('div');
    name.className = 'princess-name';
    name.textContent = princess.name;
    name.style.fontSize = '1.4rem';
    name.style.marginTop = '8px';
    name.style.fontWeight = 'bold';
    name.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    card.appendChild(name);

    const theme = document.createElement('div');
    theme.style.cssText = `
      font-size: 0.9rem;
      opacity: 0.9;
      font-style: italic;
    `;
    theme.textContent = `~ ${princess.theme} ~`;
    card.appendChild(theme);

    // Ability display
    const ability = document.createElement('div');
    ability.style.cssText = `
      margin-top: 8px;
      padding: 6px 8px;
      background: rgba(0,0,0,0.4);
      border-radius: 8px;
      font-size: 0.7rem;
      line-height: 1.3;
    `;
    ability.innerHTML = `<strong style="color: #ffd700;">${princess.ability.name}</strong><br>${princess.ability.description}`;
    card.appendChild(ability);

    card.addEventListener('click', () => {
      this.selectPrincess(princess);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.08) translateY(-5px)';
      card.style.boxShadow = `0 10px 40px #${primaryColor}80`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
    });

    return card;
  }

  private createPrincessPortrait(princess: Princess): HTMLElement {
    const container = document.createElement('div');
    container.style.cssText = `
      width: 100px;
      height: 120px;
      margin: 0 auto;
      position: relative;
    `;

    const primaryColor = princess.colors.primary.toString(16).padStart(6, '0');
    const secondaryColor = princess.colors.secondary.toString(16).padStart(6, '0');
    const accentColor = princess.colors.accent.toString(16).padStart(6, '0');

    // SVG portrait - beautiful Disney-style princess
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 120');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '120');
    svg.style.filter = 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))';

    // Flowing hair (back) with waves
    const hairBack = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairBack.setAttribute('d', 'M15 45 Q10 65 18 95 Q22 110 30 120 L70 120 Q78 110 82 95 Q90 65 85 45 Q82 25 50 20 Q18 25 15 45');
    hairBack.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairBack);

    // Hair highlight strands for shine
    const hairShine1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairShine1.setAttribute('d', 'M25 40 Q27 60 24 85');
    hairShine1.setAttribute('stroke', 'rgba(255,255,255,0.25)');
    hairShine1.setAttribute('stroke-width', '3');
    hairShine1.setAttribute('fill', 'none');
    hairShine1.setAttribute('stroke-linecap', 'round');
    svg.appendChild(hairShine1);

    const hairShine2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairShine2.setAttribute('d', 'M78 45 Q76 65 79 90');
    hairShine2.setAttribute('stroke', 'rgba(255,255,255,0.2)');
    hairShine2.setAttribute('stroke-width', '2');
    hairShine2.setAttribute('fill', 'none');
    hairShine2.setAttribute('stroke-linecap', 'round');
    svg.appendChild(hairShine2);

    // Soft oval face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    face.setAttribute('cx', '50');
    face.setAttribute('cy', '52');
    face.setAttribute('rx', '22');
    face.setAttribute('ry', '28');
    face.setAttribute('fill', '#ffecd2');
    svg.appendChild(face);

    // Rosy cheeks
    const cheekL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    cheekL.setAttribute('cx', '34');
    cheekL.setAttribute('cy', '60');
    cheekL.setAttribute('rx', '6');
    cheekL.setAttribute('ry', '4');
    cheekL.setAttribute('fill', '#ffb6c1');
    cheekL.setAttribute('opacity', '0.5');
    svg.appendChild(cheekL);

    const cheekR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    cheekR.setAttribute('cx', '66');
    cheekR.setAttribute('cy', '60');
    cheekR.setAttribute('rx', '6');
    cheekR.setAttribute('ry', '4');
    cheekR.setAttribute('fill', '#ffb6c1');
    cheekR.setAttribute('opacity', '0.5');
    svg.appendChild(cheekR);

    // Big sparkling anime-style eyes - white base
    const eyeWhiteL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeWhiteL.setAttribute('cx', '40');
    eyeWhiteL.setAttribute('cy', '50');
    eyeWhiteL.setAttribute('rx', '8');
    eyeWhiteL.setAttribute('ry', '9');
    eyeWhiteL.setAttribute('fill', 'white');
    svg.appendChild(eyeWhiteL);

    const eyeWhiteR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeWhiteR.setAttribute('cx', '60');
    eyeWhiteR.setAttribute('cy', '50');
    eyeWhiteR.setAttribute('rx', '8');
    eyeWhiteR.setAttribute('ry', '9');
    eyeWhiteR.setAttribute('fill', 'white');
    svg.appendChild(eyeWhiteR);

    // Colored iris
    const irisL = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    irisL.setAttribute('cx', '41');
    irisL.setAttribute('cy', '51');
    irisL.setAttribute('rx', '5');
    irisL.setAttribute('ry', '6');
    irisL.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(irisL);

    const irisR = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    irisR.setAttribute('cx', '61');
    irisR.setAttribute('cy', '51');
    irisR.setAttribute('rx', '5');
    irisR.setAttribute('ry', '6');
    irisR.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(irisR);

    // Pupils
    const pupilL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilL.setAttribute('cx', '42');
    pupilL.setAttribute('cy', '51');
    pupilL.setAttribute('r', '2.5');
    pupilL.setAttribute('fill', '#222');
    svg.appendChild(pupilL);

    const pupilR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pupilR.setAttribute('cx', '62');
    pupilR.setAttribute('cy', '51');
    pupilR.setAttribute('r', '2.5');
    pupilR.setAttribute('fill', '#222');
    svg.appendChild(pupilR);

    // Eye sparkles (big and small)
    const sparkleL1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleL1.setAttribute('cx', '43');
    sparkleL1.setAttribute('cy', '48');
    sparkleL1.setAttribute('r', '2.5');
    sparkleL1.setAttribute('fill', 'white');
    svg.appendChild(sparkleL1);

    const sparkleL2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleL2.setAttribute('cx', '39');
    sparkleL2.setAttribute('cy', '54');
    sparkleL2.setAttribute('r', '1');
    sparkleL2.setAttribute('fill', 'white');
    svg.appendChild(sparkleL2);

    const sparkleR1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleR1.setAttribute('cx', '63');
    sparkleR1.setAttribute('cy', '48');
    sparkleR1.setAttribute('r', '2.5');
    sparkleR1.setAttribute('fill', 'white');
    svg.appendChild(sparkleR1);

    const sparkleR2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleR2.setAttribute('cx', '59');
    sparkleR2.setAttribute('cy', '54');
    sparkleR2.setAttribute('r', '1');
    sparkleR2.setAttribute('fill', 'white');
    svg.appendChild(sparkleR2);

    // Cute eyelashes
    const lashL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lashL.setAttribute('d', 'M32 46 Q34 43 36 44 M35 43 Q38 40 40 42 M39 41 Q43 38 46 41');
    lashL.setAttribute('stroke', '#333');
    lashL.setAttribute('stroke-width', '1.2');
    lashL.setAttribute('fill', 'none');
    svg.appendChild(lashL);

    const lashR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    lashR.setAttribute('d', 'M68 46 Q66 43 64 44 M65 43 Q62 40 60 42 M61 41 Q57 38 54 41');
    lashR.setAttribute('stroke', '#333');
    lashR.setAttribute('stroke-width', '1.2');
    lashR.setAttribute('fill', 'none');
    svg.appendChild(lashR);

    // Soft eyebrows
    const browL = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    browL.setAttribute('d', 'M33 38 Q40 35 47 38');
    browL.setAttribute('stroke', `#${accentColor}`);
    browL.setAttribute('stroke-width', '1.5');
    browL.setAttribute('fill', 'none');
    svg.appendChild(browL);

    const browR = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    browR.setAttribute('d', 'M53 38 Q60 35 67 38');
    browR.setAttribute('stroke', `#${accentColor}`);
    browR.setAttribute('stroke-width', '1.5');
    browR.setAttribute('fill', 'none');
    svg.appendChild(browR);

    // Small cute nose
    const nose = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    nose.setAttribute('d', 'M50 56 Q48 60 50 63');
    nose.setAttribute('stroke', '#ddb8a0');
    nose.setAttribute('stroke-width', '1.5');
    nose.setAttribute('fill', 'none');
    svg.appendChild(nose);

    // Cute smile with pink lips
    const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smile.setAttribute('d', 'M42 68 Q50 76 58 68');
    smile.setAttribute('stroke', '#e88a8a');
    smile.setAttribute('stroke-width', '2.5');
    smile.setAttribute('fill', '#ffb6c1');
    smile.setAttribute('stroke-linecap', 'round');
    svg.appendChild(smile);

    // Hair (front/bangs) framing face
    const hairFront = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairFront.setAttribute('d', 'M28 35 Q30 45 28 55 Q50 38 72 55 Q70 45 72 35 Q65 22 50 20 Q35 22 28 35');
    hairFront.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairFront);

    // Beautiful tiara crown
    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crown.setAttribute('d', 'M32 25 L35 14 L42 20 L50 10 L58 20 L65 14 L68 25 Q50 28 32 25');
    crown.setAttribute('fill', '#ffd700');
    crown.setAttribute('stroke', '#daa520');
    crown.setAttribute('stroke-width', '0.8');
    svg.appendChild(crown);

    // Crown jewels
    const jewelMain = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewelMain.setAttribute('cx', '50');
    jewelMain.setAttribute('cy', '16');
    jewelMain.setAttribute('r', '4');
    jewelMain.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(jewelMain);

    const jewelL = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewelL.setAttribute('cx', '40');
    jewelL.setAttribute('cy', '19');
    jewelL.setAttribute('r', '2');
    jewelL.setAttribute('fill', `#${secondaryColor}`);
    svg.appendChild(jewelL);

    const jewelR = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewelR.setAttribute('cx', '60');
    jewelR.setAttribute('cy', '19');
    jewelR.setAttribute('r', '2');
    jewelR.setAttribute('fill', `#${secondaryColor}`);
    svg.appendChild(jewelR);

    // Elegant dress bodice
    const dress = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dress.setAttribute('d', 'M35 82 Q50 76 65 82 L72 120 L28 120 Z');
    dress.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(dress);

    // Dress neckline detail
    const dressDetail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dressDetail.setAttribute('d', 'M40 85 Q50 80 60 85');
    dressDetail.setAttribute('stroke', `#${secondaryColor}`);
    dressDetail.setAttribute('stroke-width', '2');
    dressDetail.setAttribute('fill', 'none');
    svg.appendChild(dressDetail);

    // Pretty necklace pendant
    const necklaceChain = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    necklaceChain.setAttribute('d', 'M38 78 Q50 82 62 78');
    necklaceChain.setAttribute('stroke', '#ffd700');
    necklaceChain.setAttribute('stroke-width', '1');
    necklaceChain.setAttribute('fill', 'none');
    svg.appendChild(necklaceChain);

    const pendant = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pendant.setAttribute('cx', '50');
    pendant.setAttribute('cy', '82');
    pendant.setAttribute('r', '4');
    pendant.setAttribute('fill', `#${secondaryColor}`);
    pendant.setAttribute('stroke', '#ffd700');
    pendant.setAttribute('stroke-width', '1');
    svg.appendChild(pendant);

    container.appendChild(svg);
    return container;
  }

  private selectPrincess(princess: Princess): void {
    this.selectedPrincess = princess;
    eventBus.emit('princessSelected', princess);
    eventBus.emit('changeState', 'intro');
  }

  getSelectedPrincess(): Princess | null {
    return this.selectedPrincess;
  }

  exit(): void {
    if (this.container) {
      this.uiManager.hideCurrentUI();
      this.container = null;
    }
  }

  update(deltaTime: number): void {
    // No animation needed
  }

  render(): void {
    this.renderer.render();
  }
}
