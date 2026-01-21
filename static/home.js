document.addEventListener('DOMContentLoaded', () => {
	const app = document.getElementById('app');

	const html = `
		<style>
			* {
				margin: 0;
				padding: 0;
				box-sizing: border-box;
			}

			body {
				font-family: "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
				background: linear-gradient(135deg, #050505 0%, #1a1a1a 100%);
				color: #e0def4;
				min-height: 100vh;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 1rem;
			}

			.container {
				width: 100%;
				max-width: 1200px;
			}

			header {
				text-align: center;
				margin-bottom: 4rem;
			}

			.logo {
				display: inline-block;
				width: 80px;
				height: 80px;
				background: linear-gradient(135deg, #4c8bf5, #a89cc4);
				border-radius: 12px;
				display: flex;
				align-items: center;
				justify-content: center;
				font-size: 3rem;
				margin-bottom: 1.5rem;
			}

			h1 {
				font-family: "Inter Tight", "Inter", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
				font-size: 4rem;
				margin-bottom: 1rem;
				background: linear-gradient(135deg, #4c8bf5, #a89cc4);
				-webkit-background-clip: text;
				-webkit-text-fill-color: transparent;
				background-clip: text;
			}

			.subtitle {
				font-size: 1.3rem;
				color: #9ca3af;
				margin-bottom: 0.5rem;
			}

			.description {
				font-size: 1rem;
				color: #9ca3af;
				max-width: 600px;
				margin: 0 auto;
			}

			.features {
				display: grid;
				grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
				gap: 2rem;
				margin: 3rem 0;
				padding: 2rem;
				background: rgba(18, 18, 18, 0.5);
				border-radius: 1rem;
				border: 1px solid #313131;
			}

			.feature {
				text-align: center;
			}

			.feature-icon {
				font-size: 2.5rem;
				margin-bottom: 1rem;
			}

			.feature-title {
				font-size: 1.1rem;
				font-weight: 600;
				margin-bottom: 0.5rem;
			}

			.feature-text {
				color: #9ca3af;
				font-size: 0.95rem;
			}

			.buttons {
				display: flex;
				gap: 1.5rem;
				justify-content: center;
				flex-wrap: wrap;
				margin-top: 3rem;
			}

			.btn {
				padding: 1rem 2.5rem;
				border: none;
				border-radius: 0.6rem;
				font-size: 1.05rem;
				font-weight: 600;
				cursor: pointer;
				transition: all 0.3s ease;
				font-family: "Inter", system-ui;
				text-decoration: none;
				display: inline-block;
				border: 2px solid transparent;
			}

			.btn-primary {
				background: linear-gradient(135deg, #4c8bf5, #3a69d1);
				color: #fff;
				box-shadow: 0 8px 16px rgba(76, 139, 245, 0.3);
			}

			.btn-primary:hover {
				transform: translateY(-2px);
				box-shadow: 0 12px 24px rgba(76, 139, 245, 0.4);
			}

			.btn-games {
				background: linear-gradient(135deg, #a89cc4, #8a7aa8);
				color: #fff;
				box-shadow: 0 8px 16px rgba(168, 156, 196, 0.3);
				font-size: 1.15rem;
				padding: 1.2rem 3rem;
			}

			.btn-games:hover {
				transform: translateY(-2px);
				box-shadow: 0 12px 24px rgba(168, 156, 196, 0.4);
			}

			.btn-secondary {
				background: #121212;
				color: #e0def4;
				border: 2px solid #313131;
			}

			.btn-secondary:hover {
				border-color: #4c8bf5;
				background: #1a1a1a;
			}

			footer {
				text-align: center;
				margin-top: 4rem;
				padding-top: 2rem;
				border-top: 1px solid #313131;
				color: #9ca3af;
				font-size: 0.9rem;
			}

			.version {
				margin-top: 0.5rem;
				font-size: 0.8rem;
				color: #6b7280;
			}

			@media (max-width: 768px) {
				h1 {
					font-size: 2.5rem;
				}

				.subtitle {
					font-size: 1.1rem;
				}

				.buttons {
					flex-direction: column;
					gap: 1rem;
				}

				.btn {
					width: 100%;
				}

				.features {
					grid-template-columns: 1fr;
					gap: 1.5rem;
				}
			}
		</style>

		<div class="container">
			<header>
				<div class="logo">🌐</div>
				<h1>Scramjet</h1>
				<p class="subtitle">The modern web proxy</p>
				<p class="description">Access any website through a powerful, privacy-focused proxy. Browse freely with Scramjet.</p>
			</header>

			<div class="features">
				<div class="feature">
					<div class="feature-icon">🚀</div>
					<div class="feature-title">Fast & Reliable</div>
					<div class="feature-text">Lightning-fast proxy with minimal latency</div>
				</div>
				<div class="feature">
					<div class="feature-icon">🔒</div>
					<div class="feature-title">Private & Secure</div>
					<div class="feature-text">Your browsing stays private and encrypted</div>
				</div>
				<div class="feature">
					<div class="feature-icon">🎮</div>
					<div class="feature-title">Play Games</div>
					<div class="feature-text">Access a curated collection of online games</div>
				</div>
				<div class="feature">
					<div class="feature-icon">⚙️</div>
					<div class="feature-title">Customizable</div>
					<div class="feature-text">Configure transport, servers, and more</div>
				</div>
			</div>

			<div class="buttons">
				<a href="/browser.html" class="btn btn-primary">Open Browser</a>
				<a href="/games.html" class="btn btn-games">🎮 Games</a>
				<a href="https://github.com/MercuryWorkshop/scramjet" class="btn btn-secondary" target="_blank">GitHub</a>
			</div>

			<footer>
				<p>Scramjet - Open source web proxy</p>
				<p class="version">Made by Mercury Workshop</p>
			</footer>
		</div>
	`;

	app.innerHTML = html;
});
