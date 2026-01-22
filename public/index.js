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

// Helper function for search
function search(input, template) {
	try {
		return new URL(input).toString();
	} catch (e) {}
	
	try {
		const url = new URL(`http://${input}`);
		if (url.hostname.includes('.')) return url.toString();
	} catch (e) {}
	
	return template.replace('%s', encodeURIComponent(input));
}

// Service Worker registration
async function registerSW() {
	if (!navigator.serviceWorker) {
		throw new Error('Service workers are not supported');
	}
	
	const registration = await navigator.serviceWorker.register('/sw.js', {
		scope: '/',
		updateViaCache: 'none'
	});
	
	await navigator.serviceWorker.ready;
	return registration;
}

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

// Load settings
document.getElementById("wisp-url").value = localStorage.getItem("plazma-wisp") || "";
document.getElementById("about-blank-toggle").checked = localStorage.getItem("plazma-cloak") === "true";

saveBtn.onclick = () => {
	localStorage.setItem("plazma-wisp", document.getElementById("wisp-url").value);
	localStorage.setItem("plazma-cloak", document.getElementById("about-blank-toggle").checked);
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
	const wispUrl = customWisp || (location.protocol === 'https:' ? 'wss' : 'ws') + '://' + location.host + '/wisp/';

	if ((await connection.getTransport()) !== '/libcurl/index.mjs') {
		await connection.setTransport('/libcurl/index.mjs', [{ websocket: wispUrl }]);
	}

	const isCloaked = localStorage.getItem('plazma-cloak') === 'true';

	if (isCloaked) {
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

	await ensureScramjet();

	try {
		if (activeFrame && activeFrame.frame && document.body.contains(activeFrame.frame)) {
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

// Global proxy helpers
function encodeB64(str) {
	try { return btoa(unescape(encodeURIComponent(str))); }
	catch (e) { return btoa(str); }
}

function getProxyUrl(target, overridePath, overrideOrigin) {
	const engine = localStorage.getItem('proxy-engine') || 'scramjet';
	const basePath = (localStorage.getItem('proxy-path') || (engine === 'scramjet' ? '/scram/' : '/ultraviolet/')).trim();
	const path = (overridePath && overridePath.trim()) ? overridePath.trim() : basePath;
	const origin = (overrideOrigin && overrideOrigin.trim()) ? overrideOrigin.trim() : (localStorage.getItem('proxy-origin') || location.origin).trim();
	const normalizedPath = path.startsWith('/') ? path : '/' + path;
	return origin + normalizedPath + encodeB64(target);
}

async function tryFetchProxied(targetUrl, candidateOrigins = [], candidatePaths = []) {
	const userOrigin = (localStorage.getItem('proxy-origin') || '').trim();
	const userPath = (localStorage.getItem('proxy-path') || '').trim();

	const origins = [...new Set([userOrigin, ...candidateOrigins, location.origin].filter(Boolean))];
	const paths = [...new Set([userPath, ...candidatePaths, '/scram/', '/ultraviolet/', '/proxy/'].filter(Boolean))];

	for (const origin of origins) {
		for (const path of paths) {
			const p = path.startsWith('/') ? path : '/' + path;
			const url = origin + p + encodeB64(targetUrl);
			try {
				const res = await fetch(url);
				const text = await res.text();
				const blockedRx = /Your organization has blocked access|blocked access|Access Denied|This site is blocked|403 Forbidden/i;
				if (res.ok && !blockedRx.test(text)) {
					return { ok: true, origin, path: p, url, res, text };
				}
			} catch (e) {
				continue;
			}
		}
	}
	return { ok: false, triedOrigins: origins, triedPaths: paths };
}

async function probeProxyHealth() {
	try {
		const probe = await tryFetchProxied('https://example.com/');
		return probe;
	} catch (e) {
		return { ok: false, error: e };
	}
}