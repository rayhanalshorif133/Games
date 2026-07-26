

const scriptsInEvents = {

	async E_game_Event2_Act5(runtime, localVars)
	{
		const savedSound = sessionStorage.getItem('isSound');
		if (savedSound !== null) {
		    runtime.globalVars.isSound = (savedSound === 'true');
		}
	},

	async E_game_Event22_Act2(runtime, localVars)
	{
		sessionStorage.setItem('isSound', runtime.globalVars.isSound);
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
