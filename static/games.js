let allGames = [];
let currentFilter = 'all';

// Fetch games from games.json
async function loadGames() {
	try {
		const response = await fetch('/games.json');
		allGames = await response.json();
		renderGames();
	} catch (error) {
		console.error('Failed to load games:', error);
		document.getElementById('games-container').innerHTML = '<div class="no-games">Failed to load games. Please try again later.</div>';
	}
}

// Render games based on current filter
function renderGames() {
	const container = document.getElementById('games-container');
	const filtered = currentFilter === 'all' 
		? allGames 
		: allGames.filter(game => game.category === currentFilter);

	if (filtered.length === 0) {
		container.innerHTML = '<div class="no-games">No games found in this category.</div>';
		return;
	}

	container.innerHTML = filtered.map(game => `
		<div class="game-card">
			<div class="game-header">
				<div class="game-name">${escapeHtml(game.name)}</div>
				<div class="game-category">${escapeHtml(game.category)}</div>
			</div>
			<div class="game-description">${escapeHtml(game.description)}</div>
			<button class="play-btn" onclick="playGame('${escapeHtml(game.url).replace(/'/g, "\\'")}')"">
				Play Now
			</button>
		</div>
	`).join('');
}

// Play game - open in Scramjet proxy
function playGame(gameUrl) {
	// Encode the game URL and open through the proxy
	window.location.href = `/scram/?url=${encodeURIComponent(gameUrl)}`;
}

// HTML escape utility
function escapeHtml(text) {
	const map = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	};
	return text.replace(/[&<>"']/g, m => map[m]);
}

// Filter button event listeners
document.addEventListener('DOMContentLoaded', () => {
	loadGames();

	document.querySelectorAll('.filter-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
			e.target.classList.add('active');
			currentFilter = e.target.dataset.filter;
			renderGames();
		});
	});
});
