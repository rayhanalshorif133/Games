

const scriptsInEvents = {

	async Global_events_Event7_Act1(runtime, localVars)
	{
		const rts = runtime;
		
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
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
