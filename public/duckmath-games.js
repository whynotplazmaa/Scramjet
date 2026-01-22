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
    // Scramjet usually needs URL-safe Base64
    let encoded = btoa(url)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return window.location.origin + basePath + encoded;
  } catch(e) {
    return url;
  }
}

(function(){
  function init() {
    const grid = document.getElementById('games-grid');
    const search = document.getElementById('search');
    if (!grid || !search) return;

    function render(list) {
      grid.innerHTML = '';
      for (const game of list) {
        const card = document.createElement('button');
        card.className = 'card';
        card.style.cssText = "cursor:pointer; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:12px; color:#fff; display:flex; flex-direction:column; width:100%; transition: 0.2s;";
        
        card.innerHTML = `
          <div class="thumb" style="height:60px; display:flex; align-items:center; justify-content:center; font-size:24px; background:rgba(255,255,255,0.1); border-radius:8px; margin-bottom:8px;">🎮</div>
          <div class="name" style="font-weight:bold; font-size:14px;">${game.title}</div>
          <div class="meta" style="font-size:11px; opacity:0.6;">${game.cat}</div>
        `;

        card.onclick = () => {
          // Convert hyphens to underscores for the Duckmath backend
          const gameId = game.id.replace(/-/g, '_');
          const gameUrl = `https://db.duckmath.org{gameId}/`;
          const proxiedUrl = getProxyUrl(gameUrl);
          
          if (window.parent !== window) {
            window.parent.postMessage({ type: 'openGame', url: proxiedUrl, title: game.title }, '*');
          } else {
            window.location.href = proxiedUrl;
          }
        };
        grid.appendChild(card);
      }
    }

    search.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const filtered = GAMES.filter(g => g.title.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q));
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
