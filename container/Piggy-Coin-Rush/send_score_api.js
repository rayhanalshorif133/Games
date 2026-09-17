var sendScore = async (score, extra = {}) => {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content 
        || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        || '';

    let finalScore = 0;
    let clicks = 0;
    let duration = 0;

    if (typeof score === 'object' && score !== null) {
        finalScore = (score.score !== undefined) ? Number(score.score) : 0;
        clicks = Number(score.clicks ?? score.totalClicks ?? extra.clicks ?? globalThis.gameClickCount ?? 0);
        duration = Number(score.duration ?? score.secondsPlayed ?? score.timePlayed ?? extra.duration ?? globalThis.gameDuration ?? 0);
    } else {
        finalScore = Number(score) || 0;
        clicks = Number(extra.clicks ?? globalThis.gameClickCount ?? 0);
        duration = Number(extra.duration ?? globalThis.gameDuration ?? (globalThis.gameStartTime ? Math.max(1, Math.round((Date.now() - globalThis.gameStartTime) / 1000)) : 0));
    }

    const payload = {
        score: finalScore,
        clicks: clicks,
        duration: duration
    };

    try {
        if (typeof axios !== 'undefined' && axios.post) {
            const response = await axios.post('/api/score', payload, {
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                },
                withCredentials: true 
            });
            console.log('✅ Score sent successfully:', response.data);
            return response.data;
        } else {
            const response = await fetch('/api/score', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });
            const data = await response.json();
            console.log('✅ Score sent successfully via fetch:', data);
            return data;
        }
    } catch (error) {
        console.error('❌ Error sending score:', error.response?.data || error.message || error);
    }
};

if (typeof window !== 'undefined') {
    window.sendScore = sendScore;
    window.SendScoreApi = { sendScore: sendScore };
}
if (typeof globalThis !== 'undefined') {
    globalThis.sendScore = sendScore;
    globalThis.SendScoreApi = { sendScore: sendScore };
}