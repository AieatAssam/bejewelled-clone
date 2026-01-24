import { eventBus } from '../utils/EventBus';

export class ScoreDisplay {
  private container: HTMLElement;
  private scoreElement: HTMLElement;
  private comboElement: HTMLElement;
  private currentScore: number = 0;
  private displayedScore: number = 0;
  private currentCombo: number = 0;
  private comboTimeout: number | null = null;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'score-display';

    this.scoreElement = document.createElement('div');
    this.scoreElement.id = 'score-value';
    this.scoreElement.textContent = '0';

    this.comboElement = document.createElement('div');
    this.comboElement.id = 'combo-display';
    this.comboElement.textContent = '';

    this.container.appendChild(this.scoreElement);
    this.container.appendChild(this.comboElement);

    this.setupEventListeners();
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
    this.currentCombo = combo;
    if (combo > 1) {
      this.comboElement.textContent = `${combo}x Combo!`;
      this.comboElement.style.transform = 'scale(1.2)';
      setTimeout(() => {
        this.comboElement.style.transform = 'scale(1)';
      }, 200);

      if (this.comboTimeout) {
        clearTimeout(this.comboTimeout);
      }
      this.comboTimeout = window.setTimeout(() => {
        this.comboElement.textContent = '';
        this.currentCombo = 0;
      }, 2000);
    }
  }

  update(): void {
    // Animate score counting up
    if (this.displayedScore < this.currentScore) {
      const diff = this.currentScore - this.displayedScore;
      const increment = Math.ceil(diff / 10);
      this.displayedScore = Math.min(this.displayedScore + increment, this.currentScore);
      this.scoreElement.textContent = this.displayedScore.toLocaleString();
    }
  }

  reset(): void {
    this.currentScore = 0;
    this.displayedScore = 0;
    this.currentCombo = 0;
    this.scoreElement.textContent = '0';
    this.comboElement.textContent = '';
  }

  show(): void {
    this.container.classList.remove('hidden');
  }

  hide(): void {
    this.container.classList.add('hidden');
  }
}
