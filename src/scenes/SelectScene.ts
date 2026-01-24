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
    card.style.height = '240px';
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
    name.style.marginTop = '10px';
    name.style.fontWeight = 'bold';
    name.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    card.appendChild(name);

    const theme = document.createElement('div');
    theme.style.cssText = `
      font-size: 1rem;
      opacity: 0.9;
      font-style: italic;
    `;
    theme.textContent = `~ ${princess.theme} ~`;
    card.appendChild(theme);

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

    // SVG portrait
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 100 120');
    svg.setAttribute('width', '100');
    svg.setAttribute('height', '120');
    svg.style.filter = 'drop-shadow(2px 4px 6px rgba(0,0,0,0.3))';

    // Hair (back)
    const hairBack = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    hairBack.setAttribute('cx', '50');
    hairBack.setAttribute('cy', '55');
    hairBack.setAttribute('rx', '35');
    hairBack.setAttribute('ry', '45');
    hairBack.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairBack);

    // Face
    const face = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    face.setAttribute('cx', '50');
    face.setAttribute('cy', '50');
    face.setAttribute('rx', '25');
    face.setAttribute('ry', '30');
    face.setAttribute('fill', '#ffe4c4');
    svg.appendChild(face);

    // Hair (front/bangs)
    const hairFront = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hairFront.setAttribute('d', 'M25 45 Q30 20 50 15 Q70 20 75 45 Q65 35 50 32 Q35 35 25 45');
    hairFront.setAttribute('fill', `#${accentColor}`);
    svg.appendChild(hairFront);

    // Eyes
    const eyeLeft = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeLeft.setAttribute('cx', '40');
    eyeLeft.setAttribute('cy', '48');
    eyeLeft.setAttribute('rx', '5');
    eyeLeft.setAttribute('ry', '6');
    eyeLeft.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeLeft);

    const eyeRight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    eyeRight.setAttribute('cx', '60');
    eyeRight.setAttribute('cy', '48');
    eyeRight.setAttribute('rx', '5');
    eyeRight.setAttribute('ry', '6');
    eyeRight.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(eyeRight);

    // Eye sparkles
    const sparkleLeft = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleLeft.setAttribute('cx', '42');
    sparkleLeft.setAttribute('cy', '46');
    sparkleLeft.setAttribute('r', '2');
    sparkleLeft.setAttribute('fill', 'white');
    svg.appendChild(sparkleLeft);

    const sparkleRight = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    sparkleRight.setAttribute('cx', '62');
    sparkleRight.setAttribute('cy', '46');
    sparkleRight.setAttribute('r', '2');
    sparkleRight.setAttribute('fill', 'white');
    svg.appendChild(sparkleRight);

    // Smile
    const smile = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    smile.setAttribute('d', 'M42 62 Q50 70 58 62');
    smile.setAttribute('stroke', '#c97878');
    smile.setAttribute('stroke-width', '2');
    smile.setAttribute('fill', 'none');
    smile.setAttribute('stroke-linecap', 'round');
    svg.appendChild(smile);

    // Blush
    const blushLeft = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    blushLeft.setAttribute('cx', '32');
    blushLeft.setAttribute('cy', '58');
    blushLeft.setAttribute('rx', '6');
    blushLeft.setAttribute('ry', '3');
    blushLeft.setAttribute('fill', '#ffb6c1');
    blushLeft.setAttribute('opacity', '0.5');
    svg.appendChild(blushLeft);

    const blushRight = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    blushRight.setAttribute('cx', '68');
    blushRight.setAttribute('cy', '58');
    blushRight.setAttribute('rx', '6');
    blushRight.setAttribute('ry', '3');
    blushRight.setAttribute('fill', '#ffb6c1');
    blushRight.setAttribute('opacity', '0.5');
    svg.appendChild(blushRight);

    // Crown/Tiara
    const crown = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    crown.setAttribute('d', 'M30 22 L35 12 L42 18 L50 8 L58 18 L65 12 L70 22 Z');
    crown.setAttribute('fill', '#ffd700');
    crown.setAttribute('stroke', '#daa520');
    crown.setAttribute('stroke-width', '1');
    svg.appendChild(crown);

    // Crown jewel
    const jewel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewel.setAttribute('cx', '50');
    jewel.setAttribute('cy', '14');
    jewel.setAttribute('r', '4');
    jewel.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(jewel);

    // Dress collar
    const collar = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    collar.setAttribute('d', 'M30 85 Q50 75 70 85 L75 120 L25 120 Z');
    collar.setAttribute('fill', `#${primaryColor}`);
    svg.appendChild(collar);

    // Dress details
    const dressDetail = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    dressDetail.setAttribute('d', 'M40 90 Q50 85 60 90');
    dressDetail.setAttribute('stroke', `#${secondaryColor}`);
    dressDetail.setAttribute('stroke-width', '2');
    dressDetail.setAttribute('fill', 'none');
    svg.appendChild(dressDetail);

    // Necklace
    const necklace = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    necklace.setAttribute('cx', '50');
    necklace.setAttribute('cy', '82');
    necklace.setAttribute('r', '4');
    necklace.setAttribute('fill', `#${secondaryColor}`);
    necklace.setAttribute('stroke', '#ffd700');
    necklace.setAttribute('stroke-width', '1');
    svg.appendChild(necklace);

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
