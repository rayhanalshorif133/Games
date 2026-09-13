

const scriptsInEvents = {

	async E_game_Event7_Act6(runtime, localVars)
	{
		const score = (runtime && runtime.globalVars && typeof runtime.globalVars.Score === 'number')
			? runtime.globalVars.Score
			: 0;

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
		}
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
