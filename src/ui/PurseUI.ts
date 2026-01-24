import { GemType, GEM_COLORS } from '../puzzle/Gem';
import { DragonEvent } from '../puzzle/DragonEvent';

export class PurseUI {
  private container: HTMLElement;
  private dragonEvent: DragonEvent;
  private itemElements: Map<GemType, HTMLElement> = new Map();
  private dragonStolenElement: HTMLElement | null = null;
  private totalGemsElement: HTMLElement | null = null;

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
      min-width: 320px;
    `;

    const title = document.createElement('h2');
    title.textContent = '👜 Treasure Purse';
    title.style.cssText = `
      color: #ffd700;
      font-family: 'Cinzel Decorative', serif;
      text-align: center;
      margin-bottom: 15px;
      font-size: 1.4rem;
    `;
    container.appendChild(title);

    // Total gems display
    const totalRow = document.createElement('div');
    totalRow.style.cssText = `
      text-align: center;
      margin-bottom: 15px;
      padding: 10px;
      background: rgba(255, 215, 0, 0.15);
      border-radius: 8px;
    `;
    const totalLabel = document.createElement('span');
    totalLabel.textContent = 'Total Gems: ';
    totalLabel.style.cssText = 'color: #ffd700; font-size: 1.1rem;';
    this.totalGemsElement = document.createElement('span');
    this.totalGemsElement.textContent = '0';
    this.totalGemsElement.style.cssText = 'color: #44ff88; font-size: 1.3rem; font-weight: bold;';
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(this.totalGemsElement);
    container.appendChild(totalRow);

    const grid = document.createElement('div');
    grid.className = 'purse-grid';
    container.appendChild(grid);

    // Create item slots for each gem type
    for (const gemType of Object.values(GemType)) {
      const itemSlot = this.createItemSlot(gemType);
      grid.appendChild(itemSlot);
      this.itemElements.set(gemType, itemSlot);
    }

    // Dragon stolen display
    const dragonRow = document.createElement('div');
    dragonRow.style.cssText = `
      margin-top: 15px;
      padding: 12px;
      background: rgba(139, 0, 0, 0.4);
      border: 2px solid #8b0000;
      border-radius: 8px;
      text-align: center;
    `;
    const dragonLabel = document.createElement('span');
    dragonLabel.textContent = '🐉 Stolen by Dragon: ';
    dragonLabel.style.cssText = 'color: #ff6600; font-size: 1rem;';
    this.dragonStolenElement = document.createElement('span');
    this.dragonStolenElement.textContent = '0';
    this.dragonStolenElement.style.cssText = 'color: #ff4444; font-size: 1.2rem; font-weight: bold;';
    dragonRow.appendChild(dragonLabel);
    dragonRow.appendChild(this.dragonStolenElement);
    container.appendChild(dragonRow);

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
    let total = 0;

    for (const [gemType, element] of this.itemElements) {
      const countElement = element.querySelector('.purse-count') as HTMLElement;
      const count = collection.get(gemType) || 0;
      countElement.textContent = count.toLocaleString();
      total += count;
    }

    // Update total
    if (this.totalGemsElement) {
      this.totalGemsElement.textContent = total.toLocaleString();
    }

    // Update dragon stolen count
    if (this.dragonStolenElement) {
      const stolen = this.dragonEvent.getTotalStolenByDragon();
      this.dragonStolenElement.textContent = stolen.toLocaleString();
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
