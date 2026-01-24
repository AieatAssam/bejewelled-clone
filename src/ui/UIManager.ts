import { eventBus } from '../utils/EventBus';

export class UIManager {
  private overlay: HTMLElement;
  private currentUI: HTMLElement | null = null;

  constructor() {
    this.overlay = document.getElementById('ui-overlay')!;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    eventBus.on('stateChanged', (newState: string) => {
      // UI updates are handled by individual scenes
    });
  }

  showElement(element: HTMLElement): void {
    this.hideCurrentUI();
    this.overlay.appendChild(element);
    this.currentUI = element;
  }

  hideCurrentUI(): void {
    if (this.currentUI) {
      this.overlay.removeChild(this.currentUI);
      this.currentUI = null;
    }
  }

  clearOverlay(): void {
    this.overlay.innerHTML = '';
    this.currentUI = null;
  }

  getOverlay(): HTMLElement {
    return this.overlay;
  }

  createButton(text: string, onClick: () => void, className: string = 'menu-button'): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = text;
    button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }

  createTitle(text: string, className: string = 'menu-title'): HTMLHeadingElement {
    const title = document.createElement('h1');
    title.textContent = text;
    title.className = className;
    return title;
  }

  createContainer(className: string = 'menu-container'): HTMLDivElement {
    const container = document.createElement('div');
    container.className = className;
    return container;
  }

  fadeIn(element: HTMLElement, duration: number = 500): void {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease-in-out`;
    requestAnimationFrame(() => {
      element.style.opacity = '1';
    });
  }

  fadeOut(element: HTMLElement, duration: number = 500): Promise<void> {
    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms ease-in-out`;
      element.style.opacity = '0';
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }
}
