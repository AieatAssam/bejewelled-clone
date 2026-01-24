import { eventBus } from './EventBus';

export interface AudioConfig {
  volume: number;
  muted: boolean;
}

class SoundEffect {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private frequency: number;
  private duration: number;
  private type: OscillatorType;

  constructor(frequency: number, duration: number, type: OscillatorType = 'sine') {
    this.frequency = frequency;
    this.duration = duration;
    this.type = type;
  }

  play(volume: number = 0.3): void {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      oscillator.type = this.type;
      oscillator.frequency.value = this.frequency;

      // Envelope
      const now = this.audioContext.currentTime;
      this.gainNode.gain.setValueAtTime(volume, now);
      this.gainNode.gain.exponentialRampToValueAtTime(0.01, now + this.duration);

      oscillator.start(now);
      oscillator.stop(now + this.duration);
    } catch (e) {
      // Audio not available
    }
  }
}

export class AudioManager {
  private config: AudioConfig = {
    volume: 0.5,
    muted: false,
  };

  private sounds: Map<string, SoundEffect> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.initializeSounds();
    this.setupEventListeners();
  }

  private initializeSounds(): void {
    // Match sounds - ascending notes
    this.sounds.set('match3', new SoundEffect(523.25, 0.15, 'sine')); // C5
    this.sounds.set('match4', new SoundEffect(659.25, 0.2, 'sine'));  // E5
    this.sounds.set('match5', new SoundEffect(783.99, 0.25, 'sine')); // G5

    // Combo sounds
    this.sounds.set('combo', new SoundEffect(880, 0.3, 'triangle'));  // A5

    // Swap sound
    this.sounds.set('swap', new SoundEffect(440, 0.1, 'sine'));      // A4

    // Invalid move
    this.sounds.set('invalid', new SoundEffect(220, 0.15, 'sawtooth')); // A3

    // Dragon warning
    this.sounds.set('dragonWarning', new SoundEffect(146.83, 0.5, 'sawtooth')); // D3

    // Collect sound
    this.sounds.set('collect', new SoundEffect(1046.50, 0.1, 'sine')); // C6

    // UI sounds
    this.sounds.set('click', new SoundEffect(600, 0.05, 'square'));
    this.sounds.set('hover', new SoundEffect(800, 0.03, 'sine'));
  }

  private setupEventListeners(): void {
    eventBus.on('validSwap', () => this.play('swap'));

    eventBus.on('gemsRemoved', (matches: unknown[], cascadeCount: number) => {
      const matchArr = matches as { length: number }[];
      for (const match of matchArr) {
        if (match.length >= 5) {
          this.play('match5');
        } else if (match.length >= 4) {
          this.play('match4');
        } else {
          this.play('match3');
        }
      }

      if (cascadeCount > 1) {
        setTimeout(() => this.play('combo'), 100);
      }
    });

    eventBus.on('dragonEvent', () => {
      this.play('dragonWarning');
    });

    // Initialize audio context on first user interaction
    const initAudio = () => {
      this.initialized = true;
      document.removeEventListener('click', initAudio);
      document.removeEventListener('keydown', initAudio);
    };
    document.addEventListener('click', initAudio);
    document.addEventListener('keydown', initAudio);
  }

  play(soundName: string): void {
    if (this.config.muted || !this.initialized) return;

    const sound = this.sounds.get(soundName);
    if (sound) {
      sound.play(this.config.volume);
    }
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(1, volume));
  }

  getVolume(): number {
    return this.config.volume;
  }

  mute(): void {
    this.config.muted = true;
  }

  unmute(): void {
    this.config.muted = false;
  }

  toggleMute(): boolean {
    this.config.muted = !this.config.muted;
    return this.config.muted;
  }

  isMuted(): boolean {
    return this.config.muted;
  }
}

export const audioManager = new AudioManager();
