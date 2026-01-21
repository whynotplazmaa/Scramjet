"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

let scramjet = null;
let scramjetInitPromise = null;
let activeFrame = null;

function prefetchScramjetAssets() {
	try {
		// warm up wasm and scripts in the background
		fetch('/scram/scramjet.wasm.wasm', { cache: 'force-cache' }).catch(() => {});
		fetch('/scram/scramjet.all.js', { cache: 'force-cache' }).catch(() => {});
	} catch (e) {}
}

async function ensureScramjet() {
	if (scramjet) return scramjet;
	if (scramjetInitPromise) {
		await scramjetInitPromise;
		return scramjet;
	}
	const { ScramjetController } = $scramjetLoadController();
	scramjet = new ScramjetController({
		files: {
			wasm: '/scram/scramjet.wasm.wasm',
			all: '/scram/scramjet.all.js',
			sync: '/scram/scramjet.sync.js',
		},
	});
	scramjetInitPromise = scramjet.init();
	await scramjetInitPromise;
	return scramjet;
}

// Start prefetching assets after a short idle period
setTimeout(prefetchScramjetAssets, 1000);
const connection = new BareMux.BareMuxConnection("/baremux/worker.js");

// Settings Logic
const settingsBtn = document.getElementById("settings-btn");
const settingsModal = document.getElementById("settings-modal");
const saveBtn = document.getElementById("save-settings");

settingsBtn.onclick = () => (settingsModal.style.display = "flex");
window.onclick = (e) => {
	if (e.target == settingsModal) settingsModal.style.display = "none";
};

// Load settings from localStorage
document.getElementById("wisp-url").value =
	localStorage.getItem("plazma-wisp") || "";
document.getElementById("about-blank-toggle").checked =
	localStorage.getItem("plazma-cloak") === "true";

saveBtn.onclick = () => {
	localStorage.setItem(
		"plazma-wisp",
		document.getElementById("wisp-url").value
	);
	localStorage.setItem(
		"plazma-cloak",
		document.getElementById("about-blank-toggle").checked
	);
	settingsModal.style.display = "none";
};

form.addEventListener('submit', async (event) => {
	event.preventDefault();
	try {
		await registerSW();
	} catch (err) {
		error.textContent = 'Worker registration failed.';
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);
	const customWisp = localStorage.getItem('plazma-wisp');
	const wispUrl =
		customWisp ||
		(location.protocol === 'https:' ? 'wss' : 'ws') +
			'://' +
			location.host +
			'/wisp/';

	if ((await connection.getTransport()) !== '/libcurl/index.mjs') {
		await connection.setTransport('/libcurl/index.mjs', [
			{ websocket: wispUrl },
		]);
	}

	const isCloaked = localStorage.getItem('plazma-cloak') === 'true';

	// replace cloaked about:blank iframe src to respect selected engine/path
	if (isCloaked) {
		// about:blank cloaking logic (keeps original behavior)
		const win = window.open('about:blank', '_blank');
		if (!win) {
			alert('Popup blocked! Allow popups to use cloaking.');
			return;
		}
		const iframe = win.document.createElement('iframe');
		Object.assign(iframe.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100vw',
			height: '100vh',
			border: 'none',
			background: 'white',
		});
		iframe.src = getProxyUrl(url);
		win.document.body.appendChild(iframe);
		return;
	}

	// Non-cloaked: reuse existing frame where possible to avoid reallocation
	await ensureScramjet();

	try {
		if (activeFrame && activeFrame.frame && document.body.contains(activeFrame.frame)) {
			// reuse existing frame
			activeFrame.go(url);
			return;
		}

		const frame = scramjet.createFrame();
		activeFrame = frame;
		Object.assign(frame.frame.style, {
			position: 'fixed',
			top: '0',
			left: '0',
			width: '100vw',
			height: '100vh',
			border: 'none',
			zIndex: '9999',
			backgroundColor: 'white',
		});

		// add a small close button to the frame container
		const closeBtn = document.createElement('button');
		closeBtn.textContent = '✕';
		Object.assign(closeBtn.style, {
			position: 'fixed',
			right: '12px',
			top: '12px',
			zIndex: '10000',
			background: 'rgba(0,0,0,0.6)',
			color: 'white',
			border: 'none',
			padding: '8px 10px',
			borderRadius: '8px',
			cursor: 'pointer',
		});
		closeBtn.onclick = () => {
			try {
				if (activeFrame && activeFrame.frame && document.body.contains(activeFrame.frame)) {
					document.body.removeChild(activeFrame.frame);
				}
			} catch (e) {}
			if (closeBtn.parentNode) closeBtn.parentNode.removeChild(closeBtn);
			activeFrame = null;
		};

		document.body.appendChild(frame.frame);
		document.body.appendChild(closeBtn);
		frame.go(url);
	} catch (err) {
		error.textContent = 'Failed to create proxy frame.';
		errorCode.textContent = err.toString();
		console.error(err);
	}
});

