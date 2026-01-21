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
		iframe.src = location.origin + '/scram/' + btoa(url);
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

// Replace the previous games button code with a styled windowed panel, crawler and fullscreen opener
(function addGamesPanel(){
	const CSS = `
		#games-btn { position: fixed; left: 18px; top: 18px; z-index:11000;
			background: linear-gradient(45deg,#7b1fa2,#ec407a); color:#fff;
			border: none; padding:10px 12px; border-radius:12px; cursor:pointer;
			box-shadow: 0 8px 24px rgba(124,58,237,0.18); font-weight:700;
		}
		#games-panel { position: fixed; left: 60px; top: 60px; width: 920px; max-width: calc(100vw - 120px);
			height: 70vh; max-height: calc(100vh - 120px); background: rgba(255,255,255,0.06);
			backdrop-filter: blur(10px); border-radius: 14px; border: 1px solid rgba(255,255,255,0.06);
			box-shadow: 0 20px 60px rgba(2,6,23,0.6); z-index: 10999; display: none; flex-direction: column; overflow: hidden;
		}
		#games-panel.show{ display:flex; }
		#games-panel .header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent); }
		#games-panel .title { color: #fff; font-weight:800; letter-spacing:-0.5px }
		#games-panel .controls { display:flex; gap:8px; align-items:center }
		#games-panel .grid { padding:12px; display:grid; grid-template-columns: repeat(auto-fill,minmax(180px,1fr)); gap:12px; overflow:auto; }
		.game-card { background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border-radius:10px; padding:8px; cursor:pointer; display:flex; flex-direction:column; gap:8px; border:1px solid rgba(255,255,255,0.03); }
		.game-card .thumb { height:110px; border-radius:8px; overflow:hidden; background:#071026; display:flex; align-items:center; justify-content:center }
		.game-card img{ width:100%; height:100%; object-fit:cover; display:block }
		.game-card .name{ color:#fff; font-size:13px; font-weight:600; line-height:1.2 }
		.game-card .meta{ color: rgba(255,255,255,0.6); font-size:12px }
		#games-panel .footer { padding:10px 12px; font-size:13px; color:rgba(255,255,255,0.6); background: linear-gradient(0deg, rgba(255,255,255,0.01), transparent); }
		.panel-btn { background: rgba(0,0,0,0.45); border:none; color:#fff; padding:8px 10px; border-radius:8px; cursor:pointer }
	`;
	const style = document.createElement('style');
	style.textContent = CSS;
	document.head.appendChild(style);

	// elements
	const btn = document.createElement('button');
	btn.id = 'games-btn';
	btn.title = 'Games';
	btn.textContent = '🎮 Games';
	const panel = document.createElement('div');
	panel.id = 'games-panel';
	panel.innerHTML = `
		<div class="header" id="games-panel-header">
			<div class="title">Games — CrazyGames</div>
			<div class="controls">
				<button class="panel-btn" id="refresh-games">Refresh</button>
				<button class="panel-btn" id="close-games">Close</button>
			</div>
		</div>
		<div class="grid" id="games-grid"></div>
		<div class="footer">Fetched via proxy. Click a card to open fullscreen.</div>
	`;

	// insert into DOM near settingsBtn if available
	if (settingsBtn && settingsBtn.parentNode) {
		settingsBtn.parentNode.insertBefore(btn, settingsBtn.nextSibling);
		settingsBtn.parentNode.insertBefore(panel, settingsBtn.nextSibling);
	} else {
		document.body.appendChild(btn);
		document.body.appendChild(panel);
	}

	// draggable header
	(function makeDraggable(){
		const header = panel.querySelector('#games-panel-header');
		let dragging = false, startX=0, startY=0, startLeft=0, startTop=0;
		header.style.cursor = 'grab';
		header.addEventListener('mousedown', (ev)=>{
			dragging = true; header.style.cursor='grabbing';
			startX = ev.clientX; startY = ev.clientY;
			const rect = panel.getBoundingClientRect();
			startLeft = rect.left; startTop = rect.top;
			ev.preventDefault();
		});
		window.addEventListener('mousemove', (ev)=>{
			if(!dragging) return;
			let nx = startLeft + (ev.clientX - startX);
			let ny = startTop + (ev.clientY - startY);
			// clamp to viewport
            nx = Math.max(8, Math.min(window.innerWidth - panel.offsetWidth - 8, nx));
            ny = Math.max(8, Math.min(window.innerHeight - panel.offsetHeight - 8, ny));
			panel.style.left = nx + 'px'; panel.style.top = ny + 'px';
		});
		window.addEventListener('mouseup', ()=>{ dragging=false; header.style.cursor='grab'; });
	})();

	btn.addEventListener('click', async ()=>{
		panel.classList.toggle('show');
		if(panel.classList.contains('show')) {
			await ensureGamesLoaded();
		}
	});

	panel.querySelector('#close-games').addEventListener('click', ()=> panel.classList.remove('show'));
	panel.querySelector('#refresh-games').addEventListener('click', async ()=>{
		panel.querySelector('#games-grid').innerHTML = '';
		await crawlAndRender(true);
	});

	// crawler + cache
	const CACHE_KEY = 'crazygames-all';
	async function proxied(u){ return location.origin + '/scram/' + btoa(u); }

	async function crawlCrazyGames(maxPages = 300){
		const seen = new Map();
		const base = 'https://www.crazygames.com';
		for(let page=1; page<=maxPages; page++){
			const listUrl = base + '/t/games?page=' + page;
			try {
				const res = await fetch(proxied(listUrl));
				if(!res.ok) break;
				const txt = await res.text();
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
			await new Promise(r=>setTimeout(r, 180));
		}
		return Array.from(seen.values());
	}

	async function ensureGamesLoaded(){
		let list = [];
		const cached = localStorage.getItem(CACHE_KEY);
		if(cached){
			try{ list = JSON.parse(cached) }catch(e){ list = [] }
			renderGames(list);
			// refresh in background
			crawlAndRender(false).catch(()=>{});
			return;
		}
		await crawlAndRender(true);
	}

	async function crawlAndRender(force){
		try {
			panel.querySelector('#games-grid').innerHTML = '<div style="padding:20px;color:rgba(255,255,255,0.7)">Fetching games… this may take a while</div>';
			const data = await crawlCrazyGames(250);
			localStorage.setItem(CACHE_KEY, JSON.stringify(data));
			renderGames(data);
		} catch(e){
			panel.querySelector('#games-grid').innerHTML = '<div style="padding:20px;color:rgba(255,80,80,0.9)">Failed to fetch games</div>';
			console.error(e);
		}
	}

	function renderGames(list){
		const grid = panel.querySelector('#games-grid');
		grid.innerHTML = '';
		if(!list || list.length===0){ grid.innerHTML = '<div style="padding:18px;color:rgba(255,255,255,0.7)">No games found</div>'; return; }
		for(const g of list){
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

	// open proxied game in a cloaked fullscreen window
	async function openFullscreenGame(targetUrl){
		const prox = proxied(targetUrl);
		// try to fetch proxied document and locate inner iframe src
		let inner = null;
		try {
			const res = await fetch(prox);
			if(res.ok){
				const txt = await res.text();
				const doc = new DOMParser().parseFromString(txt,'text/html');
				const frame = doc.querySelector('iframe') || doc.querySelector('div[class*="game"] iframe') || doc.querySelector('#game iframe');
				if(frame){
					inner = frame.getAttribute('src') || frame.getAttribute('data-src') || frame.src || null;
					if(inner && !inner.startsWith('http')){
						try{ inner = new URL(inner, targetUrl).href }catch(e){}
					}
				}
			}
		} catch(e){
			console.warn('meta fetch failed', e);
		}

		const finalSrc = inner ? (inner.startsWith('http') ? inner : proxied(inner)) : prox;
		const win = window.open('about:blank', '_blank');
		if(!win){ alert('Popup blocked! Allow popups.'); return; }
		win.document.title = 'Game';
		const s = win.document.createElement('style');
		s.textContent = 'html,body{width:100%;height:100%;margin:0;background:#000} iframe#g{position:fixed;inset:0;width:100%;height:100%;border:0} button#c{position:fixed;right:12px;top:12px;z-index:99999;background:rgba(0,0,0,0.6);color:#fff;border:none;padding:8px 10px;border-radius:8px;cursor:pointer}';
		win.document.head.appendChild(s);
		const iframe = win.document.createElement('iframe');
		iframe.id = 'g';
		iframe.allow = 'fullscreen; autoplay; encrypted-media; picture-in-picture';
		iframe.src = finalSrc;
		win.document.body.appendChild(iframe);
		const close = win.document.createElement('button');
		close.id = 'c'; close.textContent = '✕';
		close.onclick = ()=> win.close();
		win.document.body.appendChild(close);
		// add fullscreen helper (try request on container)
		close.addEventListener('dblclick', async ()=> {
			try{ if(win.document.documentElement.requestFullscreen) await win.document.documentElement.requestFullscreen(); }catch(e){}
		});
	}

})();
