/**
 * =========================================================================
 * 🐸 FROGGY CROSS THE ROAD - SCORE API MODULE (scoreapi.js)
 * =========================================================================
 * Handles sending game distance scores and gameplay metrics to a remote
 * backend or API endpoint.
 */

class ScoreAPIService {
    constructor() {
        // Configurable endpoint URL - customize to your backend score API
        this.endpoint = '/api/score';
        this.apiKey = null;
        this.gameName = 'Froggy Cross the Road';
    }

    /**
     * Set a custom endpoint URL
     * @param {string} url - API destination endpoint
     */
    setEndpoint(url) {
        this.endpoint = url;
    }

    /**
     * Set an authorization API key (Bearer token)
     * @param {string} key 
     */
    setApiKey(key) {
        this.apiKey = key;
    }

    /**
     * Send score and game statistics to the remote API
     * @param {number} score - Current or final distance score in meters
     * @param {object} [metadata] - Extra details (highScore, deathType, bonusScore, duration, etc.)
     * @returns {Promise<{success: boolean, data?: any, error?: string}>}
     */
    async sendScore(score, metadata = {}) {
        const payload = {
            game: this.gameName,
            score: Math.floor(score),
            highScore: Math.floor(metadata.highScore || score),
            distance: Math.floor(score),
            deathReason: metadata.deathType || 'hazard',
            bonusScore: metadata.bonusScore || 0,
            timestamp: Date.now(),
            ...metadata
        };

        console.log('[ScoreAPI] Submitting score payload:', payload);

        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Server returned HTTP status ${response.status} (${response.statusText})`);
            }

            const responseData = await response.json().catch(() => ({ status: 'received' }));
            console.log('[ScoreAPI] Score successfully submitted:', responseData);
            return { success: true, data: responseData };
        } catch (err) {
            console.warn('[ScoreAPI] Notice: Failed to send score to API (soft fallback):', err.message);
            return { success: false, error: err.message };
        }
    }
}

// Instantiate singleton service
const ScoreAPI = new ScoreAPIService();

// Make available on window for direct script tag usage
if (typeof window !== 'undefined') {
    window.ScoreAPI = ScoreAPI;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ScoreAPI, ScoreAPIService };
}