// Replace the previous games panel with an enhanced fixed panel (no dragging), engine toggle and many features
(function addEnhancedPanel(){
	const CSS = `
		#games-btn { position: fixed; left: 18px; top: 18px; z-index:11000;
			background: linear-gradient(45deg,#7b1fa2,#ec407a); color:#fff;
			border: none; padding:10px 12px; border-radius:12px; cursor:pointer;
			box-shadow: 0 8px 24px rgba(124,58,237,0.18); font-weight:700;
		}
		#games-panel { position: fixed; left: 60px; top: 60px; width: 920px; max-width: calc(100vw - 120px);
			height: 70vh; max-height: calc(100vh - 120px); background: rgba(255,255,255,0.95);
			backdrop-filter: blur(6px); border-radius: 14px; border: 1px solid rgba(0,0,0,0.08);
			box-shadow: 0 20px 60px rgba(2,6,23,0.08); z-index: 10999; display: none; flex-direction: column; overflow: hidden;
			color: #000;
		}
		#games-panel.show{ display:flex; }
		#games-panel .header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background: rgba(255,255,255,0.98); gap:12px; flex-wrap:wrap; border-bottom: 1px solid rgba(0,0,0,0.04) }
		#games-panel .title { color: #000; font-weight:800; letter-spacing:-0.5px }
		.controls-group { display:flex; gap:8px; align-items:center }
		.panel-input { background: #fff; border: 1px solid rgba(0,0,0,0.08); color:#000; padding:6px 8px; border-radius:8px; }
		#games-panel .grid { padding:12px; display:grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap:12px; overflow:auto; flex:1; background: transparent; }
		.game-card { background: #fff; border-radius:10px; padding:8px; cursor:pointer; display:flex; flex-direction:column; gap:8px; border:1px solid rgba(0,0,0,0.06); min-height:160px; color:#000 }
		.thumb { height:110px; border-radius:8px; overflow:hidden; background:#f5f5f5; display:flex; align-items:center; justify-content:center }
		.thumb img{ width:100%; height:100%; object-fit:cover; display:block }
		.name{ color:#000; font-size:13px; font-weight:600; line-height:1.2 }
		.meta{ color: rgba(0,0,0,0.6); font-size:12px }
		.footer { padding:10px 12px; font-size:13px; color:rgba(0,0,0,0.7); background: rgba(255,255,255,0.98); display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid rgba(0,0,0,0.04) }
		.panel-btn { background: linear-gradient(45deg,#7b1fa2,#ec407a); border:none; color:#fff; padding:8px 10px; border-radius:8px; cursor:pointer; }
		.status { color: rgba(0,0,0,0.75); font-size:13px; margin-left:8px }
	`;
	const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

	const btn = document.createElement('button');
	btn.id = 'games-btn'; btn.title = 'Hub'; btn.textContent = '🎮 Hub';

	const panel = document.createElement('div');
	panel.id = 'games-panel';
	panel.innerHTML = `
		<div class="header">
			<div style="display:flex;align-items:center;gap:12px;">
				<div class="title">Play & Media Hub</div>
				<div class="controls-group">
					<select id="engine-select" class="panel-input" title="Proxy engine"><option value="scramjet">Scramjet</option><option value="ultraviolet">Ultraviolet</option></select>
					<input id="proxy-path" class="panel-input" placeholder="/scram/" title="Custom proxy path" />
					<input id="max-pages" class="panel-input" placeholder="Max pages" style="width:90px" />
					<input id="games-filter" class="panel-input" placeholder="Filter games..." />
				</div>
			</div>
			<div style="display:flex;align-items:center;gap:8px">
				<button class="panel-btn" id="refresh-panel">Refresh</button>
				<button class="panel-btn" id="export-cache">Export</button>
				<button class="panel-btn" id="clear-cache">Clear Cache</button>
				<button class="panel-btn" id="close-panel">Close</button>
			</div>
		</div>
		<div class="grid" id="games-grid"></div>
		<div class="footer">
			<div><span class="status" id="games-status">Idle</span></div>
			<div><small style="color:rgba(255,255,255,0.5)">Proxy-powered • Colors synced</small></div>
		</div>
	`;

	// inject near settings button
	if (settingsBtn && settingsBtn.parentNode) {
		settingsBtn.parentNode.insertBefore(btn, settingsBtn.nextSibling);
		settingsBtn.parentNode.insertBefore(panel, settingsBtn.nextSibling);
	} else {
		document.body.appendChild(btn);
		document.body.appendChild(panel);
	}

	// persistence keys & helpers
	const KEY_ENGINE = 'proxy-engine';
	const KEY_PATH = 'proxy-path';
	const KEY_MAX = 'crazy-max-pages';
	const KEY_CACHE = 'crazygames-all';
	const engineSelect = panel.querySelector('#engine-select');
	const proxyPathInput = panel.querySelector('#proxy-path');
	const maxPagesInput = panel.querySelector('#max-pages');
	const filterInput = panel.querySelector('#games-filter');
	const statusEl = panel.querySelector('#games-status');

	engineSelect.value = localStorage.getItem(KEY_ENGINE) || 'scramjet';
	proxyPathInput.value = localStorage.getItem(KEY_PATH) || '/scram/';
	maxPagesInput.value = localStorage.getItem(KEY_MAX) || '60';

	engineSelect.addEventListener('change', ()=> localStorage.setItem(KEY_ENGINE, engineSelect.value));
	proxyPathInput.addEventListener('change', ()=> localStorage.setItem(KEY_PATH, proxyPathInput.value));
	maxPagesInput.addEventListener('change', ()=> localStorage.setItem(KEY_MAX, maxPagesInput.value));

	function getProxyUrl(u){
		const engine = engineSelect.value || 'scramjet';
		const basePath = proxyPathInput.value && proxyPathInput.value.trim() ? proxyPathInput.value.trim() : (engine === 'scramjet' ? '/scram/' : '/ultraviolet/');
		const path = basePath.startsWith('/') ? basePath : '/' + basePath;
		return location.origin + path + btoa(u);
	}

	// new: try multiple proxy paths and detect "blocked" pages
	async function tryFetchProxied(targetUrl, candidatePaths) {
		candidatePaths = candidatePaths || [];
		// ensure user path first then sensible defaults
		const userPath = (proxyPathInput.value && proxyPathInput.value.trim()) ? proxyPathInput.value.trim() : null;
		const defaults = ['/scram/', '/ultraviolet/', '/proxy/'];
		const tried = [];
		if (userPath) candidatePaths.unshift(userPath);
		for (const p of [...new Set([...candidatePaths, ...defaults])]) {
			const path = p.startsWith('/') ? p : '/' + p;
			const url = location.origin + path + btoa(targetUrl);
			tried.push(path);
			try {
				const res = await fetch(url);
				const text = await res.text();
				// detect common "blocked" indicators
				const blockedRx = /Your organization has blocked access|blocked access|Access Denied|This site is blocked|403 Forbidden/i;
				if (!res.ok || blockedRx.test(text)) {
					// try next
					continue;
				}
				return { ok: true, text, path, url, res };
			} catch (e) {
				// network error - try next
				continue;
			}
		}
		return { ok: false, tried };
	}

	// crawler + cache (no SAMPLE_GAMES fallback)
	async function crawlCrazyGames(maxPages = 300, onProgress){
		const seen = new Map();
		const base = 'https://www.crazygames.com';
		for(let page=1; page<=maxPages; page++){
			onProgress && onProgress(page, maxPages);
			const listUrl = base + '/t/games?page=' + page;
			try {
				// try fetching via multiple proxy endpoints and detect blocking
				const probe = await tryFetchProxied(listUrl);
				if (!probe.ok) {
					// if nothing worked, stop crawling and surface the issue
					statusEl.textContent = 'Blocked or no proxy reachable. Try changing proxy path/engine.';
					break;
				}
				const txt = probe.text;
				// optionally record which proxy path worked
				localStorage.setItem('last-proxy-used', probe.path);

				const doc = new DOMParser().parseFromString(txt,'text/html');
				const anchors = Array.from(doc.querySelectorAll('a')).filter(a=>{
					const href = a.getAttribute('href') || '';
					return href.includes('/game/');
				});
				let newFound = 0;
				for(const a of anchors){
					let href = a.getAttribute('href') || '';
					if(!href) continue;
					let url = href.startsWith('http') ? href : (href.startsWith('/') ? base + href : base + '/' + href);
					url = url.split('#')[0].split('?')[0];
					if(seen.has(url)) continue;
					const img = a.querySelector('img') || a.querySelector('picture img');
					let thumb = img ? (img.getAttribute('data-src') || img.getAttribute('src') || '') : '';
					if(thumb && thumb.startsWith('//')) thumb = location.protocol + thumb;
					if(thumb && thumb.startsWith('/')) thumb = base + thumb;
					let title = a.getAttribute('title') || (img && img.getAttribute('alt')) || (a.textContent||'').trim();
					if(!title){
						const t = a.querySelector('.text') || a.querySelector('.game-title') || a.querySelector('.card-title');
						if(t) title = (t.textContent||'').trim();
					}
					seen.set(url, { url, title: title||url, thumb: thumb||null });
					newFound++;
				}
				if(newFound === 0) break;
			} catch(e){
				console.warn('crawl error', e);
				break;
			}
			await new Promise(r=>setTimeout(r, 150));
		}
		return Array.from(seen.values());
	}

	async function ensureGamesLoaded(){
		const cached = localStorage.getItem(KEY_CACHE);
		if (cached) {
			try{
				renderGames(JSON.parse(cached));
				// refresh in background
				crawlAndRender(false).catch(()=>{});
				return;
			}catch(e){}
		}
		await crawlAndRender(true);
	}

	async function crawlAndRender(forceFull){
		try {
			const max = parseInt(maxPagesInput.value,10) || 60;
			panel.querySelector('#games-grid').innerHTML = '<div style="padding:20px;color:rgba(255,255,255,0.7)">Fetching games… this may take a while</div>';
			statusEl.textContent = 'Crawling...';
			const data = await crawlCrazyGames(max, (page,total)=> {
				statusEl.textContent = `Crawling page ${page}/${total}...`;
			});
			if (!data || data.length === 0) {
				statusEl.textContent = 'No games found';
				panel.querySelector('#games-grid').innerHTML = '<div style="padding:18px;color:rgba(255,255,255,0.7)">No games found</div>';
				return;
			}
			// sort alphabetically and cache
			data.sort((a,b)=> (a.title||'').localeCompare(b.title||''));
			localStorage.setItem(KEY_CACHE, JSON.stringify(data));
			statusEl.textContent = `Fetched ${data.length} games`;
			renderGames(data);
		} catch(e){
			statusEl.textContent = 'Failed to fetch';
			panel.querySelector('#games-grid').innerHTML = '<div style="padding:20px;color:rgba(255,80,80,0.9)">Failed to fetch games</div>';
			console.error(e);
		}
	}

	function renderGames(list){
		const grid = panel.querySelector('#games-grid');
		grid.innerHTML = '';
		const filter = (filterInput.value || '').toLowerCase().trim();
		const filtered = filter ? list.filter(g => (g.title||'').toLowerCase().includes(filter) || (g.url||'').toLowerCase().includes(filter)) : list;
		if(!filtered || filtered.length===0){ grid.innerHTML = '<div style="padding:18px;color:rgba(255,255,255,0.7)">No games match filter</div>'; return; }
		for(const g of filtered){
			const card = document.createElement('div'); card.className = 'game-card';
			const thumb = document.createElement('div'); thumb.className = 'thumb';
			const img = document.createElement('img'); img.alt = g.title || g.url;
			img.src = g.thumb || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220"><rect width="100%" height="100%" fill="%23071b26"/><text x="50%" y="50%" fill="%23fff" font-size="18" text-anchor="middle" alignment-baseline="middle">No Image</text></svg>';
			thumb.appendChild(img);
			const name = document.createElement('div'); name.className='name'; name.textContent = g.title || g.url;
			const meta = document.createElement('div'); meta.className='meta'; meta.textContent = new URL(g.url).hostname;
			const fsbtn = document.createElement('button'); fsbtn.className='panel-btn'; fsbtn.textContent='Fullscreen';
			fsbtn.style.marginTop = '6px';
			fsbtn.onclick = (ev)=>{ ev.stopPropagation(); openFullscreenGame(g.url); };
			card.appendChild(thumb); card.appendChild(name); card.appendChild(meta); card.appendChild(fsbtn);
			card.onclick = ()=> openFullscreenGame(g.url);
			grid.appendChild(card);
		}
	}

	// wire UI actions
	btn.addEventListener('click', ()=> {
		panel.classList.toggle('show');
		if(panel.classList.contains('show')) ensureGamesLoaded();
	});
	panel.querySelector('#close-panel').addEventListener('click', ()=> panel.classList.remove('show'));
	panel.querySelector('#refresh-panel').addEventListener('click', async ()=> {
		panel.querySelector('#games-grid').innerHTML = ''; await crawlAndRender(true);
	});
	panel.querySelector('#clear-cache').addEventListener('click', ()=> {
		localStorage.removeItem(KEY_CACHE);
		statusEl.textContent = 'Cache cleared';
	});
	panel.querySelector('#export-cache').addEventListener('click', ()=> {
		const data = localStorage.getItem(KEY_CACHE) || '[]';
		const blob = new Blob([data], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a'); a.href = url; a.download = 'crazygames.json'; a.click();
		URL.revokeObjectURL(url);
	});

	filterInput.addEventListener('input', ()=> {
		try { const cached = JSON.parse(localStorage.getItem(KEY_CACHE) || '[]'); renderGames(cached); } catch(e){}
	});

	// open proxied game in a cloaked fullscreen window - respects engine/proxy settings via getProxyUrl
	async function openFullscreenGame(targetUrl){
		// navigate to games.html in the same tab and pass the b64-encoded target
		try {
			const enc = encodeURIComponent(btoa(targetUrl));
			location.href = location.origin + '/games.html?u=' + enc;
		} catch (e) {
			// fallback: store in localStorage if btoa fails for some input
			localStorage.setItem('selected-game', JSON.stringify({ url: targetUrl }));
			location.href = location.origin + '/games.html';
		}
	}

	// initial load of saved settings
	(function loadInitialSettings(){
		const cachedEngine = localStorage.getItem(KEY_ENGINE);
		if(cachedEngine) engineSelect.value = cachedEngine;
		const cachedPath = localStorage.getItem(KEY_PATH);
		if(cachedPath) proxyPathInput.value = cachedPath;
		const cachedMax = localStorage.getItem(KEY_MAX);
		if(cachedMax) maxPagesInput.value = cachedMax;
	})();
})();
