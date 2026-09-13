
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
globalThis.resetGameOverScore = () => {
    hasSentScore = false;
};

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

    // Hook sprite SetVisible for instant trigger when Crashed sprite becomes visible
    if (self.C3 && self.C3.Plugins && self.C3.Plugins.Sprite && self.C3.Plugins.Sprite.Acts) {
        const origSetVisible = self.C3.Plugins.Sprite.Acts.SetVisible;
        self.C3.Plugins.Sprite.Acts.SetVisible = function (visible) {
            origSetVisible.apply(this, arguments);
            try {
                const name = this?.GetObjectClass()?.GetName();
                if (visible && name === "Crashed") {
                    if (runtime?.layout?.name === "Game") {
                        const score = (runtime.globalVars && typeof runtime.globalVars.Score === 'number')
                            ? runtime.globalVars.Score
                            : 0;
                        triggerGameOverScore(score);
                    }
                }
            } catch (err) {
                console.error('[GameOver Sprite hook error]:', err);
            }
        };
    }

    // Hook Audio StopAll (Event 17 stops all audio on Game Over)
    if (self.C3 && self.C3.Plugins && self.C3.Plugins.Audio && self.C3.Plugins.Audio.Acts) {
        const origStopAll = self.C3.Plugins.Audio.Acts.StopAll;
        self.C3.Plugins.Audio.Acts.StopAll = function () {
            origStopAll.apply(this, arguments);
            try {
                if (runtime?.layout?.name === "Game") {
                    const score = (runtime.globalVars && typeof runtime.globalVars.Score === 'number')
                        ? runtime.globalVars.Score
                        : 0;
                    triggerGameOverScore(score);
                }
            } catch (err) {
                console.error('[GameOver Audio hook error]:', err);
            }
        };
    }

    // Polling / State tracker on tick for guaranteed detection
    let hasEnteredGame = false;

    runtime.addEventListener("tick", () => {
        let currentLayoutName = "";
        try {
            if (runtime.layout) {
                currentLayoutName = runtime.layout.name;
            }
        } catch (e) {}

        if (currentLayoutName === "Game") {
            let isCrashed = false;

            try {
                const crashedInst = runtime.objects.Crashed?.getFirstInstance();
                if (crashedInst && crashedInst.isVisible) {
                    isCrashed = true;
                }
            } catch (e) {}

            // When actively racing without crash
            if (!isCrashed) {
                hasEnteredGame = true;
                hasSentScore = false;
            } else if (hasEnteredGame && isCrashed) {
                // When Game Over occurs
                if (!hasSentScore) {
                    const currentScore = (runtime.globalVars && typeof runtime.globalVars.Score === 'number')
                        ? runtime.globalVars.Score
                        : 0;
                    triggerGameOverScore(currentScore);
                }
            }
        } else {
            hasEnteredGame = false;
        }
    });

});
