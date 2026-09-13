/**
 * gameover.js
 * 
 * =========================================================================
 * Bee Attack - Game Over Redirect Configuration (গেম ওভার রিডাইরেক্ট কনফিগারেশন)
 * =========================================================================
 * ফুল ধ্বংস হলে (Game Over) প্লেয়ারকে কাঙ্ক্ষিত ওয়েবসাইটে বা URL-এ রিডাইরেক্ট করার সেটিংস।
 */

const GAMEOVER_CONFIG = {
    // ১. গেম ওভার হলে প্লেয়ার যে ওয়েব পেজে যাবে তার সম্পূর্ণ URL এখানে দিন:
    REDIRECT_URL: 'https://your-website.com/game-over',

    // ২. স্বয়ংক্রিয় রিডাইরেক্ট কি চালু রাখবেন? (true = নিজে থেকেই চলে যাবে, false = বন্ধ / রেজাল্ট স্ক্রিনে থাকবে)
    AUTO_REDIRECT: false,

    // ৩. গেম ওভার হওয়ার কত মিলি-সেকেন্ড পর রিডাইরেক্ট হবে? (যেমন 3000 = ৩ সেকেন্ড, যাতে প্লেয়ার নিজের স্কোর দেখতে পায়)
    REDIRECT_DELAY_MS: 3000,

    // ৪. রিডাইরেক্ট লিংকের সাথে কি স্কোর ও টাইমার প্যারামিটার হিসেবে যাবে? (true = পাঠাবে, false = শুধু লিংক)
    // উদাহরণ: https://your-website.com/game-over?score=450&time=01:30&bees=45&coins=20
    PASS_PARAMS_IN_URL: true,

    // ৫. উইন্ডো টার্গেট:
    // '_self' = একই ট্যাবে যাবে, '_blank' = নতুন ট্যাবে ওপেন হবে
    TARGET_WINDOW: '_self'
};

/**
 * গেম ওভারের পর রিডাইরেক্ট সম্পাদন করার মূল ফাংশন
 * @param {Object} gameData - { score, survivalTime, formattedTime, beesDefeated, coins }
 */
function handleGameOverRedirect(gameData = {}) {
    if (!GAMEOVER_CONFIG.AUTO_REDIRECT && !window.__FORCE_REDIRECT__) {
        console.log('[gameover.js] Auto redirect is DISABLED. (Set AUTO_REDIRECT: true in gameover.js to enable auto redirect).');
        return;
    }

    const score = Math.floor(gameData.score || 0);
    const time = encodeURIComponent(gameData.formattedTime || '00:00');
    const bees = gameData.beesDefeated || 0;
    const coins = gameData.coins || 0;

    let targetUrl = GAMEOVER_CONFIG.REDIRECT_URL;

    // URL-এর সাথে স্কোর ও পরিসংখ্যান কুয়েরি প্যারামিটার হিসেবে যোগ করা
    if (GAMEOVER_CONFIG.PASS_PARAMS_IN_URL) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = targetUrl + separator + 'score=' + score + '&time=' + time + '&bees=' + bees + '&coins=' + coins;
    }

    console.log('[gameover.js] Redirecting to: ' + targetUrl + ' in ' + GAMEOVER_CONFIG.REDIRECT_DELAY_MS + 'ms...');

    setTimeout(() => {
        if (GAMEOVER_CONFIG.TARGET_WINDOW === '_blank') {
            window.open(targetUrl, '_blank');
        } else {
            window.location.href = targetUrl;
        }
    }, GAMEOVER_CONFIG.REDIRECT_DELAY_MS);
}

/**
 * রেজাল্ট স্ক্রিনের "Back to Web" বা যেকোনো বাটন ক্লিকে সরাসরি রিডাইরেক্ট ট্রিগার করা
 * @param {Object} gameData 
 */
function triggerManualRedirect(gameData = {}) {
    console.log('[gameover.js] Manual redirect triggered by user.');
    window.__FORCE_REDIRECT__ = true;
    handleGameOverRedirect(gameData);
    window.__FORCE_REDIRECT__ = false;
}

// গ্লোবাল ব্রাউজার অবজেক্ট এক্সপোর্ট
window.handleGameOverRedirect = handleGameOverRedirect;
window.triggerManualRedirect = triggerManualRedirect;
window.GAMEOVER_CONFIG = GAMEOVER_CONFIG;

