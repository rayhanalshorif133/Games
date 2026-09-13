

const scriptsInEvents = {

	async Global_events_Event7_Act1(runtime, localVars)
	{
		const rts = runtime;
		if (typeof globalThis.resetGameOverScore === 'function') {
			globalThis.resetGameOverScore();
		}
		
		fetch("https://bdg.b2mwap.com/api/game-play-log?t=" + Date.now(), {
		    method: "GET", // change to POST if backend says
		    cache: "no-store"
		})
		.then(res => res.json())
		.then(data => {
		    console.log("Game Play Log API:", data);
		})
		.catch(err => console.error("API Error:", err));
	},

	async Global_events_Event9_Act2(runtime, localVars)
	{
		const fullUrl = window.location.href;
		const baseUrl = new URL(fullUrl).origin;
		window.location.href = baseUrl;
	},

	async Game_events_Event17_Act13(runtime, localVars)
	{
		const score = (runtime && runtime.globalVars && typeof runtime.globalVars.Score === 'number')
			? runtime.globalVars.Score
			: 0;
		console.log('[GameOver Event Action] Crash occurred! Final score:', score);

		if (typeof globalThis.triggerGameOverScore === 'function') {
			await globalThis.triggerGameOverScore(score);
		} else if (typeof sendScore === 'function') {
			try {
				await sendScore(score);
			} catch (e) {
				console.error('[GameOver] sendScore error:', e);
			}
		} else if (typeof window !== 'undefined' && typeof window.sendScore === 'function') {
			try {
				await window.sendScore(score);
			} catch (e) {
				console.error('[GameOver] window.sendScore error:', e);
			}
		} else if (typeof globalThis !== 'undefined' && typeof globalThis.sendScore === 'function') {
			try {
				await globalThis.sendScore(score);
			} catch (e) {
				console.error('[GameOver] globalThis.sendScore error:', e);
			}
		} else {
			console.warn('[GameOver] sendScore is not available in Event 13');
		}
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
