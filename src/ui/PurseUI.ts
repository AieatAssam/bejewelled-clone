import { GemType, GEM_COLORS } from '../puzzle/Gem';
import { DragonEvent } from '../puzzle/DragonEvent';

export class PurseUI {
  private container: HTMLElement;
  private dragonEvent: DragonEvent;
  private itemElements: Map<GemType, HTMLElement> = new Map();

  constructor(dragonEvent: DragonEvent) {
    this.dragonEvent = dragonEvent;
    this.container = this.createContainer();
  }

  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'purse-container';
    container.style.cssText = `
      background: rgba(0, 0, 0, 0.9);
      border: 3px solid #ffd700;
      border-radius: 15px;
      padding: 20px;
      min-width: 300px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'Treasure Purse';
    title.style.cssText = `
      color: #ffd700;
      font-family: 'Georgia', serif;
      text-align: center;
      margin-bottom: 15px;
    `;
    container.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'purse-grid';
    container.appendChild(grid);

    // Create item slots for each gem type
    for (const gemType of Object.values(GemType)) {
      const itemSlot = this.createItemSlot(gemType);
      grid.appendChild(itemSlot);
      this.itemElements.set(gemType, itemSlot);
    }

    return container;
  }

  private createItemSlot(gemType: GemType): HTMLElement {
    const slot = document.createElement('div');
    slot.className = 'purse-item';

    const colors = GEM_COLORS[gemType];
    const colorHex = colors.primary.toString(16).padStart(6, '0');

    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 40px;
      height: 40px;
      background: #${colorHex};
      border-radius: ${gemType.includes('Bracelet') || gemType.includes('Earring') ? '50%' : '4px'};
      margin: 0 auto 5px;
      box-shadow: 0 0 10px #${colorHex}80;
    `;
    slot.appendChild(icon);

    const name = document.createElement('div');
    name.textContent = this.formatGemName(gemType);
    name.style.cssText = `
      color: white;
      font-size: 0.8rem;
      text-transform: capitalize;
    `;
    slot.appendChild(name);

    const count = document.createElement('div');
    count.className = 'purse-count';
    count.textContent = '0';
    count.dataset.gemType = gemType;
    slot.appendChild(count);

    return slot;
  }

  private formatGemName(gemType: GemType): string {
    return gemType.replace('_', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getElement(): HTMLElement {
    return this.container;
  }

  update(): void {
    const collection = this.dragonEvent.getCollection();

    for (const [gemType, element] of this.itemElements) {
      const countElement = element.querySelector('.purse-count') as HTMLElement;
      const count = collection.get(gemType) || 0;
      countElement.textContent = count.toLocaleString();
    }
  }

  getTotal(): number {
    return this.dragonEvent.getCollectionTotal();
  }

  show(): void {
    this.update();
    this.container.classList.remove('hidden');
  }

  hide(): void {
    this.container.classList.add('hidden');
  }
}
