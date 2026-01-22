# Games Feature

The Scramjet proxy now includes an integrated games hub that lets you play popular online games through the proxy.

## Files Overview

### Games Configuration
- **`games.json`** - JSON file containing the list of available games with metadata (name, URL, description, category)

### Games Pages
- **`games.html`** - Main games hub page with filtering and game selection
- **`games.js`** - JavaScript logic for loading, filtering, and displaying games
- **`home.js`** - Landing page with prominent Games button

### Browser Pages
- **`browser.html`** - Full browser interface (moved from index.html)
- **`index.html`** - Now loads the home.js landing page
- **`ui.js`** - Browser UI components and logic

## How to Add More Games

Edit `/static/games.json` and add entries with this format:

```json
{
  "name": "Game Name",
  "url": "https://game-website.com",
  "description": "Brief description of the game",
  "category": "arcade|puzzle|strategy|word"
}
```

Categories available:
- `arcade` - Classic arcade-style games
- `puzzle` - Puzzle and logic games
- `strategy` - Strategy and board games
- `word` - Word games and crosswords

## Features

- **Game Library**: Curated collection of online games
- **Filtering**: Filter games by category
- **Proxy Integration**: All games play through Scramjet proxy for privacy
- **Responsive Design**: Works on desktop and mobile
- **Easy Navigation**: One-click access from the home page

## URL Structure

- `/` - Home page with navigation
- `/browser.html` - Full proxy browser
- `/games.html` - Games hub
