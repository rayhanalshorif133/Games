/**
 * sendscoreapi.js
 * 
 * =========================================================================
 * স্কোর সেন্ডিং API কনফিগারেশন ফাইল (Score Sending API Configuration)
 * =========================================================================
 * এখানে আপনার স্কোর জমা নেওয়ার API URL এবং হেডার সেট করুন।
 * গেম ওভার (Game Over) হওয়ার সাথে সাথে এই ফাংশনটি স্বয়ংক্রিয়ভাবে সার্ভারে স্কোর পাঠাবে।
 */

const SCORE_API_CONFIG = {
    // ১. আপনার সার্ভারের API এন্ডপয়েন্ট URL এখানে বসান:
    API_URL: 'https://your-api-domain.com/api/submit-score',

    // ২. API কল কি চালু রাখবেন? (true = সার্ভারে পাঠাবে, false = বন্ধ / অফলাইন টেস্ট মোড)
    ENABLED: false,

    // ৩. HTTP মেথড ('POST' বা 'PUT')
    METHOD: 'POST',

    // ৪. প্রয়োজনীয় রিকোয়েস্ট হেডার্স (Headers):
    HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // 'Authorization': 'Bearer YOUR_API_TOKEN_HERE',
    },

    // ৫. অতিরিক্ত কাস্টম প্যারামিটার (যদি সার্ভারে গেম আইডি বা প্ল্যাটফর্ম দরকার হয়):
    EXTRA_DATA: {
        gameId: 'missile-escape-2d',
        platform: 'web'
    }
};

/**
 * গেমের স্কোর সার্ভারে পাঠানোর মূল ফাংশন
 * @param {Object} scoreData - { score, survivalTime, formattedTime, stars, missilesDodged, nearMisses, planeName }
 * @returns {Promise<Object>} API রেসপন্স
 */
async function sendScoreToApi(scoreData) {
    if (!SCORE_API_CONFIG.ENABLED) {
        console.log('[sendscoreapi.js] API call is DISABLED. (Set ENABLED: true in sendscoreapi.js to send). Payload:', scoreData);
        return { success: false, reason: 'API_DISABLED', data: scoreData };
    }

    try {
        console.log('[sendscoreapi.js] Submitting score to: ' + SCORE_API_CONFIG.API_URL + '...');

        const payload = {
            score: Math.floor(scoreData.score || 0),
            survivalTimeSeconds: Math.floor(scoreData.survivalTime || 0),
            formattedTime: scoreData.formattedTime || '00:00',
            starsCollected: scoreData.stars || 0,
            missilesDodged: scoreData.missilesDodged || 0,
            nearMisses: scoreData.nearMisses || 0,
            aircraft: scoreData.planeName || 'Fighter Jet',
            timestamp: new Date().toISOString(),
            ...SCORE_API_CONFIG.EXTRA_DATA
        };

        const response = await fetch(SCORE_API_CONFIG.API_URL, {
            method: SCORE_API_CONFIG.METHOD,
            headers: SCORE_API_CONFIG.HEADERS,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('HTTP Error ' + response.status + ': ' + response.statusText);
        }

        const result = await response.json().catch(() => ({ status: 'success' }));
        console.log('[sendscoreapi.js] Score submitted successfully:', result);
        return { success: true, result };

    } catch (error) {
        console.error('[sendscoreapi.js] Failed to submit score:', error);
        return { success: false, error: error.message };
    }
}

// গ্লোবাল ব্রাউজার উইন্ডো এক্সপোর্ট
window.sendScoreToApi = sendScoreToApi;
window.SCORE_API_CONFIG = SCORE_API_CONFIG;
