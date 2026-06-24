

const scriptsInEvents = {

	async E_game_Event7_Act6(runtime, localVars)
	{

function encrypt(text, encryptionKey) {

    const passphrase = encryptionKey;
    const salt = CryptoJS.lib.WordArray.random(128 / 8);

    const keyIv = CryptoJS.PBKDF2(passphrase, salt, {
        keySize: 256 / 32 + 128 / 32,
        iterations: 1000
    });

    const key = CryptoJS.lib.WordArray.create(keyIv.words.slice(0, 8));
    const iv = CryptoJS.lib.WordArray.create(keyIv.words.slice(8, 12));

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        padding: CryptoJS.pad.Pkcs7
    });

    return {
        key: key.toString(CryptoJS.enc.Base64),
        salt: salt.toString(CryptoJS.enc.Base64),
        iv: iv.toString(CryptoJS.enc.Base64),
        ciphertext: encrypted.toString()
    };
}

function getUrlParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}


window.onGameOver = function () {
    
    var score = runtime.globalVars.Score.toString();
    const startTime = runtime.globalVars.GameStartTime;
    const totalClicks = runtime.globalVars.TotalClicks;
    const baseUrl = new URL(window.location.href).origin;
    const token = getUrlParam("token") || "";
    
    var encryptedScore = encrypt(score, token);
    encryptedScore = JSON.stringify(encryptedScore);


    const url = `${baseUrl}/game/score`;
    const endTime = Date.now();

    const durationInSeconds = Math.floor((endTime - startTime) / 1000);

    const payload = {
        puntaje: encryptedScore,
        token: token,
        clicks: totalClicks,
        duration: durationInSeconds
    };

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') 
                      || window.parent.document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    axios.post(url, payload, {
        headers: {
            'X-CSRF-TOKEN': csrfToken,
            'Content-Type': 'application/json'
        }
    })
    .then(response => {
		console.log(response);
        if (response.data.redirect_url) {
            window.top.location.href = response.data.redirect_url;
        } else if (response.request.responseURL) {
            window.top.location.href = response.request.responseURL;
        }
    })
    .catch(error => {
		console.log(error);
		return false;
        window.top.location.href = `${baseUrl}/game/gameover`;
    });
};

window.onGameOver();
	}
};

globalThis.C3.JavaScriptInEvents = scriptsInEvents;
