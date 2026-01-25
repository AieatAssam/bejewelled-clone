# Princess Puzzle Game

A magical match-3 puzzle game built with TypeScript and Three.js. Help your chosen princess collect gems while avoiding the mischievous dragon!

## Features

- **6 Unique Princesses** - Each with a special ability that affects gameplay
- **Beautiful 3D Gems** - Sparkling rubies, sapphires, emeralds, diamonds, amethysts, gold bracelets, and pearl earrings
- **Dragon Threat System** - Make small matches and the dragon gets angry! Create big combos to calm him down
- **Powerup Gems** - Match 4 gems for a Star Gem, 5+ gems for a Rainbow Gem
- **Streak System** - Build consecutive combo streaks to earn free powerups
- **Hint System** - Pay gems to reveal valid moves (cost increases with use)
- **Fairy Dust Power** - Spend gems to shuffle the board when stuck
- **Save/Load System** - Progress saved to cookies
- **Responsive Controls** - Click, drag, or swipe to swap gems

## Princesses & Abilities

| Princess | Theme | Ability | Effect |
|----------|-------|---------|--------|
| **Aurora** | Dawn | Radiant Cascade | +1 bonus gem per cascade level |
| **Marina** | Sea | Ocean Shield | Dragon steals 3 fewer gems |
| **Ivy** | Nature | Nature's Bounty | +1 bonus emerald per emerald match |
| **Ember** | Fire | Inferno Star | Star gems also explode in 3x3 area |
| **Luna** | Night | Starlight Streak | Streaks count double |
| **Crystal** | Ice | Frost Blessing | Hints & Fairy Dust cost 50% less |

## How to Play

1. **Select a Princess** - Choose based on the ability that suits your playstyle
2. **Match Gems** - Swap adjacent gems to create matches of 3 or more
3. **Collect Treasure** - Matched gems go into your purse
4. **Avoid the Dragon** - Making only small (3-gem) matches angers the dragon
5. **Create Combos** - Match 4+ gems or create cascades to reduce dragon threat and build streaks

### Controls

- **Click** two adjacent gems to swap them
- **Drag** a gem in any direction to swap
- **Hint Button (?)** - Shows a valid move (costs 2-10 gems, increases with use)
- **Fairy Dust (✨)** - Shuffles the board (costs 20% of your gems)
- **Purse** - Click to pause and view your collection
- **ESC** - Pause/Resume

## Game Mechanics

### Dragon Threat
- Single 3-gem matches **increase** threat
- 4+ gem matches **decrease** threat
- Cascades (chain reactions) **decrease** threat
- At full threat (3 small matches), dragon attacks and steals **2-9 gems**
- Marina's Ocean Shield reduces stolen amount by 3

### Powerups
- **Star Gem (⭐)** - Created from 4-gem match; clears entire row AND column
- **Rainbow Gem (🌈)** - Created from 5+ gem match; clears ALL gems of that color on board

### Streak System
- Streaks build from 4+ matches and cascades (not boring 3-matches)
- Luna's ability makes each qualifying move count as 2 streak points
- **Streak Rewards:**
  - 5 Streak: Free Star Gem
  - 10 Streak: Free Rainbow Gem
  - 15 Streak: Free Star Gem
  - 20 Streak: Free Rainbow Gem
  - 25 Streak: Double Rainbow Gem!
  - Every 10 after: Free Rainbow Gem

### Hint Cost
- Base cost: 2 gems
- Increases by 1 each use (max 10 gems)
- Crystal's Frost Blessing reduces cost by 50%

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Three.js** - 3D WebGL rendering
- **Vite** - Fast build tool and dev server
- **Vitest** - Unit testing (147 tests)
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
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run 147 unit tests
```

## Project Structure

```
princess-game/
├── src/
│   ├── main.ts              # Entry point
│   ├── game/                # Game state and save system
│   ├── scenes/              # Menu, Select, Intro, Game, Pause scenes
│   ├── puzzle/              # Board, gems, matching, dragon logic
│   ├── renderer/            # Three.js rendering, gem meshes, particles
│   ├── characters/          # Princess definitions and abilities
│   ├── ui/                  # Score display, purse UI
│   └── utils/               # Event bus
├── tests/                   # 147 unit tests
│   ├── puzzle/              # Board, MatchFinder, BoardController, Gem, DragonEvent
│   ├── game/                # GameState, SaveManager
│   └── characters/          # Princess abilities
├── .github/workflows/       # CI/CD for GitHub Pages
├── index.html               # Main HTML with styles
└── package.json
```

## Deployment

The game automatically deploys to GitHub Pages on push to main branch via GitHub Actions.

To enable:
1. Go to repository Settings → Pages
2. Set Source to "GitHub Actions"

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Three.js](https://threejs.org/)
- Fonts from [Google Fonts](https://fonts.google.com/) (Cinzel Decorative, Quicksand)
