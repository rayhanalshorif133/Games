/**
 * gameover.js
 * 
 * =========================================================================
 * গেম ওভার রিডাইরেক্ট কনফিগারেশন ফাইল (Game Over URL Redirection Configuration)
 * =========================================================================
 * বিমান ধ্বংস হলে (Game Over) প্লেয়ারকে কাঙ্ক্ষিত ওয়েবসাইটে বা URL-এ রিডাইরেক্ট করার সেটিংস।
 */

const GAMEOVER_CONFIG = {
    // ১. গেম ওভার হলে প্লেয়ার যে পেজে চলে যাবে তার URL এখানে দিন:
    REDIRECT_URL: 'https://your-website.com/game-over',

    // ২. স্বয়ংক্রিয় রিডাইরেক্ট কি চালু রাখবেন? (true = নিজে থেকেই চলে যাবে, false = বন্ধ / অফ)
    AUTO_REDIRECT: false,

    // ৩. গেম ওভার হওয়ার কত মিলি-সেকেন্ড পর রিডাইরেক্ট হবে? (যেমন 3000 = ৩ সেকেন্ড, যাতে প্লেয়ার নিজের স্কোর দেখতে পায়)
    REDIRECT_DELAY_MS: 3000,

    // ৪. রিডাইরেক্ট লিংকের সাথে কি স্কোর ও টাইমার প্যারামিটার হিসেবে যাবে? (true = পাঠাবে, false = শুধু লিংক)
    // উদাহরণ: https://your-website.com/game-over?score=1250&time=01:45&stars=40
    PASS_PARAMS_IN_URL: true,

    // ৫. উইন্ডো টার্গেট:
    // '_self' = একই ট্যাবে যাবে, '_blank' = নতুন ট্যাবে ওপেন হবে
    TARGET_WINDOW: '_self'
};

/**
 * গেম ওভারের পর রিডাইরেক্ট সম্পাদন করার মূল ফাংশন
 * @param {Object} gameData - { score, survivalTime, formattedTime, stars }
 */
function handleGameOverRedirect(gameData = {}) {
    if (!GAMEOVER_CONFIG.AUTO_REDIRECT && !window.__FORCE_REDIRECT__) {
        console.log('[gameover.js] Auto redirect is DISABLED. (Set AUTO_REDIRECT: true in gameover.js to enable).');
        return;
    }

    const score = Math.floor(gameData.score || 0);
    const time = encodeURIComponent(gameData.formattedTime || '00:00');
    const stars = gameData.stars || 0;

    let targetUrl = GAMEOVER_CONFIG.REDIRECT_URL;

    // URL-এর সাথে স্কোর ও সময় কুয়েরি প্যারামিটার হিসেবে যোগ করা
    if (GAMEOVER_CONFIG.PASS_PARAMS_IN_URL) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        targetUrl = targetUrl + separator + 'score=' + score + '&time=' + time + '&stars=' + stars;
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
 * ইউজার চাইলে যেকোনো বাটন ক্লিকেও সরাসরি রিডাইরেক্ট ট্রিগার করতে পারেন
 */
function triggerManualRedirect(gameData = {}) {
    window.__FORCE_REDIRECT__ = true;
    handleGameOverRedirect(gameData);
    window.__FORCE_REDIRECT__ = false;
}

// গ্লোবাল ব্রাউজার উইন্ডো এক্সপোর্ট
window.handleGameOverRedirect = handleGameOverRedirect;
window.triggerManualRedirect = triggerManualRedirect;
window.GAMEOVER_CONFIG = GAMEOVER_CONFIG;
