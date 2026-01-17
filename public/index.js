"use strict";

const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});
scramjet.init();
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

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	try {
		await registerSW();
	} catch (err) {
		error.textContent = "Worker registration failed.";
		errorCode.textContent = err.toString();
		throw err;
	}

	const url = search(address.value, searchEngine.value);
	const customWisp = localStorage.getItem("plazma-wisp");
	const wispUrl =
		customWisp ||
		(location.protocol === "https:" ? "wss" : "ws") +
			"://" +
			location.host +
			"/wisp/";

	if ((await connection.getTransport()) !== "/libcurl/index.mjs") {
		await connection.setTransport("/libcurl/index.mjs", [
			{ websocket: wispUrl },
		]);
	}

	const isCloaked = localStorage.getItem("plazma-cloak") === "true";

	if (isCloaked) {
		// about:blank cloaking logic
		const win = window.open("about:blank", "_blank");
		if (!win) {
			alert("Popup blocked! Allow popups to use cloaking.");
			return;
		}
		const iframe = win.document.createElement("iframe");
		Object.assign(iframe.style, {
			position: "fixed",
			top: "0",
			left: "0",
			width: "100vw",
			height: "100vh",
			border: "none",
			background: "white",
		});
		iframe.src = location.origin + "/scram/" + btoa(url);
		win.document.body.appendChild(iframe);
	} else {
		const frame = scramjet.createFrame();
		Object.assign(frame.frame.style, {
			position: "fixed",
			top: "0",
			left: "0",
			width: "100vw",
			height: "100vh",
			border: "none",
			zIndex: "9999",
			backgroundColor: "white",
		});
		document.body.appendChild(frame.frame);
		frame.go(url);
	}
});
