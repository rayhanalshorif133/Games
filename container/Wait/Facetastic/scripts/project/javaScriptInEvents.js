

const scriptsInEvents = {

	async EventSheet1_Event18_Act3(runtime, localVars)
	{
		sessionStorage.setItem('isSound', runtime.globalVars.isSound); 
	},

	async EventSheet1_Event22_Act1(runtime, localVars)
	{
		const savedSound = sessionStorage.getItem('isSound');
		if (savedSound !== null) {
		    runtime.globalVars.isSound = (savedSound === 'true');
		} else {
		    sessionStorage.setItem('isSound', runtime.globalVars.isSound); 
		}
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
