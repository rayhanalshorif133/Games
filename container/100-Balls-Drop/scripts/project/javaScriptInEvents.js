

const scriptsInEvents = {

	async E_game_Event2_Act5(runtime, localVars)
	{
		// Restore sound preference
		const savedSound = localStorage.getItem('100balls_isSound') ?? sessionStorage.getItem('isSound');
		if (savedSound !== null) {
		    runtime.globalVars.isSound = (savedSound === 'true');
		}

		// Save global runtime reference
		globalThis.gameRuntime = runtime;

		if (typeof globalThis.updateSoundButtonUI === 'function') {
		    globalThis.updateSoundButtonUI(runtime.globalVars.isSound);
		}

		// Load Best Score
		let bestScore = parseInt(localStorage.getItem('100balls_best_score') || '0', 10);
		if (isNaN(bestScore)) bestScore = 0;
		globalThis.gameHighScore = bestScore;

		if (typeof globalThis.updateHUDHighScore === 'function') {
		    globalThis.updateHUDHighScore(bestScore);
		}

		let lastScore = runtime.globalVars.SCORE;
		let comboStreak = 0;
		let lastCatchTime = 0;
		let isGameOver = false;

		// Attach tick listener to monitor score and game events
		if (!runtime._hasCustomTick) {
			runtime._hasCustomTick = true;
			runtime.addEventListener("tick", () => {
				const currentScore = runtime.globalVars.SCORE;
				const ballsLeft = runtime.globalVars.totalBall;
				const now = Date.now();

				// Live HUD synchronization (score, remaining balls)
				if (typeof globalThis.updateLiveHUD === 'function') {
					globalThis.updateLiveHUD(currentScore, ballsLeft);
				}

				// Reset combo if more than 2.2 seconds passed since last catch
				if (comboStreak > 0 && (now - lastCatchTime > 2200)) {
					comboStreak = 0;
					if (typeof globalThis.updateComboHUD === 'function') {
						globalThis.updateComboHUD(0);
					}
				}

				// Check score increase (ball scored into cup)
				if (currentScore > lastScore) {
					const diff = currentScore - lastScore;
					lastScore = currentScore;
					lastCatchTime = now;
					comboStreak++;

					// Calculate multiplier
					let multiplier = 1;
					if (comboStreak >= 8) multiplier = 5;
					else if (comboStreak >= 5) multiplier = 3;
					else if (comboStreak >= 3) multiplier = 2;

					// Award bonus score on combo
					if (multiplier > 1) {
						const bonus = (multiplier - 1) * diff;
						runtime.globalVars.SCORE += bonus;
						lastScore = runtime.globalVars.SCORE;
					}

					// Trigger UI FX and sound
					if (typeof globalThis.onScoreAdded === 'function') {
						globalThis.onScoreAdded(diff, runtime.globalVars.SCORE, comboStreak, multiplier);
					}

					// Dynamic Wheel Speed Scaling: increases rotation speed up to 2.2x smoothly
					const baseSpeed = -15;
					const speedBoost = 1 + Math.min(1.2, runtime.globalVars.SCORE / 160);
					runtime.globalVars.holeContainerRotated = baseSpeed * speedBoost;

					// Update High Score
					if (runtime.globalVars.SCORE > globalThis.gameHighScore) {
						globalThis.gameHighScore = runtime.globalVars.SCORE;
						localStorage.setItem('100balls_best_score', runtime.globalVars.SCORE);
						if (typeof globalThis.updateHUDHighScore === 'function') {
							globalThis.updateHUDHighScore(runtime.globalVars.SCORE, true);
						}
					}
				}

				// Check start game
				if (runtime.globalVars.isStartGame && typeof globalThis.hideTutorial === 'function') {
					globalThis.hideTutorial();
				}

				// Check Game Over
				if (ballsLeft <= 0 && !isGameOver && runtime.globalVars.isStartGame) {
					isGameOver = true;
					if (typeof globalThis.onNeonGameOver === 'function') {
						globalThis.onNeonGameOver(runtime.globalVars.SCORE, globalThis.gameHighScore);
					}
				}
			});
		}
	},

	async E_game_Event22_Act2(runtime, localVars)
	{
		sessionStorage.setItem('isSound', runtime.globalVars.isSound);
		localStorage.setItem('100balls_isSound', runtime.globalVars.isSound);
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;

