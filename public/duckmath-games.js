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

/**
 * Clean Routing for Scramjet 2026
 * Appends a raw URL to the prefix. 
 * Ensure your Service Worker is active and bare-mux is connected.
 */
function getProxyUrl(url) {
  const basePath = '/scram/';
  return window.location.origin + basePath + url;
}

(function(){
  function init() {
    const grid = document.getElementById('games-grid');
    const search = document.getElementById('search');
    
    if (!grid || !search) return;

    function render(list) {
      grid.innerHTML = '';
      list.forEach(game => {
        const card = document.createElement('button');
        card.className = 'card';
        card.style.cssText = `
          cursor: pointer; 
          background: rgba(255,255,255,0.05); 
          border: 1px solid rgba(255,255,255,0.1); 
          border-radius: 12px; 
          padding: 15px; 
          color: #fff; 
          display: flex; 
          flex-direction: column; 
          width: 100%; 
          text-align: center;
          transition: transform 0.2s;
        `;

        card.onmouseenter = () => card.style.transform = 'scale(1.05)';
        card.onmouseleave = () => card.style.transform = 'scale(1)';

        card.innerHTML = `
          <div style="font-size:32px; margin-bottom:8px;">🎮</div>
          <div style="font-weight:bold; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${game.title}</div>
          <div style="font-size:12px; opacity:0.5;">${game.cat}</div>
        `;

        card.onclick = () => {
          // MUST include https:// and the trailing slash for the router to see it as a valid URL
          const gameUrl = `https://db.duckmath.org{game.id}/`;
          const proxiedUrl = getProxyUrl(gameUrl);
          
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'openGame', url: proxiedUrl, title: game.title }, '*');
          } else {
            window.location.href = proxiedUrl;
          }
        };
        grid.appendChild(card);
      });
    }

    search.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = GAMES.filter(g => 
        g.title.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q)
      );
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
