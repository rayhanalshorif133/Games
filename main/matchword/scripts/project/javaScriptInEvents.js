

const scriptsInEvents = {

	async E_game_Event13_Act2(runtime, localVars)
	{
const GET_runtime = runtime;
const get_word = GET_runtime.globalVars.int_to_world;
checkRealWord(get_word, GET_runtime); 

async function checkRealWord(word, GET_runtime) {
  try {
    const getRes = await fetch(`https://html5.b2mwap.com/word/?match=${word}`);
    const res = await getRes.json();
    if (res.found) {
      GET_runtime.globalVars.isItRealWorld = 1;
    } else {
      GET_runtime.globalVars.isItRealWorld = 2;
    }
  } catch (error) {
    console.error("Error checking word:", error.message);
  }
}

	},

	async E_helps_Event1_Act1(runtime, localVars)
	{
		document.body.style.cursor = "none";
	},

	async E_game_Event40_Act1(runtime, localVars)
	{
		document.body.style.cursor = "none";
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
