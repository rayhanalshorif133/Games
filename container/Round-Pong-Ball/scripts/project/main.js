
// Function to safely trigger sendScore on Game Over
let hasSentScore = false;

async function triggerGameOverScore(score) {
    if (hasSentScore) return;
    hasSentScore = true;

    console.log('[GameOver] Final score reached:', score);

    // Ensure axios is available if still loading
    if (typeof axios === 'undefined') {
        for (let i = 0; i < 20 && typeof axios === 'undefined'; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Call sendScore function from send_score_api.js on Game Over
    if (typeof sendScore === 'function') {
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
        console.warn('[GameOver] sendScore function is not available.');
    }
}

globalThis.triggerGameOverScore = triggerGameOverScore;

runOnStartup(async runtime => {

    const crypto = document.createElement('script');
    crypto.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.2.0/crypto-js.min.js";
    document.head.appendChild(crypto);

    const axiosScr = document.createElement('script');
    axiosScr.src = "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js";
    document.head.appendChild(axiosScr);

    if (typeof window !== 'undefined' && !window.sendScore) {
        const sendScoreScr = document.createElement('script');
        sendScoreScr.src = "send_score_api.js";
        document.head.appendChild(sendScoreScr);
    }

    let hasEnteredGame = false;

    runtime.addEventListener("tick", () => {
        let currentLayoutName = "";
        try {
            if (runtime.layout) {
                currentLayoutName = runtime.layout.name;
            }
        } catch (e) {
            // Layout is transitioning
        }

        const isGameOverVar = runtime.globalVars ? Boolean(runtime.globalVars.isGameOver) : false;

        // When actively playing on "game" layout
        if (currentLayoutName === "game") {
            if (isGameOverVar && runtime.globalVars) {
                runtime.globalVars.isGameOver = false;
            }
            hasEnteredGame = true;
            hasSentScore = false;
        }

        // When Game Over occurs
        if (hasEnteredGame && (currentLayoutName === "gameOver" || isGameOverVar)) {
            if (!hasSentScore) {
                const currentScore = (runtime.globalVars && typeof runtime.globalVars.Score === 'number')
                    ? runtime.globalVars.Score
                    : 0;
                triggerGameOverScore(currentScore);
            }
        }
    });

});

