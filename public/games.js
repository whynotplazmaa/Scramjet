(function(){
  const modal = document.getElementById('game-modal');
  const iframe = document.getElementById('game-iframe');
  const close = document.getElementById('modal-close');
  const full = document.getElementById('modal-full');
	const urlInput = document.getElementById('game-url');
	const loadBtn = document.getElementById('load-game');
	const inlineBtn = document.getElementById('open-inline');
	document.querySelectorAll('.example').forEach(e => {
		e.onclick = () => { urlInput.value = e.dataset.url; };
	});

	function attachButtons() {
    document.querySelectorAll('[data-play]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.getAttribute('data-play');
        openInline(url);
      });
    });
    document.querySelectorAll('[data-detach]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.getAttribute('data-detach');
        detachWindow(url);
      });
    });
  }

  function openInline(url) {
    iframe.src = url;
    modal.style.display = 'flex';
  }

  function detachWindow(url) {
    // Open a new window; the game pages include their own fullscreen controls
    const win = window.open(url, '_blank', 'noopener');
    if (!win) alert('Popup blocked! Allow popups to detach into a separate window.');
  }

  close.addEventListener('click', () => {
    iframe.src = 'about:blank';
    modal.style.display = 'none';
  });

  full.addEventListener('click', () => {
    const el = iframe;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  });

	function proxiedUrl(targetUrl){
		return location.origin + '/scram/' + btoa(targetUrl);
	}

	async function openGameWindow(targetUrl, inSameTab){
		if (!targetUrl) { alert('Enter a game URL'); return; }
		const prox = proxiedUrl(targetUrl);

		if (inSameTab) {
			// navigate current tab to proxied page (user can use browser fullscreen)
			window.location.href = prox;
			return;
		}

		// open about:blank to avoid popup blockers for cloaked fullscreen
		const win = window.open('about:blank', '_blank');
		if (!win) { alert('Popup blocked! Allow popups.'); return; }

		// basic container + styles
		win.document.title = 'Game';
		const style = win.document.createElement('style');
		style.textContent = `
			html,body{height:100%;margin:0;background:#000}
			iframe#game-frame{position:fixed;inset:0;width:100%;height:100%;border:0}
			#close-btn{position:fixed;right:12px;top:12px;z-index:100000;background:rgba(0,0,0,0.6);color:white;border:none;padding:8px 10px;border-radius:8px;cursor:pointer}
		`;
		win.document.head.appendChild(style);

		// create an iframe that loads the proxied page
		const iframe = win.document.createElement('iframe');
		iframe.id = 'game-frame';
		iframe.src = prox;
		iframe.allow = 'fullscreen; autoplay; geolocation; microphone; camera; encrypted-media; picture-in-picture';
		win.document.body.appendChild(iframe);

		// close button
		const closeBtn = win.document.createElement('button');
		closeBtn.id = 'close-btn';
		closeBtn.textContent = '✕';
		closeBtn.onclick = () => win.close();
		win.document.body.appendChild(closeBtn);

		// once proxied page loads, try to locate the actual game iframe/container and strip other UI
		iframe.addEventListener('load', () => {
			try {
				const doc = iframe.contentDocument || iframe.contentWindow.document;
				// heuristics: look for iframe elements inside the proxied page or common IDs/classes
				let gameEl = doc.querySelector('iframe') || doc.querySelector('[id*="game"]') || doc.querySelector('[class*="game"]') || doc.querySelector('#game-container') || doc.querySelector('.game-embed') || doc.querySelector('.gameframe');

				if (gameEl && gameEl.tagName && gameEl.tagName.toLowerCase() === 'iframe') {
					// move the inner iframe to top-level window so it truly fills the screen
					const innerSrc = gameEl.src || gameEl.getAttribute('data-src');
					if (innerSrc) {
						iframe.src = innerSrc;
					} else {
						// try to expand existing one: hide siblings and style it
						doc.body.querySelectorAll('body > *').forEach(n => n.style.display = 'none');
						gameEl.style.display = 'block';
						Object.assign(gameEl.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', border: 'none' });
					}
				} else {
					// if no inner iframe found, attempt to remove header/footer elements
					['header','nav','footer','.header','.nav','.top-bar','.cookie-banner','#cookie-banner'].forEach(sel => {
						doc.querySelectorAll(sel).forEach(n => n.remove());
					});
					// expand body to fill
					Object.assign(doc.documentElement.style, { height: '100%', background: '#000' });
					Object.assign(doc.body.style, { margin:0, height:'100%' });
				}
			} catch (e) {
				// cross-origin or other error - leave proxied page as-is
				console.warn('Could not prune proxied page:', e);
			}
		});
	}

	loadBtn.onclick = () => openGameWindow(urlInput.value, false);
	inlineBtn.onclick = () => openGameWindow(urlInput.value, true);
})();
