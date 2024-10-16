


const scriptsInEvents = {

	async EventSheet1_Event33_Act10(runtime, localVars)
	{
// Encryption key (must match the server-side)
const encryptionKey = "B2M_T3chN0l0g!@$";

// Get score from Construct 3's global variable
function getScore() {
    return runtime.globalVars.appleCount.toString(); // Assuming appleCount holds the score
}

// Helper function: Encrypt using AES-128-CBC
async function encrypt(text) {
    const key = new TextEncoder().encode(encryptionKey);
    const iv = crypto.getRandomValues(new Uint8Array(16)); // Generate random IV

    const algorithm = { name: "AES-CBC", iv: iv };
    const cryptoKey = await crypto.subtle.importKey("raw", key, algorithm, false, ["encrypt"]);

    const encrypted = await crypto.subtle.encrypt(algorithm, cryptoKey, new TextEncoder().encode(text));

    // Combine IV and encrypted data into a single Uint8Array
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to Base64 string
    return btoa(String.fromCharCode(...combined));
}

// Helper function: Grab URL parameters
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split("&");
    pairs.forEach((pair) => {
        const [key, value] = pair.split("=");
        params[decodeURIComponent(key)] = decodeURIComponent(value || "");
    });
    return params;
}

// Main function: Encrypt and send data
window.onGameOver = async function () {
    const params = getUrlParams();
    const id = params["id"];
    const token = params["token"];

    if (!id || !token) {
        console.error("Missing ID or Token in URL parameters");
        return;
    }

    const score = getScore()? getScore() : 0; // Retrieve score
    const idToken = `${id}_${token}`; // Combine id and token

    try {
        const encryptedIdToken = await encrypt(idToken); // Encrypt id_token
        const encryptedScore = await encrypt(score); // Encrypt score

		console.log("Score:", score);
		console.log("Encrypted Score:", encryptedScore);
		
        const url = `https://html5.b2mwap.com/bdgamers/snake-api/?pengenal=${encryptedIdToken}&puntaje=${encryptedScore}`;
		console.log("Encoded URL:", url);

        // Send the GET request
        const response = await fetch(url);

        if (!response.ok) {
            console.error(`HTTP error: ${response.status}`);
            return;
        }

        // Try parsing the response directly as JSON
        const jsonResponse = await response.json();
        console.log("Response JSON:", jsonResponse);

        const redirectUrl = jsonResponse.redirect_url || "https://www.google.com/";
        const cacheBuster = "?cb=" + Math.floor(Math.random() * 1000000);
        window.location.href = redirectUrl + cacheBuster;

    } catch (error) {
        console.error("Error sending data:", error);
    }
};
window.onGameOver();
	}

};

self.C3.ScriptsInEvents = scriptsInEvents;

