# Princess Puzzle Game

A magical match-3 puzzle game built with TypeScript and Three.js. Help your chosen princess collect gems while avoiding the mischievous dragon!

## Features

- **6 Unique Princesses** - Choose from Aurora, Marina, Ivy, Ember, Luna, or Crystal, each with their own color theme
- **Beautiful 3D Gems** - Sparkling rubies, sapphires, emeralds, diamonds, amethysts, gold bracelets, and pearl earrings
- **Dragon Threat System** - Make small matches and the dragon gets angry! Create big combos to calm him down
- **Powerup Gems** - Match 4 gems for a Star Gem, 5+ gems for a Rainbow Gem
- **Streak System** - Build consecutive move streaks for celebrations and rewards
- **Fairy Dust Power** - Spend gems to shuffle the board when you're stuck
- **Save/Load System** - Your progress is saved to cookies
- **Responsive Controls** - Click, drag, or swipe to swap gems

## How to Play

1. **Select a Princess** - Choose your favorite princess to begin
2. **Match Gems** - Swap adjacent gems to create matches of 3 or more
3. **Collect Treasure** - Matched gems go into your purse
4. **Avoid the Dragon** - Making only small (3-gem) matches angers the dragon. He'll swoop in and steal your gems!
5. **Create Combos** - Match 4+ gems or create cascades to reduce dragon threat and earn more gems

### Controls

- **Click** two adjacent gems to swap them
- **Drag** a gem in any direction to swap
- **Hint Button (?)** - Shows a valid move
- **Fairy Dust (✨)** - Shuffles the board (costs 20% of your gems)
- **Purse** - Click to pause and view your collection
- **ESC** - Pause/Resume

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Three.js** - 3D WebGL rendering
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing framework
- **js-cookie** - Cookie-based save system

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/princess-game.git
cd princess-game

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Development

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run unit tests
```

## Project Structure

```
princess-game/
├── src/
│   ├── main.ts              # Entry point
│   ├── game/                # Game state and save system
│   ├── scenes/              # Menu, Select, Intro, Game, Pause scenes
│   ├── puzzle/              # Board, gems, matching logic
│   ├── renderer/            # Three.js rendering, gem meshes, particles
│   ├── characters/          # Princess definitions
│   ├── ui/                  # UI components
│   └── utils/               # Event bus and utilities
├── tests/                   # Unit tests
├── index.html               # Main HTML with styles
└── package.json
```

## Game Mechanics

### Scoring
- Gems collected are counted (not arbitrary points)
- Dragon steals gems if you make 3 consecutive small matches

### Dragon Threat
- Single 3-gem matches **increase** threat
- 4+ gem matches **decrease** threat
- Cascades (chain reactions) **decrease** threat
- At full threat, dragon attacks and steals 1-5 gems

### Powerups
- **Star Gem (⭐)** - Match 4 gems to create; clears gems in a cross pattern
- **Rainbow Gem (🌈)** - Match 5+ gems to create; clears all gems of chosen color

### Streak System
- Build streaks by making consecutive successful matches
- Streak counter appears after 3+ moves
- Celebration messages at 5, 10, and 25 move streaks
- Failed swaps reset your streak

### Special Features
- **Hint System** - Highlights a valid move with pulsing animation
- **Fairy Dust** - Emergency shuffle when stuck (costs gems)
- **Flying Gem Animation** - Collected gems fly into your purse
- **Cascade Visibility** - See each cascade level as it happens
- **Purse Pulse** - Purse glows with colors of collected gems

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Fonts from [Google Fonts](https://fonts.google.com/) (Cinzel Decorative, Quicksand)
