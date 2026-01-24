# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Princess Puzzle Game is a browser-based match-3 puzzle game built with TypeScript and Three.js. Players match gems and jewelry to collect treasures while avoiding the dragon that steals gems when they make too many small matches.

## Technology Stack

- **Language:** TypeScript
- **3D Graphics:** Three.js
- **Build Tool:** Vite
- **Testing:** Vitest
- **Save System:** js-cookie

## Development Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm test         # Run unit tests
npm run preview  # Preview production build
```

## Architecture

```
src/
├── main.ts                 # Entry point
├── game/
│   ├── Game.ts             # Main game controller
│   ├── GameState.ts        # State machine (menu, select, intro, play, pause)
│   └── SaveManager.ts      # Cookie-based save/load
├── scenes/
│   ├── MenuScene.ts        # Title screen
│   ├── SelectScene.ts      # Princess selection
│   ├── IntroScene.ts       # Dragon story cutscene
│   ├── GameScene.ts        # Main puzzle gameplay
│   └── PauseScene.ts       # Pause menu with purse inventory
├── puzzle/
│   ├── Board.ts            # 8x8 grid logic
│   ├── Gem.ts              # Gem/jewelry piece types
│   ├── MatchFinder.ts      # Match-3+ detection
│   ├── BoardController.ts  # Swap, cascade, refill logic
│   └── DragonEvent.ts      # Dragon steal-back mechanic
├── renderer/
│   ├── Renderer3D.ts       # Three.js setup
│   ├── GemMesh.ts          # 3D gem models
│   ├── ParticleSystem.ts   # Sparkle effects
│   ├── ShaderEffects.ts    # Gem shaders
│   ├── PrincessModel.ts    # Princess 3D model
│   └── DragonModel.ts      # Dragon 3D model
├── characters/
│   ├── Princess.ts         # Princess data model
│   └── princessData.ts     # 6 princess definitions
├── ui/
│   ├── UIManager.ts        # HTML/CSS overlay UI
│   ├── ScoreDisplay.ts     # Score/combo display
│   └── PurseUI.ts          # Collection inventory
└── utils/
    ├── AudioManager.ts     # Sound effects
    └── EventBus.ts         # Event communication
```

## Game Mechanics

### Match-3 Bejeweled Logic
- 8x8 grid with 7 gem/jewelry types
- Swap adjacent pieces to create matches of 3+
- Cascade system: pieces fall, new pieces spawn from top
- Special gems for 4+ matches

### Dragon Event System
- After 3 consecutive "small chains" (matches of exactly 3), the dragon swoops in
- Dragon steals 10% of collected treasure
- Incentivizes larger combos (4+, 5+, cascades)

### Scoring
- 3-match: 50 points
- 4-match: 150 points
- 5-match: 500 points
- Cascades multiply score
