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

// Add "Games" button to open the games manager page
(function addGamesButton(){
	const gamesBtn = document.createElement('button');
	gamesBtn.id = 'games-btn';
	gamesBtn.textContent = 'Games';
	Object.assign(gamesBtn.style, {
		marginLeft: '8px',
		padding: '6px 10px',
		cursor: 'pointer'
	});
	gamesBtn.onclick = () => {
		window.open(location.origin + '/games.html', '_blank');
	};
	// place it near the settings button if present
	if (settingsBtn && settingsBtn.parentNode) {
		settingsBtn.parentNode.insertBefore(gamesBtn, settingsBtn.nextSibling);
	} else {
		document.body.appendChild(gamesBtn);
	}
})();
