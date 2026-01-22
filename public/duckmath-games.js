// Games available from DuckMath - a curated list of popular games
const DUCKMATH_GAMES = [
  { id: 'golf-orbit', title: 'Golf Orbit', category: 'Sports' },
  { id: 'steal-a-brainrot', title: 'Steal A Brainrot', category: 'Casual' },
  { id: 'highway-traffic', title: 'Highway Traffic', category: 'Driving' },
  { id: 'escape-car', title: 'Escape Car', category: 'Driving' },
  { id: 'race-survival-arena-king', title: 'Race Survival Arena King', category: 'Racing' },
  { id: 'stickman-gta-city', title: 'Stickman GTA City', category: '3D' },
  { id: 'drift-king', title: 'Drift King', category: 'Driving' },
  { id: 'gun-spin', title: 'Gun Spin', category: 'Action' },
  { id: 'gta-simulator', title: 'GTA Simulator', category: '3D' },
  { id: 'crazy-cattle-3d-pro', title: 'Crazy Cattle 3D Pro', category: '3D' },
  { id: 'stack-fire-ball', title: 'Stack Fire Ball', category: 'Puzzle' },
  { id: 'basket-random', title: 'Basket Random', category: 'Sports' },
  { id: 'checkout-frenzy', title: 'Checkout Frenzy', category: 'Casual' },
  { id: 'smash-karts', title: 'Smash Karts', category: 'Racing' },
  { id: 'basket-random-pro', title: 'Basket Random Pro', category: 'Sports' },
  { id: 'stickman-destruction', title: 'Stickman Destruction', category: 'Action' },
  { id: 'su-battle-royale', title: 'Su Battle Royale', category: 'Action' },
  { id: 'brookhaven', title: 'Brookhaven', category: 'Multiplayer' },
  { id: 'plants-vs-brainrots', title: 'Plants Vs Brainrots', category: 'Tower Defense' },
  { id: 'capybara-clicker', title: 'Capybara Clicker', category: 'Clicker' },
  { id: 'minecraft', title: 'Minecraft', category: '3D' },
  { id: 'ragdoll-archers', title: 'Ragdoll Archers', category: 'Action' },
  { id: 'grow-a-garden', title: 'Grow A Garden', category: 'Casual' },
  { id: 'undertale-yellow', title: 'Undertale Yellow', category: 'RPG' }
];

(function(){
  const listRoot = document.getElementById('list-root');

  // Fetch a game's thumbnail and data
  async function fetchGameData(gameId) {
    try {
      // DuckMath redirects /class/{id} to db.duckmath.org/html/{id}/
      const dbUrl = `https://db.duckmath.org/html/${gameId.replace(/-/g, '_')}/`;
      
      // For now, return basic metadata - actual thumbnail would require parsing the page
      // which might be blocked due to CORS. Instead, we'll use a placeholder and the game ID.
      return {
        id: gameId,
        thumbnail: null, // We'll use a placeholder
        accessible: true
      };
    } catch(e) {
      console.warn(`Failed to fetch data for ${gameId}:`, e);
      return { id: gameId, thumbnail: null, accessible: false };
    }
  }

  // Create a game card element
  function createCard(game) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    
    const img = document.createElement('img');
    img.alt = game.title;
    img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220"><rect width="100%" height="100%" fill="%237b1fa2"/><text x="50%" y="50%" fill="%23fff" font-size="16" font-weight="bold" text-anchor="middle" dominant-baseline="middle">${encodeURIComponent(game.title.substring(0, 15))}</text></svg>`;
    img.style.background = '#7b1fa2';
    thumb.appendChild(img);
    
    const name = document.createElement('div');
    name.className = 'name';
    name.textContent = game.title;
    
    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.textContent = game.category || 'Game';
    
    card.appendChild(thumb);
    card.appendChild(name);
    card.appendChild(meta);
    
    card.onclick = () => openGame(game.id, game.title);
    
    return card;
  }

  // Open a game using the game player
  function openGame(gameId, title) {
    // Navigate to the game-player.html with the game ID
    window.location.href = `/game-player.html?game=${encodeURIComponent(gameId)}`;
  }

  // Get proxy URL (similar to existing proxy logic in the app)
  function getProxyUrl(targetUrl) {
    // Check if a proxy engine is configured
    const engine = localStorage.getItem('proxy-engine') || 'none';
    const basePath = localStorage.getItem('proxy-path') || '/scram/';
    
    if (engine === 'none' || !basePath) {
      // Return direct URL
      return targetUrl;
    }
    
    // Build proxied URL
    const path = basePath.startsWith('/') ? basePath : '/' + basePath;
    return location.origin + path + btoa(targetUrl);
  }

  // Initialize the games list
  async function init() {
    listRoot.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'grid';
    
    // Add cards for all games
    for (const game of DUCKMATH_GAMES) {
      const card = createCard(game);
      grid.appendChild(card);
    }
    
    listRoot.appendChild(grid);
  }

  // Start loading games
  init();
})();
