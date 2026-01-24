import { eventBus } from '../utils/EventBus';

export class ScoreDisplay {
  private container: HTMLElement;
  private scoreValueElement: HTMLElement;
  private comboElement: HTMLElement;
  private currentScore: number = 0;
  private displayedScore: number = 0;
  private comboTimeout: number | null = null;

  constructor() {
    this.container = this.createPurseDisplay();
    this.scoreValueElement = this.container.querySelector('.score-value')!;
    this.comboElement = this.createComboDisplay();
    this.setupEventListeners();
  }

  private createPurseDisplay(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'purse-score';
    container.title = 'Click to open menu';

    // Create SVG purse shape
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 120 100');
    svg.setAttribute('width', '120');
    svg.setAttribute('height', '100');

    // Purse body
    const body = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    body.setAttribute('d', 'M15 35 Q5 35 5 50 L5 85 Q5 95 15 95 L105 95 Q115 95 115 85 L115 50 Q115 35 105 35 Z');
    body.setAttribute('fill', 'url(#purseGradient)');
    body.setAttribute('stroke', '#ffd700');
    body.setAttribute('stroke-width', '3');
    svg.appendChild(body);

    // Gradient for purse
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', 'purseGradient');
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');

    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('stop-color', '#c97b84');
    gradient.appendChild(stop1);

    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('stop-color', '#8b4557');
    gradient.appendChild(stop2);

    defs.appendChild(gradient);
    svg.appendChild(defs);

    // Purse handle
    const handle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    handle.setAttribute('d', 'M35 35 Q35 10 60 10 Q85 10 85 35');
    handle.setAttribute('fill', 'none');
    handle.setAttribute('stroke', '#ffd700');
    handle.setAttribute('stroke-width', '4');
    handle.setAttribute('stroke-linecap', 'round');
    svg.appendChild(handle);

    // Purse clasp
    const clasp = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    clasp.setAttribute('cx', '60');
    clasp.setAttribute('cy', '38');
    clasp.setAttribute('rx', '12');
    clasp.setAttribute('ry', '8');
    clasp.setAttribute('fill', '#ffd700');
    clasp.setAttribute('stroke', '#daa520');
    clasp.setAttribute('stroke-width', '2');
    svg.appendChild(clasp);

    // Jewel on clasp
    const jewel = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    jewel.setAttribute('cx', '60');
    jewel.setAttribute('cy', '38');
    jewel.setAttribute('r', '4');
    jewel.setAttribute('fill', '#ff69b4');
    svg.appendChild(jewel);

    // Decorative gems on purse
    const gem1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    gem1.setAttribute('cx', '25');
    gem1.setAttribute('cy', '55');
    gem1.setAttribute('r', '5');
    gem1.setAttribute('fill', '#ff3366');
    gem1.setAttribute('opacity', '0.8');
    svg.appendChild(gem1);

    const gem2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    gem2.setAttribute('cx', '95');
    gem2.setAttribute('cy', '55');
    gem2.setAttribute('r', '5');
    gem2.setAttribute('fill', '#4488ff');
    gem2.setAttribute('opacity', '0.8');
    svg.appendChild(gem2);

    const gem3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    gem3.setAttribute('cx', '25');
    gem3.setAttribute('cy', '80');
    gem3.setAttribute('r', '4');
    gem3.setAttribute('fill', '#44dd88');
    gem3.setAttribute('opacity', '0.8');
    svg.appendChild(gem3);

    const gem4 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    gem4.setAttribute('cx', '95');
    gem4.setAttribute('cy', '80');
    gem4.setAttribute('r', '4');
    gem4.setAttribute('fill', '#bb66ff');
    gem4.setAttribute('opacity', '0.8');
    svg.appendChild(gem4);

    container.appendChild(svg);

    // Score text overlay
    const scoreText = document.createElement('div');
    scoreText.className = 'score-text';
    scoreText.innerHTML = '<span class="score-value">0</span>';
    container.appendChild(scoreText);

    // Click to open pause/menu
    container.addEventListener('click', () => {
      eventBus.emit('changeState', 'pause');
    });

    return container;
  }

  private createComboDisplay(): HTMLElement {
    const combo = document.createElement('div');
    combo.id = 'combo-display';
    combo.className = 'hidden';
    return combo;
  }

  private setupEventListeners(): void {
    eventBus.on('scoreUpdate', (score: number, combo: number) => {
      this.setScore(score);
      this.setCombo(combo);
    });

    eventBus.on('cascadeComplete', (result: { totalScore: number; cascadeCount: number }) => {
      this.addScore(result.totalScore);
      if (result.cascadeCount > 1) {
        this.setCombo(result.cascadeCount);
      }
    });
  }

  getElement(): HTMLElement {
    return this.container;
  }

  getComboElement(): HTMLElement {
    return this.comboElement;
  }

  setScore(score: number): void {
    this.currentScore = score;
  }

  addScore(points: number): void {
    this.currentScore += points;
  }

  getScore(): number {
    return this.currentScore;
  }

  setCombo(combo: number): void {
    if (combo > 1) {
      this.comboElement.textContent = `${combo}x Combo!`;
      this.comboElement.classList.remove('hidden');
      this.comboElement.style.animation = 'none';
      this.comboElement.offsetHeight; // Trigger reflow
      this.comboElement.style.animation = 'comboPopIn 0.3s ease-out';

      if (this.comboTimeout) {
        clearTimeout(this.comboTimeout);
      }
      this.comboTimeout = window.setTimeout(() => {
        this.comboElement.classList.add('hidden');
      }, 1500);
    }
  }

  update(): void {
    // Animate score counting up
    if (this.displayedScore < this.currentScore) {
      const diff = this.currentScore - this.displayedScore;
      const increment = Math.ceil(diff / 8);
      this.displayedScore = Math.min(this.displayedScore + increment, this.currentScore);
      this.scoreValueElement.textContent = this.displayedScore.toLocaleString();
    }
  }

  reset(): void {
    this.currentScore = 0;
    this.displayedScore = 0;
    this.scoreValueElement.textContent = '0';
    this.comboElement.classList.add('hidden');
  }

  show(): void {
    this.container.classList.remove('hidden');
  }

  hide(): void {
    this.container.classList.add('hidden');
  }
}
