/**
 * scoreapi.js
 * 
 * =========================================================================
 * Bee Attack - Dedicated Score API Module (স্কোর সাবমিশন এপিআই)
 * =========================================================================
 * গেমের স্কোর, নিহত মৌমাছির সংখ্যা, কয়েন ও সার্ভাইভাল টাইম ইত্যাদি তথ্য
 * আপনার নিজস্ব ব্যাকএন্ড সার্ভার বা ওয়েবহুকে পাঠানোর কনফিগারেশন ফাইল।
 */

const SCORE_API_CONFIG = {
    // ১. আপনার সার্ভারের স্কোর জমা নেওয়ার API Endpoint URL এখানে দিন:
    API_URL: 'https://your-api-domain.com/api/v1/bee-attack/submit-score',

    // ২. এপিআই কল কি চালু রাখবেন? (true = সার্ভারে পাঠাবে, false = অফলাইন/টেস্ট মোড)
    ENABLED: false,

    // ৩. HTTP মেথড ('POST' বা 'PUT')
    METHOD: 'POST',

    // ৪. প্রয়োজনীয় রিকোয়েস্ট হেডার্স (Headers):
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_SECRET_API_TOKEN_HERE',
    },

    // ৫. অতিরিক্ত কাস্টম প্যারামিটার (যদি সার্ভারে নির্দিষ্ট গেম আইডি বা প্রজেক্ট শনাক্তকারী প্রয়োজন হয়):
    EXTRA_DATA: {
        gameId: 'bee-attack',
        gameTitle: 'Bee Attack',
        platform: 'web-html5',
        version: '1.0.0'
    },

    // ৬. টাইমআউট (মিলি-সেকেন্ডে):
    TIMEOUT_MS: 8000
};

/**
 * গেমের স্কোর ও পরিসংখ্যান সার্ভারে পাঠানোর মূল ফাংশন
 * @param {Object} scoreData - গেমের ফলাফল { score, beesDefeated, blueBeesHit, survivalTime, formattedTime, coins, bombsUsed }
 * @returns {Promise<Object>} API রেসপন্স অবজেক্ট
 */
async function sendScoreToApi(scoreData = {}) {
    if (!SCORE_API_CONFIG.ENABLED) {
        console.log('[scoreapi.js] Score API is currently DISABLED in scoreapi.js. (Set ENABLED: true to send to server).');
        console.log('[scoreapi.js] Sample Payload prepared:', scoreData);
        return { success: false, reason: 'API_DISABLED', data: scoreData };
    }

    try {
        console.log('[scoreapi.js] Submitting score to ' + SCORE_API_CONFIG.API_URL + '...');

        const payload = {
            score: Math.floor(scoreData.score || 0),
            beesDefeated: scoreData.beesDefeated || 0,
            blueBeesHit: scoreData.blueBeesHit || 0,
            survivalTimeSeconds: Math.floor(scoreData.survivalTime || 0),
            formattedTime: scoreData.formattedTime || '00:00',
            coinsCollected: scoreData.coins || 0,
            bombsUsed: scoreData.bombsUsed || 0,
            timestamp: new Date().toISOString(),
            ...SCORE_API_CONFIG.EXTRA_DATA
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SCORE_API_CONFIG.TIMEOUT_MS || 8000);

        const response = await fetch(SCORE_API_CONFIG.API_URL, {
            method: SCORE_API_CONFIG.METHOD,
            headers: SCORE_API_CONFIG.HEADERS,
            body: JSON.stringify(payload),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ' (' + response.statusText + ')');
        }

        const result = await response.json().catch(() => ({ status: 'success' }));
        console.log('[scoreapi.js] Score submitted successfully:', result);
        return { success: true, result, payload };

    } catch (error) {
        console.warn('[scoreapi.js] Failed to submit score:', error.message);
        return { success: false, error: error.message };
    }
}

// গ্লোবাল ব্রাউজার অবজেক্ট এক্সপোর্ট
window.sendScoreToApi = sendScoreToApi;
window.SCORE_API_CONFIG = SCORE_API_CONFIG;

