const GAMES = [
  { id: 'golf-orbit', title: 'Golf Orbit', cat: 'Sports' },
  { id: 'steal-a-brainrot', title: 'Steal A Brainrot', cat: 'Casual' },
  { id: 'highway-traffic', title: 'Highway Traffic', cat: 'Driving' },
  { id: 'escape-car', title: 'Escape Car', cat: 'Driving' },
  { id: 'race-survival-arena-king', title: 'Race Survival Arena King', cat: 'Racing' },
  { id: 'stickman-gta-city', title: 'Stickman GTA City', cat: '3D' },
  { id: 'drift-king', title: 'Drift King', cat: 'Driving' },
  { id: 'gun-spin', title: 'Gun Spin', cat: 'Action' },
  { id: 'gta-simulator', title: 'GTA Simulator', cat: '3D' },
  { id: 'crazy-cattle-3d-pro', title: 'Crazy Cattle 3D Pro', cat: '3D' },
  { id: 'stack-fire-ball', title: 'Stack Fire Ball', cat: 'Puzzle' },
  { id: 'basket-random', title: 'Basket Random', cat: 'Sports' },
  { id: 'checkout-frenzy', title: 'Checkout Frenzy', cat: 'Casual' },
  { id: 'smash-karts', title: 'Smash Karts', cat: 'Racing' },
  { id: 'basket-random-pro', title: 'Basket Random Pro', cat: 'Sports' },
  { id: 'stickman-destruction', title: 'Stickman Destruction', cat: 'Action' },
  { id: 'su-battle-royale', title: 'Su Battle Royale', cat: 'Action' },
  { id: 'brookhaven', title: 'Brookhaven', cat: 'Multiplayer' },
  { id: 'plants-vs-brainrots', title: 'Plants Vs Brainrots', cat: 'Strategy' },
  { id: 'capybara-clicker', title: 'Capybara Clicker', cat: 'Clicker' },
  { id: 'minecraft', title: 'Minecraft', cat: '3D' },
  { id: 'ragdoll-archers', title: 'Ragdoll Archers', cat: 'Action' },
  { id: 'grow-a-garden', title: 'Grow A Garden', cat: 'Casual' },
  { id: 'undertale-yellow', title: 'Undertale Yellow', cat: 'RPG' }
];

function getProxyUrl(url) {
  try {
    const basePath = '/scram/';
    return window.location.origin + basePath + btoa(url);
  } catch(e) {
    return url;
  }
}

(function(){
  function init() {
    const grid = document.getElementById('games-grid');
    const search = document.getElementById('search');
    
    if (!grid || !search) {
      console.error('Grid or search element not found');
      return;
    }
    
    let filtered = GAMES;

    function render(list) {
      grid.innerHTML = '';
      for (const game of list) {
        const card = document.createElement('button');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.style.background = 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))';
        card.style.border = '1px solid rgba(255,255,255,0.1)';
        card.style.borderRadius = '12px';
        card.style.padding = '12px';
        card.style.color = '#fff';
        card.style.textDecoration = 'none';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.innerHTML = `
          <div class="thumb">${game.title.substring(0, 1).toUpperCase()}</div>
          <div class="name">${game.title}</div>
          <div class="meta">${game.cat}</div>
        `;
        card.onclick = () => {
          const gameUrl = `https://db.duckmath.org/html/${game.id.replace(/-/g, '_')}/`;
          const proxiedUrl = getProxyUrl(gameUrl);
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'openGame', url: proxiedUrl, title: game.title }, '*');
          }
        };
        grid.appendChild(card);
      }
    }

    search.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      filtered = GAMES.filter(g => g.title.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q));
      render(filtered);
    });

    render(GAMES);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

